import { MolangVariableMap } from "@minecraft/server";
import { sounds, PITCH, PITCH_COLOR, noteNames } from '../constants';
import { vectorOffset } from "../functions";
import { Button, ChestUI, Page, Size, UpdateType } from "./classes/ChestUI";
import { PDP_tmpPitchIdx, PDP_tmpSoundIdx } from '../constants';
import { YBNote } from "../YBNote";
function getNoteName(pitchIdx) {
    // return `${noteNames[pitchIdx % 12]} ${pitchIdx % 12}`
    return noteNames[pitchIdx % 12];
}
function getNoteAndColor(pitchIdx) {
    const note = getNoteName(pitchIdx);
    const color = note.includes('#') ? 'black_wool' : 'white_wool';
    return { note, color };
}
function getSoundLore(soundIdx) {
    const copy = [...sounds];
    copy[soundIdx] = '§e' + copy[soundIdx];
    return copy;
}
ChestUI.setUIPage('piano', new Page(pageInit(), {
    displayName: '音符編輯',
    size: Size.piano,
    start: ({ player, container_e }) => {
        let pitchIdx, soundIdx;
        const entity = YBNote.get(player);
        if (entity) {
            ({ pitchIdx, soundIdx } = YBNote.info(entity));
        }
        else {
            pitchIdx = PDP_tmpPitchIdx.get(player);
            soundIdx = PDP_tmpSoundIdx.get(player);
        }
        ChestUI.setPageItem(player, {
            [pitchIdx]: ChestUI.newUIItem(getNoteName(pitchIdx), 'yellow_wool'),
        });
        updateSound(player, { pitchIdx, soundIdx }, container_e, false);
        ChestUI.setData(player, { pitchIdx, soundIdx });
    }
}));
function pageInit() {
    const obj = {};
    for (let i = 0; i < PITCH.length; i++) {
        const { note, color } = getNoteAndColor(i);
        obj[i] = new Button(note, color, { onClick: updateFunc, clickSound: '', updateType: UpdateType.empty });
    }
    obj[36] = new Button('切換音色↑', 'magenta_glazed_terracotta', {
        clickSound: '',
        onClick: ({ player, container_e }) => {
            const data = ChestUI.getData(player);
            data.soundIdx = (data.soundIdx - 1 + sounds.length) % sounds.length;
            ChestUI.setData(player, data);
            updateSound(player, data, container_e);
        }
    });
    obj[37] = new Button('音色', 'noteblock', {
        clickSound: '',
        onClick: ({ player, container_e }) => {
            const data = ChestUI.getData(player);
            updateSound(player, data, container_e);
        }
    });
    obj[38] = new Button('切換音色↓', 'magenta_glazed_terracotta', {
        clickSound: '',
        onClick: ({ player, container_e }) => {
            const data = ChestUI.getData(player);
            data.soundIdx = (data.soundIdx + 1) % sounds.length;
            ChestUI.setData(player, data);
            updateSound(player, data, container_e);
        }
    });
    obj[47] = new Button('儲存音符', 'lime_concrete', {
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
        }
    });
    return obj;
}
function updateSound(player, data, container, playSound = true) {
    if (playSound)
        player.playSound(sounds[data.soundIdx]);
    for (let i = 36; i <= 38; i++) {
        const item = container.getItem(i);
        item.setLore(getSoundLore(data.soundIdx));
        container.setItem(i, item);
    }
}
function updateFunc({ player, idx }) {
    const data = ChestUI.getData(player);
    const { note, color } = getNoteAndColor(data.pitchIdx);
    ChestUI.setPageItem(player, {
        [data.pitchIdx]: ChestUI.newUIItem(note, color),
        [idx]: ChestUI.newUIItem(getNoteName(idx), 'yellow_wool')
    });
    data.pitchIdx = idx;
    ChestUI.setData(player, data);
    player.dimension.playSound(sounds[data.soundIdx], player.location, { pitch: PITCH[idx] });
    const variabes = new MolangVariableMap();
    variabes.setColorRGB('note_color', PITCH_COLOR[idx]);
    const entity = YBNote.get(player);
    if (entity) {
        entity.dimension.spawnParticle('minecraft:note_particle', entity.location, variabes);
    }
    else {
        player.dimension.spawnParticle('minecraft:note_particle', vectorOffset(player.location, 0, 2), variabes);
    }
}
