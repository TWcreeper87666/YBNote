import { MolangVariableMap, Player, system, world } from '@minecraft/server';
import { EntityDP, PlayerDP } from './DynamicProperty';
import { vectorAdd } from './functions';
import { form_modifyNote, form_addNote } from './forms';
import { sounds, REACH_DISTANCE, PITCH, PITCH_COLOR, RENDERING_DISTANCE } from './constants';
import './YB_ChestUI/main';
// 維持原來的
export const PDP_tmpPitchIdx = new PlayerDP('note_tmpPitchIdx', 0);
export const PDP_tmpSoundIdx = new PlayerDP('note_tmpSoundIdx', sounds.length - 1);
export const EDP_pitchIdx = new EntityDP('note_pitchIdx', 12);
export const EDP_sound = new EntityDP('note_sound', 'note.harp');
// Map 改寫後
export const playerUsingPlayMap = new Map();
export const playerFacingEntityMap = new Map();
export const entityPlayedMap = new Map();
export const entityHoldingMap = new Map();
const playingNoteMap = new Map();
const holdingNoteMap = new Map();
let circle_mvm;
let note_mvm;
let facing_circle_mvm;
let particle_mvm;
let particle2_mvm;
system.run(() => {
    circle_mvm = new MolangVariableMap();
    circle_mvm.setColorRGBA('color', { red: 1, green: 0, blue: 0, alpha: 0.5 });
    circle_mvm.setSpeedAndDirection('sad', 0, { x: 0, y: 0, z: 0 });
    circle_mvm.setFloat('size', 0.3);
    circle_mvm.setFloat('max_lifetime', 0.05);
    note_mvm = new MolangVariableMap();
    note_mvm.setColorRGB('note_color', { red: 1, green: 0, blue: 0 });
    facing_circle_mvm = new MolangVariableMap();
    facing_circle_mvm.setColorRGBA('color', { red: 1, green: 1, blue: 1, alpha: 1 });
    facing_circle_mvm.setSpeedAndDirection('sad', 0, { x: 0, y: 0, z: 0 });
    facing_circle_mvm.setFloat('size', 0.3);
    facing_circle_mvm.setFloat('max_lifetime', 0.05);
    particle_mvm = new MolangVariableMap();
    particle_mvm.setColorRGBA('color', { red: 1, green: 1, blue: 1, alpha: 1 });
    particle_mvm.setFloat('size', 0.1);
    particle_mvm.setFloat('max_lifetime', 1);
    particle2_mvm = new MolangVariableMap();
});
// world.beforeEvents.playerInteractWithEntity.subscribe((e)=>{
//     e.cancel=true
//     system.run(()=>{
//         world.sendMessage(e.target.typeId)
//     })
// })
world.afterEvents.itemStartUse.subscribe(({ source, itemStack: { typeId } }) => {
    if (typeId === 'yb:note_play') {
        playerUsingPlayMap.set(source.id, true);
        return;
    }
    if (typeId !== 'yb:note_edit')
        return;
    const entity = source.getEntitiesFromViewDirection({ type: 'yb:note_entity', maxDistance: REACH_DISTANCE })?.[0]?.entity;
    if (entity) {
        if (source.isSneaking) {
            form_modifyNote(source, entity);
        }
        else {
            holdingNoteMap.set(source.id, entity.id);
            entityHoldingMap.set(entity.id, true);
        }
    }
    else {
        form_addNote(source, { pitchIdx: PDP_tmpPitchIdx.get(source), soundIdx: PDP_tmpSoundIdx.get(source) });
    }
});
world.afterEvents.entityHitEntity.subscribe(({ damagingEntity, hitEntity }) => {
    if (!(damagingEntity instanceof Player))
        return;
    if (hitEntity.typeId !== 'yb:note_entity')
        return;
    const itemStack = damagingEntity.getComponent('inventory').container.getItem(damagingEntity.selectedSlotIndex);
    if (itemStack?.typeId === 'yb:note_play') {
        let pitchIdx = EDP_pitchIdx.get(hitEntity);
        const sound = EDP_sound.get(hitEntity);
        pitchIdx = (pitchIdx + (damagingEntity.isSneaking ? -1 : 1) + PITCH.length) % PITCH.length;
        EDP_pitchIdx.set(hitEntity, pitchIdx);
        damagingEntity.playSound(sound, { pitch: PITCH[pitchIdx] });
        note_mvm.setColorRGB('note_color', PITCH_COLOR[pitchIdx]);
        try {
            damagingEntity.spawnParticle('minecraft:note_particle', hitEntity.getHeadLocation(), note_mvm);
        }
        catch { }
    }
    else if (itemStack?.typeId === 'yb:note_edit') {
        hitEntity.remove();
    }
});
world.afterEvents.itemStopUse.subscribe(({ source }) => {
    playerUsingPlayMap.set(source.id, false);
    const holdingNote = holdingNoteMap.get(source.id);
    if (holdingNote) {
        entityHoldingMap.delete(holdingNote);
        holdingNoteMap.delete(source.id);
    }
});
world.afterEvents.playerLeave.subscribe(({ playerId }) => {
    playingNoteMap.delete(playerId);
    playerUsingPlayMap.delete(playerId);
});
world.afterEvents.entityRemove.subscribe(({ removedEntityId }) => {
    entityPlayedMap.delete(removedEntityId);
    entityHoldingMap.delete(removedEntityId);
});
system.runInterval(() => {
    update();
});
function update() {
    const entityMap = new Map();
    world.getAllPlayers().forEach(player => {
        const usingPlay = playerUsingPlayMap.get(player.id);
        const entities = player.dimension.getEntities({ location: player.location, type: 'yb:note_entity', maxDistance: RENDERING_DISTANCE });
        for (const entity of entities)
            entityMap.set(entity.id, entity);
        const hitEntitySet = new Set();
        const playing = playingNoteMap.get(player.id) ?? new Set();
        const itemTypeId = player.getComponent('inventory').container.getItem(player.selectedSlotIndex)?.typeId;
        const hits = player.getEntitiesFromViewDirection({ type: 'yb:note_entity', maxDistance: REACH_DISTANCE });
        if (itemTypeId === 'yb:eui_open' && hits.length > 0) {
            playerFacingEntityMap.set(player.id, hits[0].entity.id);
            player.spawnParticle('yb:circle', hits[0].entity.getHeadLocation(), facing_circle_mvm);
        }
        else {
            playerFacingEntityMap.delete(player.id);
        }
        for (const { entity } of hits) {
            hitEntitySet.add(entity.id);
            if (!usingPlay || entityPlayedMap.get(entity.id))
                continue;
            const pitchIdx = EDP_pitchIdx.get(entity);
            const sound = EDP_sound.get(entity);
            // playsound
            entityPlayedMap.set(entity.id, true);
            player.dimension.playSound(sound, entity.location, { pitch: PITCH[pitchIdx] });
            // particle_mvm.setSpeedAndDirection('sad', 1, { x: Math.random(), y: 5, z: Math.random() })
            // player.spawnParticle('yb:circle', entity.getHeadLocation(), particle_mvm)
            particle2_mvm.setColorRGBA('color', { ...PITCH_COLOR[pitchIdx], alpha: 1 });
            player.spawnParticle('yb:magic2', entity.getHeadLocation(), particle2_mvm);
            playing.add(entity.id);
        }
        const holdingNote = holdingNoteMap.get(player.id);
        if (holdingNote) {
            const view = player.getViewDirection();
            const head = player.getHeadLocation();
            try {
                world.getEntity(holdingNote).teleport(vectorAdd(head, view));
            }
            catch { }
        }
        for (const id of playing) {
            if (hitEntitySet.has(id) && usingPlay)
                continue;
            entityPlayedMap.set(id, false);
            playing.delete(id);
        }
        playingNoteMap.set(player.id, playing);
    });
    for (const entity of entityMap.values()) {
        let color = { red: 0, green: 0, blue: 0, alpha: 0.5 };
        if (entityPlayedMap.get(entity.id) || entityHoldingMap.get(entity.id)) {
            color.red = 1;
            color.green = 1;
            color.blue = 1;
        }
        else {
            color = { ...PITCH_COLOR[EDP_pitchIdx.get(entity)], alpha: 0.5 };
        }
        circle_mvm.setColorRGBA('color', color);
        try {
            entity.dimension.spawnParticle('yb:circle', entity.getHeadLocation(), circle_mvm);
        }
        catch { }
        entity.teleport(entity.location);
    }
}
// setting size, defaultPreview
// fix entity: teleport, component?
// shift+edit drag note
// copy and drag
// async function play(player: Player, notes: { pitchIdx: number, sound: string, timestamp: number }[]) {
//     let overworld = world.getDimension('overworld')
//     const noteMap = new Map<number, Entity>()
//     const entities = overworld.getEntities({ type: 'yb:note_entity', maxDistance: 10, location: player.location })
//     for (const entity of entities) {
//         noteMap.set(EDP_pitchIdx.get(entity), entity)
//     }
//     for (const note of notes) {
//         if (!noteMap.has(note.pitchIdx)) throw new Error('No note entity found')
//     }
//     let tick = 0
//     for (const note of notes) {
//         const entity = noteMap.get(note.pitchIdx)!
//         const sound = EDP_sound.get(entity)
//         player.playSound(sound, { pitch: PITCH[note.pitchIdx] })
//         player.lookAt(entity.location)
//         await system.waitTicks(note.timestamp - tick)
//         tick = note.timestamp
//     }
// }
system.run(() => {
    const overworld = world.getDimension('overworld');
    const entities = overworld.getEntities({ type: 'yb:note_entity' });
    for (const entity of entities) {
        entity.setProperty('yb:color_r', 1);
        entity.setProperty('yb:color_g', 1);
        entity.setProperty('yb:color_b', 0);
        entity.setProperty('yb:color_a', 0.5);
    }
});
