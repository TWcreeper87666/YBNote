import { MolangVariableMap, } from "@minecraft/server";
import { sounds, PITCH, PITCH_COLOR, noteNames, REACH_DISTANCE, } from "../constants";
import { vectorOffset } from "../functions";
import { Button, ChestUI, Page, Size, UpdateType } from "./classes/ChestUI";
import { PDP_tmpPitchIdx, PDP_tmpSoundIdx } from "../constants";
import { YBNote } from "../YBNote";
const noteBlockSoundMap = {
    "note.bass": "oak_planks",
    "note.snare": "sand",
    "note.hat": "glass",
    "note.bd": "stone",
    "note.bell": "gold_block",
    "note.flute": "clay",
    "note.chime": "packed_ice",
    "note.guitar": "wool",
    "note.xylophone": "bone_block",
    "note.iron_xylophone": "iron_block",
    "note.cow_bell": "soul_sand",
    "note.didgeridoo": "pumpkin",
    "note.bit": "emerald_block",
    "note.banjo": "hay_block",
    "note.pling": "glowstone",
    "note.harp": "grass_block",
};
const SAVE_BTN_IDX = 47;
const SOUND_SLOTS_START = 37;
const SOUND_SLOTS_COUNT = 4;
const SOUND_SLOT_LEFT_ARROW = 36;
const SOUND_SLOT_RIGHT_ARROW = 41;
function getNoteName(pitchIdx) {
    return noteNames[pitchIdx % 12];
}
function getNoteAndColor(pitchIdx) {
    const note = getNoteName(pitchIdx);
    const color = note.includes("#") ? "black_wool" : "white_wool";
    return { note, color };
}
ChestUI.setUIPage("piano", new Page(pageInit(), {
    displayName: "音符編輯",
    size: Size.piano,
    start: ({ player }) => {
        let pitchIdx, soundIdx;
        const entity = YBNote.get(player);
        if (entity) {
            ({ pitchIdx, soundIdx } = YBNote.info(entity));
        }
        else {
            pitchIdx = PDP_tmpPitchIdx.get(player);
            soundIdx = PDP_tmpSoundIdx.get(player);
        }
        const soundPageIdx = Math.floor(soundIdx / SOUND_SLOTS_COUNT);
        ChestUI.setPageItem(player, {
            [pitchIdx]: ChestUI.newUIItem(getNoteName(pitchIdx), "yellow_wool"),
        });
        const data = { pitchIdx, soundIdx, soundPageIdx };
        updateSound(player, data, false);
        ChestUI.setData(player, data);
    },
    open({ player, container_e }) {
        const targetEntity = player.getEntitiesFromViewDirection({
            type: "yb:note_entity",
            maxDistance: REACH_DISTANCE,
        })?.[0]?.entity;
        const slot = container_e.getSlot(SAVE_BTN_IDX);
        if (targetEntity) {
            const data = {
                ...YBNote.info(targetEntity),
                soundPageIdx: 0,
            };
            updateFunc({ player, idx: data.pitchIdx, soundIdx: data.soundIdx });
            updateSound(player, data, false);
            ChestUI.setData(player, data);
            slot.nameTag = "§r修改音符";
        }
        else {
            slot.nameTag = "§r新增音符";
        }
    },
}));
function pageInit() {
    const obj = {};
    for (let i = 0; i < PITCH.length; i++) {
        const { note, color } = getNoteAndColor(i);
        obj[i] = new Button(note, color, {
            onClick: updateFunc,
            clickSound: "",
            updateType: UpdateType.empty,
        });
    }
    obj[SOUND_SLOT_LEFT_ARROW] = new Button("◄", "arrow", {
        clickSound: "",
        updateType: UpdateType.empty,
        onClick: ({ player }) => {
            const data = ChestUI.getData(player);
            if (data.soundPageIdx > 0) {
                data.soundPageIdx--;
                ChestUI.setData(player, data);
            }
            updateSound(player, data, false);
        },
    });
    for (let i = 0; i < SOUND_SLOTS_COUNT; i++) {
        const slot = SOUND_SLOTS_START + i;
        obj[slot] = new Button("", "air", {
            clickSound: "",
            updateType: UpdateType.empty,
            onClick: ({ player, idx }) => {
                const data = ChestUI.getData(player);
                const clickedSoundIdx = data.soundPageIdx * SOUND_SLOTS_COUNT + (idx - SOUND_SLOTS_START);
                if (clickedSoundIdx < sounds.length) {
                    data.soundIdx = clickedSoundIdx;
                    ChestUI.setData(player, data);
                    updateSound(player, data, true);
                }
            },
        });
    }
    obj[SOUND_SLOT_RIGHT_ARROW] = new Button("►", "arrow", {
        clickSound: "",
        updateType: UpdateType.empty,
        onClick: ({ player }) => {
            const data = ChestUI.getData(player);
            const maxPage = Math.floor((sounds.length - 1) / SOUND_SLOTS_COUNT);
            if (data.soundPageIdx < maxPage) {
                data.soundPageIdx++;
                ChestUI.setData(player, data);
            }
            updateSound(player, data, false);
        },
    });
    obj[SAVE_BTN_IDX] = new Button("新增音符", "lime_concrete", {
        onClick: ({ player }) => {
            const { pitchIdx, soundIdx } = ChestUI.getData(player);
            const entity = YBNote.get(player);
            if (!entity) {
                YBNote.spawn(pitchIdx, soundIdx, player);
            }
            else {
                YBNote.update(entity, { pitchIdx, soundIdx });
            }
            PDP_tmpPitchIdx.set(player, pitchIdx);
            PDP_tmpSoundIdx.set(player, soundIdx);
            ChestUI.close(player);
        },
    });
    return obj;
}
function updateSound(player, data, playSound = true) {
    if (playSound)
        player.playSound(sounds[data.soundIdx], { pitch: PITCH[data.pitchIdx] });
    const itemsToUpdate = {};
    const startSoundIdx = data.soundPageIdx * SOUND_SLOTS_COUNT;
    // Update sound items
    for (let i = 0; i < SOUND_SLOTS_COUNT; i++) {
        const slot = SOUND_SLOTS_START + i;
        const currentSoundIdx = startSoundIdx + i;
        if (currentSoundIdx < sounds.length) {
            const soundName = sounds[currentSoundIdx];
            const blockType = noteBlockSoundMap[soundName] ?? "grass_block";
            let displayName = soundName;
            if (currentSoundIdx === data.soundIdx) {
                displayName = "§e" + displayName;
            }
            itemsToUpdate[slot] = ChestUI.newUIItem(displayName, blockType);
        }
        else {
            itemsToUpdate[slot] = ChestUI.newUIItem("", "grass_block");
        }
    }
    // Update left arrow
    if (data.soundPageIdx === 0) {
        itemsToUpdate[SOUND_SLOT_LEFT_ARROW] = ChestUI.newUIItem(" ", "barrier");
    }
    else {
        itemsToUpdate[SOUND_SLOT_LEFT_ARROW] = ChestUI.newUIItem("◄", "arrow");
    }
    // Update right arrow
    const maxPage = Math.floor((sounds.length - 1) / SOUND_SLOTS_COUNT);
    if (data.soundPageIdx >= maxPage) {
        itemsToUpdate[SOUND_SLOT_RIGHT_ARROW] = ChestUI.newUIItem(" ", "barrier");
    }
    else {
        itemsToUpdate[SOUND_SLOT_RIGHT_ARROW] = ChestUI.newUIItem("►", "arrow");
    }
    ChestUI.setPageItem(player, itemsToUpdate);
}
function updateFunc({ player, idx, soundIdx, }) {
    const data = ChestUI.getData(player);
    const { note, color } = getNoteAndColor(data.pitchIdx);
    ChestUI.setPageItem(player, {
        [data.pitchIdx]: ChestUI.newUIItem(note, color),
        [idx]: ChestUI.newUIItem(getNoteName(idx), "yellow_wool"),
    });
    data.pitchIdx = idx;
    if (soundIdx !== undefined)
        data.soundIdx = soundIdx;
    ChestUI.setData(player, data);
    player.dimension.playSound(sounds[data.soundIdx], player.location, {
        pitch: PITCH[idx],
    });
    const variabes = new MolangVariableMap();
    variabes.setColorRGB("note_color", PITCH_COLOR[idx]);
    const entity = YBNote.get(player);
    if (entity) {
        entity.dimension.spawnParticle("minecraft:note_particle", entity.location, variabes);
    }
    else {
        player.dimension.spawnParticle("minecraft:note_particle", vectorOffset(player.location, 0, 2), variabes);
    }
}
