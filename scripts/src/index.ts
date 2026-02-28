import {
  Entity,
  MolangVariableMap,
  Player,
  system,
  Vector3,
  world,
} from "@minecraft/server";
import { sendMessage, vectorAdd, vectorMinus, vectorOffset } from "./functions";
import { form_modifyNote, form_addNote, form_recordSetting } from "./forms";
import {
  circle_move_mvm,
  highlight_mvm,
  note_mvm,
  PDP_tmpPitchIdx,
  PDP_tmpSoundIdx,
  PITCH,
  PITCH_COLOR,
  REACH_DISTANCE,
  RENDERING_DISTANCE,
  test4_mvm,
  test_mvm,
} from "./constants";
import "./YB_ChestUI/main";
import { YBNote, entityPlayedMap } from "./YBNote";

// === 狀態紀錄 ===
// 玩家是否正在使用播放物品（長按右鍵）
export const isPlayerPlaying = new Map<string, boolean>();
// 玩家當前正在播放的實體集合
export const activeNotesByPlayer = new Map<string, Set<string>>();
// 玩家當前拿取中的實體
const heldEntityByPlayer = new Map<string, string>();

let recording = false;
let recordPlaying = false;
let startRecordTick = 0;
export let currentData: { tick: number; entityId: string }[] = [];

/** 停止播放音符並清除狀態 */
export function stopNoteEntity(player: Player, entityId: string) {
  entityPlayedMap.set(entityId, false);
  const activeNotes = activeNotesByPlayer.get(player.id);
  if (activeNotes) {
    activeNotes.delete(entityId);
    activeNotesByPlayer.set(player.id, activeNotes);
  }

  const entity = world.getEntity(entityId);
  if (entity) YBNote.stop(entity);
}

/** 將實體放到玩家視線前方（編輯模式用） */
export function moveEntityToView(player: Player, entity: Entity) {
  const view = player.getViewDirection();
  const head = player.getHeadLocation();
  const location = vectorAdd(head, view);
  entity.teleport(location);

  player.spawnParticle("yb:holding", location);
}

export async function playRecordedData(
  player: Player,
  data: { tick: number; entityId: string }[],
  location?: Vector3
) {
  if (data.length === 0) return;
  currentData = data;
  if (recordPlaying)
    return sendMessage(player, "§c目前正在播放錄製中，無法重複播放!");
  if (location) player.teleport(location);
  await system.waitTicks(20);
  recordPlaying = true;
  let i = 0;
  while (i < data.length) {
    const entity = world.getEntity(data[i].entityId);

    test4_mvm.setColorRGBA("color", {
      ...PITCH_COLOR[YBNote.info(entity).pitchIdx],
      alpha: 1,
    });
    player.spawnParticle(
      "yb:test4",
      vectorOffset(entity.getAABB().center, 0, 0.05),
      test4_mvm
    );

    await system.waitTicks(data[i + 1]?.tick - data[i].tick || 1);
    i++;
  }
  await system.waitTicks(60);
  recordPlaying = false;
  sendMessage(player, "§b播放結束!");
}

// === 事件 ===

// 玩家開始使用物品
world.beforeEvents.itemUse.subscribe(
  async ({ source, itemStack: { typeId } }) => {
    if (typeId === "yb:note_play") {
      isPlayerPlaying.set(source.id, true);
      return;
    }

    if (typeId === "yb:note_edit") {
      const targetEntity = source.getEntitiesFromViewDirection({
        type: "yb:note_entity",
        maxDistance: REACH_DISTANCE,
      })?.[0]?.entity;

      await system.waitTicks(1);

      if (targetEntity) {
        if (source.isSneaking) {
          form_modifyNote(source, targetEntity);
        } else {
          heldEntityByPlayer.set(source.id, targetEntity.id);
        }
      } else {
        form_addNote(source, {
          pitchIdx: PDP_tmpPitchIdx.get(source),
          soundIdx: PDP_tmpSoundIdx.get(source),
        });
      }
      return;
    }
    if (typeId === "yb:note_record") {
      await system.waitTicks(1);

      const response = await form_recordSetting(source, recording);
      if (!response) return;
      if (response.play) {
        sendMessage(source, `§b已開始播放`);
        recording = false;
        playRecordedData(source, currentData);
      } else if (response.record) {
        recording = !recording;
        sendMessage(source, `§b已${recording ? "開始" : "停止"}錄製!`);
        if (recording) {
          startRecordTick = system.currentTick;
          currentData = [];
        }
      }
    }
  }
);

world.beforeEvents.playerInteractWithEntity.subscribe(
  async ({ player, target, itemStack }) => {
    if (itemStack?.typeId !== "yb:note_play") return;

    const hitInfos = player.getEntitiesFromViewDirection({
      type: "yb:note_entity",
      maxDistance: REACH_DISTANCE,
    });

    // 🔹 收集所有命中的實體 ID
    const hitSet = new Set<string>();
    for (const info of hitInfos) {
      if (info?.entity) hitSet.add(info.entity.id);
    }

    await system.waitTicks(1);

    // === 播放邏輯（改為播放多個） ===
    if (hitSet.size > 0) {
      for (const id of hitSet) {
        if (!entityPlayedMap.get(id)) {
          const entity = world.getEntity(id);
          if (!entity) continue;
          YBNote.play(entity);
          entityPlayedMap.set(id, true);

          const activeNotes =
            activeNotesByPlayer.get(player.id) ?? new Set<string>();
          activeNotes.add(id);
          activeNotesByPlayer.set(player.id, activeNotes);
        }
      }
    }

    isPlayerPlaying.set(player.id, true);
  }
);

// 玩家攻擊實體（調整音高或刪除）
world.afterEvents.entityHitEntity.subscribe(({ damagingEntity, hitEntity }) => {
  if (!(damagingEntity instanceof Player)) return;
  if (hitEntity.typeId !== "yb:note_entity") return;

  const itemStack = damagingEntity
    .getComponent("inventory")
    .container.getItem(damagingEntity.selectedSlotIndex);

  if (itemStack?.typeId === "yb:note_play") {
    const pitchIdx = YBNote.info(hitEntity).pitchIdx;
    const change = damagingEntity.isSneaking ? -1 : 1;
    YBNote.update(hitEntity, {
      pitchIdx: (pitchIdx + change + PITCH.length) % PITCH.length,
    });
    YBNote.play(hitEntity, true);

    note_mvm.setColorRGB("note_color", PITCH_COLOR[pitchIdx]);
    try {
      damagingEntity.spawnParticle(
        "minecraft:note_particle",
        hitEntity.getHeadLocation(),
        note_mvm
      );
    } catch {}
  } else if (itemStack?.typeId === "yb:note_edit") {
    hitEntity.remove();
  }
});

// 玩家放開右鍵 → 停止播放
world.afterEvents.itemStopUse.subscribe(({ source }) => {
  isPlayerPlaying.set(source.id, false);
  heldEntityByPlayer.delete(source.id);
});

// 玩家離開或實體被刪除
world.afterEvents.playerLeave.subscribe(({ playerId }) => {
  activeNotesByPlayer.delete(playerId);
  isPlayerPlaying.delete(playerId);
});
world.afterEvents.entityRemove.subscribe(({ removedEntityId }) => {
  entityPlayedMap.delete(removedEntityId);
});

// === 主更新循環 ===
system.runInterval(() => {
  for (const player of world.getAllPlayers()) {
    const isPlaying = isPlayerPlaying.get(player.id);
    const itemTypeId = player
      .getComponent("inventory")
      .container.getItem(player.selectedSlotIndex)?.typeId;

    const hitInfos = player.getEntitiesFromViewDirection({
      type: "yb:note_entity",
      maxDistance: REACH_DISTANCE,
    });

    // 🔹 收集所有命中的實體 ID
    const hitSet = new Set<string>();
    for (const info of hitInfos) {
      if (info?.entity) hitSet.add(info.entity.id);
    }

    // 高亮顯示（可保持單一或多個）
    if (itemTypeId === "yb:eui_open") {
      for (const id of hitSet) {
        const e = world.getEntity(id);
        if (e) player.spawnParticle("yb:target", e.getHeadLocation());
      }
    }

    // === 播放邏輯（改為播放多個） ===
    if (isPlaying && itemTypeId === "yb:note_play" && hitSet.size > 0) {
      for (const id of hitSet) {
        const entity = world.getEntity(id);
        if (!entity) continue;
        if (!entityPlayedMap.get(id)) {
          YBNote.play(entity);
          entityPlayedMap.set(id, true);

          const activeNotes =
            activeNotesByPlayer.get(player.id) ?? new Set<string>();
          activeNotes.add(id);
          activeNotesByPlayer.set(player.id, activeNotes);

          // circle_move_mvm.setColorRGBA("color", {
          //   ...PITCH_COLOR[YBNote.info(entity).pitchIdx],
          //   alpha: 0.1,
          // });
          // // circle_move_mvm.setSpeedAndDirection(
          // //   "sad",
          // //   3,
          // //   player.getViewDirection()
          // // );
          // // circle_move_mvm.setFloat("acc", 100);
          // // circle_move_mvm.setFloat("offset", 100);
          // // circle_move_mvm.setFloat("max_age", 1.5);
          // player.spawnParticle(
          //   "yb:test2",
          //   entity.getHeadLocation(),
          //   circle_move_mvm
          // );

          test_mvm.setColorRGBA("color", {
            ...PITCH_COLOR[YBNote.info(entity).pitchIdx],
            alpha: 0.005,
          });
          player.spawnParticle("yb:circle", entity.getHeadLocation(), test_mvm);

          if (recording) {
            currentData.push({
              tick: system.currentTick - startRecordTick,
              entityId: id,
            });
          }
        }
        if (!recordPlaying) {
          circle_move_mvm.setColorRGBA("color", {
            ...PITCH_COLOR[YBNote.info(entity).pitchIdx],
            alpha: 1,
          });
          player.spawnParticle(
            "yb:test2",
            entity.getHeadLocation(),
            circle_move_mvm
          );
        }
      }
    }

    // === 停止播放邏輯 ===
    const activeNotes = activeNotesByPlayer.get(player.id);
    if (activeNotes) {
      for (const id of [...activeNotes]) {
        const entity = world.getEntity(id);
        // 若該實體不再命中、放開右鍵、或換物品 → 停止
        if (
          !entity ||
          !hitSet.has(id) ||
          !isPlaying ||
          itemTypeId !== "yb:note_play"
        ) {
          stopNoteEntity(player, id);
        }
      }
    }

    // === 移動玩家拿取中的實體 ===
    const heldEntityId = heldEntityByPlayer.get(player.id);
    if (heldEntityId) {
      try {
        const heldEntity = world.getEntity(heldEntityId);
        if (heldEntity) moveEntityToView(player, heldEntity);
      } catch {}
    }
  }
});
