import { Player, system, Vector3, world } from "@minecraft/server";
import { sendMessage, vectorOffset } from "./functions";
import { YBNote } from "./YBNote";
import { PITCH_COLOR, osu_mvm } from "./constants";
import { WorldDP } from "./DynamicProperty";

// Types
type RecordData = {
  location?: Vector3;
  data: { tick: number; entityId: string }[];
};

type RawRecordData = {
  location?: Vector3;
  data: { tick: number; entityId: number }[];
  idMapping: Record<number, string>;
};

const WDP_autoPlayEnabled = new WorldDP<boolean>("record_autoPlay", false);
const WDP_playbackSpeed = new WorldDP<number>("record_playbackSpeed", 1);

export class RecordManager {
  static isRecording: boolean = false;
  static isPlaying: boolean = false;
  static startRecordTick: number = 0;
  static currentData: { tick: number; entityId: string }[] = [];

  static get autoPlayEnabled(): boolean {
    return WDP_autoPlayEnabled.get();
  }

  static get playbackSpeed(): number {
    return WDP_playbackSpeed.get();
  }

  static set playbackSpeed(value: number) {
    WDP_playbackSpeed.set(value);
  }

  // --- Recording ---
  static startRecording(): boolean {
    if (this.isRecording) return false;
    this.isRecording = true;
    this.startRecordTick = system.currentTick;
    this.currentData = [];
    return true;
  }

  static stopRecording(): boolean {
    if (!this.isRecording) return false;
    this.isRecording = false;
    return true;
  }

  static toggleRecording(player: Player): boolean {
    if (this.isRecording) {
      this.stopRecording();
      sendMessage(player, `§b已停止錄製!`);
    } else {
      this.startRecording();
      sendMessage(player, `§b已開始錄製!`);
    }
    return this.isRecording;
  }

  static recordNote(entityId: string) {
    if (!this.isRecording) return;
    this.currentData.push({
      tick: system.currentTick - this.startRecordTick,
      entityId: entityId,
    });
  }

  // --- Playback ---
  static stopPlayback(player?: Player): boolean {
    if (!this.isPlaying) return false;
    this.isPlaying = false;
    if (player) {
      sendMessage(player, "§b已中斷播放!");
    }
    return true;
  }

  static async play(
    player: Player,
    data?: { tick: number; entityId: string }[],
    location?: Vector3,
  ) {
    const playData = data ?? this.currentData;
    if (playData.length === 0) {
      sendMessage(player, "§c沒有可播放的錄製資料。");
      return;
    }
    if (this.isPlaying) {
      sendMessage(player, "§c目前正在播放錄製中，無法重複播放!");
      return;
    }

    if (location) {
      player.teleport(location);
      await system.waitTicks(20);
    }

    this.isPlaying = true;
    sendMessage(player, "§b已開始播放!");

    const sortedData = [...playData].sort((a, b) => a.tick - b.tick);

    let lastTick = 0;
    for (const record of sortedData) {
      if (!this.isPlaying) break;

      const waitTicks = Math.floor((record.tick - lastTick) / this.playbackSpeed);
      if (waitTicks > 0) {
        await system.waitTicks(waitTicks);
      }

      if (!this.isPlaying) break;
      lastTick = record.tick;

      const entity = world.getEntity(record.entityId);
      if (entity) {
        if (this.autoPlayEnabled) {
          // 自動播放開啟：播放音效
          YBNote.play(entity, true);
        } else {
          // 自動播放關閉：顯示粒子效果
          const { pitchIdx } = YBNote.info(entity);
          osu_mvm.setColorRGBA("color", {
            ...PITCH_COLOR[pitchIdx],
            alpha: 1,
          });
          entity.dimension.spawnParticle(
            "yb:note_osu", // 'yb:note_lane_down'
            vectorOffset(entity.getHeadLocation(), 0, 0.05),
            osu_mvm,
          );
        }
      }
    }

    if (this.isPlaying) {
      // Playback completed normally
      await system.waitTicks(60);
      this.isPlaying = false;
      sendMessage(player, "§b播放結束!");
    }
  }

  // --- Data Management (Save/Load) ---
  static save(name: string, location: Vector3): boolean {
    if (!name || name.trim() === "") return false;

    const uniqueIds = Array.from(
      new Set(this.currentData.map((d) => d.entityId)),
    );
    const idMapping: Record<number, string> = {};
    const strToNumMap = new Map<string, number>();

    uniqueIds.forEach((id, index) => {
      idMapping[index] = id;
      strToNumMap.set(id, index);
    });

    const rawData: RawRecordData = {
      location: location,
      idMapping: idMapping,
      data: this.currentData.map((d) => ({
        tick: d.tick,
        entityId: strToNumMap.get(d.entityId)!,
      })),
    };

    world.setDynamicProperty("yb:note_record_" + name, JSON.stringify(rawData));
    return true;
  }

  static load(name: string): RecordData | undefined {
    const rawJson = world.getDynamicProperty(
      "yb:note_record_" + name,
    ) as string;
    if (!rawJson) return undefined;

    const rawData = JSON.parse(rawJson) as RawRecordData;

    const restoredData: RecordData = {
      location: rawData.location,
      data: rawData.data.map((d) => ({
        tick: d.tick,
        entityId: rawData.idMapping[d.entityId],
      })),
    };

    this.currentData = restoredData.data;
    return restoredData;
  }

  static getSavedRecordNames(): string[] {
    return world
      .getDynamicPropertyIds()
      .filter((id) => id.startsWith("yb:note_record_"))
      .map((id) => id.replace("yb:note_record_", ""));
  }

  // --- Auto Play ---
  static toggleAutoPlay(player: Player): boolean {
    const newValue = !this.autoPlayEnabled;
    WDP_autoPlayEnabled.set(newValue);
    sendMessage(
      player,
      `§b自動播放模式已${newValue ? "§a開啟" : "§c關"}`,
    );
    return newValue;
  }
}
