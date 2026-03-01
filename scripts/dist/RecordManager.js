import { system, world } from "@minecraft/server";
import { sendMessage, vectorOffset } from "./functions";
import { YBNote } from "./YBNote";
import { PITCH_COLOR, osu_mvm } from "./constants";
import { WorldDP } from "./DynamicProperty";
// 練習模式: 0=Osu, 1=掉落, 2=自動播放
const WDP_playbackMode = new WorldDP("record_playbackMode", 0);
const WDP_playbackSpeed = new WorldDP("record_playbackSpeed", 1);
export class RecordManager {
    static get playbackMode() {
        return WDP_playbackMode.get();
    }
    static get playbackSpeed() {
        return WDP_playbackSpeed.get();
    }
    static set playbackSpeed(value) {
        WDP_playbackSpeed.set(value);
    }
    static set playbackMode(value) {
        WDP_playbackMode.set(value);
    }
    // --- Recording ---
    static startRecording() {
        if (this.isRecording)
            return false;
        this.isRecording = true;
        this.startRecordTick = system.currentTick;
        this.currentData = [];
        return true;
    }
    static stopRecording() {
        if (!this.isRecording)
            return false;
        this.isRecording = false;
        return true;
    }
    static toggleRecording(player) {
        if (this.isRecording) {
            this.stopRecording();
            sendMessage(player, `§b已停止錄製!`);
        }
        else {
            this.startRecording();
            sendMessage(player, `§b已開始錄製!`);
        }
        return this.isRecording;
    }
    static recordNote(entityId) {
        if (!this.isRecording)
            return;
        this.currentData.push({
            tick: system.currentTick - this.startRecordTick,
            entityId: entityId,
        });
    }
    // --- Playback ---
    static stopPlayback(player) {
        if (!this.isPlaying)
            return false;
        this.isPlaying = false;
        if (player) {
            sendMessage(player, "§b已中斷播放!");
        }
        return true;
    }
    static async play(player, data, location) {
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
            if (!this.isPlaying)
                break;
            const waitTicks = Math.floor((record.tick - lastTick) / this.playbackSpeed);
            if (waitTicks > 0) {
                await system.waitTicks(waitTicks);
            }
            if (!this.isPlaying)
                break;
            lastTick = record.tick;
            const entity = world.getEntity(record.entityId);
            if (entity) {
                const mode = this.playbackMode;
                if (mode === 2) {
                    // 自動播放開啟：播放音效
                    YBNote.play(entity, true);
                }
                else {
                    // 練習模式：顯示粒子效果
                    const { pitchIdx } = YBNote.info(entity);
                    osu_mvm.setColorRGBA("color", {
                        ...PITCH_COLOR[pitchIdx],
                        alpha: 1,
                    });
                    if (mode === 0) {
                        // "Osu"
                        entity.dimension.spawnParticle("yb:note_osu", entity.getHeadLocation(), osu_mvm);
                    }
                    else {
                        // "lane" (mode === 1)
                        entity.dimension.spawnParticle("yb:note_lane_down", vectorOffset(entity.getHeadLocation(), 0, 0.05), osu_mvm);
                    }
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
    static save(name, location) {
        if (!name || name.trim() === "")
            return false;
        const uniqueIds = Array.from(new Set(this.currentData.map((d) => d.entityId)));
        const idMapping = {};
        const strToNumMap = new Map();
        uniqueIds.forEach((id, index) => {
            idMapping[index] = id;
            strToNumMap.set(id, index);
        });
        const rawData = {
            location: location,
            idMapping: idMapping,
            data: this.currentData.map((d) => ({
                tick: d.tick,
                entityId: strToNumMap.get(d.entityId),
            })),
        };
        world.setDynamicProperty("yb:note_record_" + name, JSON.stringify(rawData));
        return true;
    }
    static load(name) {
        const rawJson = world.getDynamicProperty("yb:note_record_" + name);
        if (!rawJson)
            return undefined;
        const rawData = JSON.parse(rawJson);
        const restoredData = {
            location: rawData.location,
            data: rawData.data.map((d) => ({
                tick: d.tick,
                entityId: rawData.idMapping[d.entityId],
            })),
        };
        this.currentData = restoredData.data;
        return restoredData;
    }
    static getSavedRecordNames() {
        return world
            .getDynamicPropertyIds()
            .filter((id) => id.startsWith("yb:note_record_"))
            .map((id) => id.replace("yb:note_record_", ""));
    }
}
RecordManager.isRecording = false;
RecordManager.isPlaying = false;
RecordManager.startRecordTick = 0;
RecordManager.currentData = [];
