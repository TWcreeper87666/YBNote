import { ItemStack, Player, Entity, ItemLockMode, system, world } from "@minecraft/server"
import { givePlayerItem, sendMessage } from "../functions"
import { Page, Size } from "./Page"
import { Button, UpdateType } from "./Button"
import { Register } from "./Register"
import { REACH_DISTANCE } from "../../constants"

export class ChestUI {
    static config = {
        defaultPageName: 'piano' as const,
        defaultClickSound: 'random.click',
        defaultButtonUpdateType: UpdateType.typeId,
        defaultPage: new Page({ 13: new Button('Hello World!\n[defaultPage]', 'bedrock') }),
        defaultPageSize: Size.small
    }

    // Static pages store
    static #pages: { [key: string]: Page } = {
        [ChestUI.config.defaultPageName]: ChestUI.config.defaultPage
    }

    // --- Page management functions ---
    static setUIPage(name: string, page: Page) {
        if (page) {
            this.#pages[name] = page
        } else if (name === this.config.defaultPageName) {
            this.#pages[name] = this.config.defaultPage
        } else {
            delete this.#pages[name]
        }
    }

    static getPage(player: Player) {
        let name = this.getPageName(player)
        if (!(name in this.#pages)) {
            console.log(`page "${name}" does not exist`)
            name = this.config.defaultPageName
            this.#setPageName(player, name)
        }
        return this.#pages[name]
    }

    static setPage(player: Player, name: string) {
        const prePageName = this.getPageName(player)
        if (prePageName in this.#pages) this.#pages[prePageName].quit?.({ playerName: player.name, player })

        const preSize = this.getPage(player).size ?? this.config.defaultPageSize
        if (!this.isUsingUI(player)) return
        if (!(name in this.#pages)) {
            console.log(`page "${name}" does not exist`)
            name = this.config.defaultPageName
        }
        const page = this.#pages[name]
        this.#setPageName(player, name)

        const entity = this.getEntity(player)

        if (preSize !== (page.size ?? this.config.defaultPageSize)) {
            sendMessage(player, '請重新開啟介面!')
            return this.#spawnEntity(player, page)
        }
        if (!entity) return this.#spawnEntity(player, page)
        this.#pageInit(player, entity, page)
    }

    static #pageInit(player: Player, entity: Entity, page: Page) {
        const container_e = entity.getComponent('inventory').container
        // if (!container_e.isValid) return

        const { btnWithIdx, size, start } = page

        for (let i = 0; i < (size ?? this.config.defaultPageSize); i++) {
            const item = container_e.getItem(i)
            if (item && !this.isUIItem(item)) givePlayerItem(player, item)
            container_e.setItem(i, btnWithIdx[i]?.getItem())
        }

        this.setData(player, undefined)
        start?.({ player, container_e })
        player.setDynamicProperty('yb:eui_pageUpdateTick', 0)
    }

    static getPageName(player: Player) {
        return player.getDynamicProperty('yb:eui_page') as string ?? this.config.defaultPageName
    }

    static #setPageName(player: Player, name: string) {
        player.setDynamicProperty('yb:eui_page', name)
    }

    // --- UI Item handling ---
    static isUIItem(item: ItemStack) {
        return item?.lockMode === ItemLockMode.slot
    }

    static toUIItem(item: ItemStack) {
        item.lockMode = ItemLockMode.slot
    }

    static newUIItem(nameTag: string, typeId: string, options: { amount?: number, lore?: string[] } = {}) {
        const item = new ItemStack(typeId)
        item.nameTag = '§r' + nameTag
        const { amount, lore } = options
        if (amount) item.amount = amount
        if (lore) item.setLore(lore)
        this.toUIItem(item)
        return item
    }

    static setPageItem(player: Player, itemsWithIdx: { [key: number]: ItemStack }) {
        const entity = this.getEntity(player)
        if (!entity) return
        const container = entity.getComponent('inventory').container
        // if (!container.isValid) return
        for (const [key, item] of Object.entries(itemsWithIdx)) {
            const slot = parseInt(key)
            const preItem = container.getItem(slot)
            if (preItem && !this.isUIItem(preItem)) givePlayerItem(player, preItem)
            if (item) this.toUIItem(item)
            container.setItem(slot, item)
        }
    }

    // --- Entity management ---
    static getEntity(player: Player) {
        const id = player.getDynamicProperty('yb:eui_entityId') as string
        return id ? world.getEntity(id) : undefined
    }

    static #killEntity(entity: Entity) {
        if (!entity) return false
        const container = entity.getComponent('inventory').container
        for (let i = 0; i < container.size; i++) {
            const item = container.getItem(i)
            if (!item || this.isUIItem(item)) continue
            entity.dimension.spawnItem(item, entity.location)
        }
        entity.triggerEvent('yb:kill')
        return true
    }

    static removeUnownedEntity(entity: Entity) {
        if (!entity || !entity.isValid) return
        const owner = entity.getComponent('tameable').tamedToPlayer
        if (!owner) this.#killEntity(entity)
    }

    static #spawnEntity(player: Player, page = this.getPage(player)) {
        this.#killEntity(this.getEntity(player))
        let entity: Entity
        try {
            entity = player.dimension.spawnEntity('yb:ui_entity' as any, player.getHeadLocation())
        } catch {
            return
        }
        entity.getComponent('tameable').tame(player)
        entity.nameTag = this.#getSizeName(page.size ?? this.config.defaultPageSize) + '§r' + (page.displayName ?? 'ChestUI')
        player.setDynamicProperty('yb:eui_entityId', entity.id)

        this.#pageInit(player, entity, page)
        // if (pageName) this.#setPageName(player, pageName)
        return entity
    }

    static #getSizeName(size: Size) {
        switch (size) {
            case Size.small: return '§l'
            case Size.large: return '§l§a§r§g§e'
            case Size.extra: return '§e§x§t§r§a'
            case Size.piano: return '§p§i§a§n§o'
        }
    }

    // --- UI State management ---
    static isUsingUI(player: Player) {
        try {
            const slot = player.getComponent('inventory').container.getSlot(player.selectedSlotIndex)
            return slot?.typeId === 'yb:eui_open'
        } catch {
            return false
        }
    }

    static getData(player: Player) {
        const data = player.getDynamicProperty('yb:eui_data') as string
        return data ? JSON.parse(data) as { [key: string]: boolean | number | string | object } : {}
    }

    static setData(player: Player, value: { [key: string]: boolean | number | string | object }) {
        player.setDynamicProperty('yb:eui_data', value ? JSON.stringify(value) : undefined)
    }

    // --- UI updates ---
    static update(player: Player) {
        if (!this.isUsingUI(player)) return this.close(player, this.config.defaultPageName)
        let entity = this.getEntity(player)

        const page = this.getPage(player)

        if (!entity) entity = this.#spawnEntity(player, page)
        if (!entity) return
        const container_e = entity.getComponent('inventory').container
        // if (!container_e.isValid) return


        if (page.tickInterval) {
            const pageUpdateTick = player.getDynamicProperty('yb:eui_pageUpdateTick') as number ?? 0
            if (system.currentTick >= pageUpdateTick) {
                player.setDynamicProperty('yb:eui_pageUpdateTick', system.currentTick + page.tickInterval)
                page.update?.({ player, container_e })
            }
        }

        for (const [key, button] of Object.entries(page.btnWithIdx)) {
            const idx = parseInt(key)
            const item = container_e.getItem(idx)
            const btnItem = button.getItem()
            const runAction = button.updateCheck(item, btnItem)
            if (runAction) {
                player.playSound(button.clickSound ?? this.config.defaultClickSound)
                if (button.toPage) {
                    ChestUI.setPage(player, button.toPage)
                    break
                }
                if (item && !ChestUI.isUIItem(item)) givePlayerItem(player, item)
                container_e.setItem(idx, btnItem)
                button.onClick?.({ player, container_e, item: btnItem, idx })
                break
            }
        }

        entity.tryTeleport(player.getHeadLocation())

        this.removeUIItems(player)
    }

    static removeUIItems(player: Player) {
        const container_p = player.getComponent('inventory').container
        for (let i = 0; i < container_p.size; i++) {
            if (this.isUIItem(container_p.getItem(i))) {
                container_p.setItem(i, undefined)
            }
        }

        const cursor_p = player.getComponent('cursor_inventory')
        if (this.isUIItem(cursor_p.item)) cursor_p.clear()
    }

    static close(player: Player, pageName?: string) {
        if (pageName) {
            const prePageName = this.getPageName(player)
            if (prePageName !== pageName && prePageName in this.#pages) {
                this.#pages[prePageName].quit?.({ playerName: player.name, player })
            }
        }
        const entity = this.getEntity(player)
        if (!entity) return
        this.#killEntity(entity)
        this.removeUIItems(player)
        if (pageName) this.#setPageName(player, pageName)
    }

    static keepStateClose(player: Player) {
        const entity = this.getEntity(player)
        if (!entity) return
        const { x, y, z } = entity.location
        entity.teleport({ x, y: y + 100, z })
        sendMessage(player, '請重新開啟介面!')
    }

    static init() {
        world.afterEvents.entityLoad.subscribe(({ entity }) => {
            if (entity.typeId === 'yb:ui_entity') ChestUI.removeUnownedEntity(entity)
        })

        world.afterEvents.worldLoad.subscribe(() => {
            world.getAllPlayers().forEach(player => ChestUI.setPage(player, ChestUI.config.defaultPageName))
            world.getDimension('overworld').getEntities({ type: 'yb:ui_entity' }).forEach(entity => ChestUI.removeUnownedEntity(entity))
        })

        world.beforeEvents.playerLeave.subscribe(async ({ player }) => {
            const entity = ChestUI.getEntity(player)
            const playerName = player.name
            const pageName = ChestUI.getPageName(player)
            ChestUI.#setPageName(player, ChestUI.config.defaultPageName)

            await system.waitTicks(1)
            ChestUI.removeUnownedEntity(entity)
            if (pageName in this.#pages) this.#pages[pageName].quit?.({ playerName })
        })

        world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => { // in case crash?
            if (initialSpawn) ChestUI.setPage(player, ChestUI.config.defaultPageName)
        })

        system.runInterval(() => {
            world.getAllPlayers().forEach(p => ChestUI.update(p))
        })
    }
}

system.run(() => {
    ChestUI.init()
    Register.init()
})

export { Button, Page, Size, UpdateType }