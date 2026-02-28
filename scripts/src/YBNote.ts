import { Entity, MolangVariableMap, Player, system, Vector3, world } from "@minecraft/server"
import { PITCH, PITCH_COLOR, REACH_DISTANCE, sounds } from './constants'
import { vectorAdd } from "./functions"
import { EntityDP } from "./DynamicProperty"

const EDP_pitchIdx = new EntityDP<number>('note_pitchIdx', 12);
const EDP_sound = new EntityDP<string>('note_sound', 'note.harp');

export const entityPlayedMap = new Map<string, boolean>()

export class YBNote {

    static spawn(pitchIdx: number, soundIdx: number, player: Player) {
        const view = player.getViewDirection()
        const head = player.getHeadLocation()
        const entity = player.dimension.spawnEntity('yb:note_entity' as any, vectorAdd(head, view))

        this.update(entity, { pitchIdx, soundIdx })

        return entity
    }

    static get(player: Player) {
        return player.getEntitiesFromViewDirection({
            type: 'yb:note_entity',
            maxDistance: REACH_DISTANCE
        })?.[0]?.entity
    }

    static info(entity: Entity) {
        const sound = EDP_sound.get(entity)

        return {
            pitchIdx: EDP_pitchIdx.get(entity),
            soundIdx: sounds.findIndex(s => s === sound)
        }
    }

    static update(entity: Entity, params: { pitchIdx?: number, soundIdx?: number } = {}) {
        const { pitchIdx, soundIdx } = params

        if (pitchIdx !== undefined) {
            EDP_pitchIdx.set(entity, pitchIdx)

            const color = PITCH_COLOR[pitchIdx]
            entity.setProperty('yb:color_r', color.red)
            entity.setProperty('yb:color_g', color.green)
            entity.setProperty('yb:color_b', color.blue)
        }

        if (soundIdx !== undefined) {
            EDP_sound.set(entity, sounds[soundIdx])
        }
    }

    static async play(entity: Entity, once = false) {
        const pitchIdx = EDP_pitchIdx.get(entity)
        const sound = EDP_sound.get(entity)

        // 1. 播放音效
        entity.dimension.playSound(sound, entity.location, { pitch: PITCH[pitchIdx] })

        // 2. 播放粒子效果
        try {
            const mvm = new MolangVariableMap()
            mvm.setColorRGBA('color', { ...PITCH_COLOR[pitchIdx], alpha: 1 })
            entity.dimension.spawnParticle('yb:note_play', entity.getHeadLocation(), mvm)
        } catch { }

        if (!once) {
            entity.playAnimation('animation.note_entity.played', { nextState: 'test', blendOutTime: 10000 })

            entity.setProperty('yb:color_r', 1)
            entity.setProperty('yb:color_g', 1)
            entity.setProperty('yb:color_b', 1)

            entityPlayedMap.set(entity.id, true)
        }
    }

    static stop(entity: Entity) {
        entityPlayedMap.set(entity.id, false)
        entity.playAnimation('animation.note_entity.played', { nextState: 'test', blendOutTime: 0 })

        const pitchIdx = EDP_pitchIdx.get(entity)
        const color = PITCH_COLOR[pitchIdx]
        entity.setProperty('yb:color_r', color.red)
        entity.setProperty('yb:color_g', color.green)
        entity.setProperty('yb:color_b', color.blue)
    }
}
