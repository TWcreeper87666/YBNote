var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _a, _ChestUI_pages, _ChestUI_pageInit, _ChestUI_setPageName, _ChestUI_killEntity, _ChestUI_spawnEntity, _ChestUI_getSizeName;
import { ItemStack, ItemLockMode, system, world, } from "@minecraft/server";
import { givePlayerItem, sendMessage } from "../functions";
import { Page, Size } from "./Page";
import { Button, UpdateType } from "./Button";
export class ChestUI {
    // --- Page management functions ---
    static setUIPage(name, page) {
        if (page) {
            __classPrivateFieldGet(this, _a, "f", _ChestUI_pages)[name] = page;
        }
        else if (name === this.config.defaultPageName) {
            __classPrivateFieldGet(this, _a, "f", _ChestUI_pages)[name] = this.config.defaultPage;
        }
        else {
            delete __classPrivateFieldGet(this, _a, "f", _ChestUI_pages)[name];
        }
    }
    static getPage(player) {
        let name = this.getPageName(player);
        if (!(name in __classPrivateFieldGet(this, _a, "f", _ChestUI_pages))) {
            console.log(`page "${name}" does not exist`);
            name = this.config.defaultPageName;
            __classPrivateFieldGet(this, _a, "m", _ChestUI_setPageName).call(this, player, name);
        }
        return __classPrivateFieldGet(this, _a, "f", _ChestUI_pages)[name];
    }
    static setPage(player, name) {
        const prePageName = this.getPageName(player);
        if (prePageName in __classPrivateFieldGet(this, _a, "f", _ChestUI_pages))
            __classPrivateFieldGet(this, _a, "f", _ChestUI_pages)[prePageName].quit?.({ playerName: player.name, player });
        const preSize = this.getPage(player).size ?? this.config.defaultPageSize;
        if (!this.isUsingUI(player))
            return;
        if (!(name in __classPrivateFieldGet(this, _a, "f", _ChestUI_pages))) {
            console.log(`page "${name}" does not exist`);
            name = this.config.defaultPageName;
        }
        const page = __classPrivateFieldGet(this, _a, "f", _ChestUI_pages)[name];
        __classPrivateFieldGet(this, _a, "m", _ChestUI_setPageName).call(this, player, name);
        const entity = this.getEntity(player);
        if (preSize !== (page.size ?? this.config.defaultPageSize)) {
            sendMessage(player, "Please reopen the UI!");
            return __classPrivateFieldGet(this, _a, "m", _ChestUI_spawnEntity).call(this, player, page);
        }
        if (!entity)
            return __classPrivateFieldGet(this, _a, "m", _ChestUI_spawnEntity).call(this, player, page);
        __classPrivateFieldGet(this, _a, "m", _ChestUI_pageInit).call(this, player, entity, page);
    }
    static getPageName(player) {
        return (player.getDynamicProperty("yb:eui_page") ??
            this.config.defaultPageName);
    }
    // --- UI Item handling ---
    static isUIItem(item) {
        return item?.lockMode === ItemLockMode.slot;
    }
    static toUIItem(item) {
        item.lockMode = ItemLockMode.slot;
    }
    static newUIItem(nameTag, typeId, options = {}) {
        const item = new ItemStack(typeId);
        item.nameTag = "§r" + nameTag;
        const { amount, lore } = options;
        if (amount)
            item.amount = amount;
        if (lore)
            item.setLore(lore);
        this.toUIItem(item);
        return item;
    }
    static setPageItem(player, itemsWithIdx) {
        const entity = this.getEntity(player);
        if (!entity)
            return;
        const container = entity.getComponent("inventory").container;
        // if (!container.isValid) return
        for (const [key, item] of Object.entries(itemsWithIdx)) {
            const slot = parseInt(key);
            const preItem = container.getItem(slot);
            if (preItem && !this.isUIItem(preItem))
                givePlayerItem(player, preItem);
            if (item)
                this.toUIItem(item);
            container.setItem(slot, item);
        }
    }
    // --- Entity management ---
    static getEntity(player) {
        const id = player.getDynamicProperty("yb:eui_entityId");
        return id ? world.getEntity(id) : undefined;
    }
    static removeUnownedEntity(entity) {
        if (!entity || !entity.isValid)
            return;
        const owner = entity.getComponent("tameable").tamedToPlayer;
        if (!owner)
            __classPrivateFieldGet(this, _a, "m", _ChestUI_killEntity).call(this, entity);
    }
    // --- UI State management ---
    static isUsingUI(player) {
        try {
            const slot = player
                .getComponent("inventory")
                .container.getSlot(player.selectedSlotIndex);
            return slot?.typeId === "yb:eui_open";
        }
        catch {
            return false;
        }
    }
    static getData(player) {
        const data = player.getDynamicProperty("yb:eui_data");
        return data
            ? JSON.parse(data)
            : {};
    }
    static setData(player, value) {
        player.setDynamicProperty("yb:eui_data", value ? JSON.stringify(value) : undefined);
    }
    // --- UI updates ---
    static update(player) {
        if (!this.isUsingUI(player))
            return this.close(player, this.config.defaultPageName);
        let entity = this.getEntity(player);
        const page = this.getPage(player);
        if (!entity)
            entity = __classPrivateFieldGet(this, _a, "m", _ChestUI_spawnEntity).call(this, player, page);
        if (!entity)
            return;
        const container_e = entity.getComponent("inventory").container;
        // if (!container_e.isValid) return
        if (page.tickInterval) {
            const pageUpdateTick = player.getDynamicProperty("yb:eui_pageUpdateTick") ?? 0;
            if (system.currentTick >= pageUpdateTick) {
                player.setDynamicProperty("yb:eui_pageUpdateTick", system.currentTick + page.tickInterval);
                page.update?.({ player, container_e });
            }
        }
        for (const [key, button] of Object.entries(page.btnWithIdx)) {
            const idx = parseInt(key);
            const item = container_e.getItem(idx);
            const btnItem = button.getItem();
            const runAction = button.updateCheck(item, btnItem);
            if (runAction) {
                player.playSound(button.clickSound ?? this.config.defaultClickSound);
                if (button.toPage) {
                    _a.setPage(player, button.toPage);
                    break;
                }
                if (item && !_a.isUIItem(item))
                    givePlayerItem(player, item);
                container_e.setItem(idx, btnItem);
                button.onClick?.({ player, container_e, item: btnItem, idx });
                break;
            }
        }
        entity.tryTeleport(player.getHeadLocation());
        this.removeUIItems(player);
    }
    static removeUIItems(player) {
        const container_p = player.getComponent("inventory").container;
        for (let i = 0; i < container_p.size; i++) {
            if (this.isUIItem(container_p.getItem(i))) {
                container_p.setItem(i, undefined);
            }
        }
        const cursor_p = player.getComponent("cursor_inventory");
        if (this.isUIItem(cursor_p.item))
            cursor_p.clear();
    }
    static close(player, pageName) {
        if (pageName) {
            const prePageName = this.getPageName(player);
            if (prePageName !== pageName && prePageName in __classPrivateFieldGet(this, _a, "f", _ChestUI_pages)) {
                __classPrivateFieldGet(this, _a, "f", _ChestUI_pages)[prePageName].quit?.({ playerName: player.name, player });
            }
        }
        const entity = this.getEntity(player);
        if (!entity)
            return;
        __classPrivateFieldGet(this, _a, "m", _ChestUI_killEntity).call(this, entity);
        this.removeUIItems(player);
        if (pageName)
            __classPrivateFieldGet(this, _a, "m", _ChestUI_setPageName).call(this, player, pageName);
    }
    static keepStateClose(player) {
        const entity = this.getEntity(player);
        if (!entity)
            return;
        const { x, y, z } = entity.location;
        entity.teleport({ x, y: y + 100, z });
        sendMessage(player, "Please reopen the UI!");
    }
    static init() {
        world.afterEvents.entityLoad.subscribe(({ entity }) => {
            if (entity.typeId === "yb:ui_entity")
                _a.removeUnownedEntity(entity);
        });
        world.afterEvents.worldLoad.subscribe(() => {
            world
                .getAllPlayers()
                .forEach((player) => _a.setPage(player, _a.config.defaultPageName));
            world
                .getDimension("overworld")
                .getEntities({ type: "yb:ui_entity" })
                .forEach((entity) => _a.removeUnownedEntity(entity));
        });
        world.afterEvents.playerInteractWithEntity.subscribe(({ player, target, itemStack }) => {
            if (itemStack?.typeId !== "yb:eui_open")
                return;
            const entity = _a.getEntity(player);
            if (entity?.id !== target.id)
                return;
            const page = this.getPage(player);
            const container_e = entity.getComponent("inventory").container;
            page.open?.({ player, container_e });
        });
        world.beforeEvents.playerLeave.subscribe(async ({ player }) => {
            const entity = _a.getEntity(player);
            const playerName = player.name;
            const pageName = _a.getPageName(player);
            __classPrivateFieldGet(_a, _a, "m", _ChestUI_setPageName).call(_a, player, _a.config.defaultPageName);
            await system.waitTicks(1);
            _a.removeUnownedEntity(entity);
            if (pageName in __classPrivateFieldGet(this, _a, "f", _ChestUI_pages))
                __classPrivateFieldGet(this, _a, "f", _ChestUI_pages)[pageName].quit?.({ playerName });
        });
        world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
            // in case crash?
            if (initialSpawn)
                _a.setPage(player, _a.config.defaultPageName);
        });
        system.runInterval(() => {
            world.getAllPlayers().forEach((p) => _a.update(p));
        });
    }
}
_a = ChestUI, _ChestUI_pageInit = function _ChestUI_pageInit(player, entity, page) {
    const container_e = entity.getComponent("inventory").container;
    // if (!container_e.isValid) return
    const { btnWithIdx, size, start } = page;
    for (let i = 0; i < (size ?? this.config.defaultPageSize); i++) {
        const item = container_e.getItem(i);
        if (item && !this.isUIItem(item))
            givePlayerItem(player, item);
        container_e.setItem(i, btnWithIdx[i]?.getItem());
    }
    this.setData(player, undefined);
    start?.({ player, container_e });
    player.setDynamicProperty("yb:eui_pageUpdateTick", 0);
}, _ChestUI_setPageName = function _ChestUI_setPageName(player, name) {
    player.setDynamicProperty("yb:eui_page", name);
}, _ChestUI_killEntity = function _ChestUI_killEntity(entity) {
    if (!entity)
        return false;
    const container = entity.getComponent("inventory").container;
    for (let i = 0; i < container.size; i++) {
        const item = container.getItem(i);
        if (!item || this.isUIItem(item))
            continue;
        entity.dimension.spawnItem(item, entity.location);
    }
    entity.triggerEvent("yb:kill");
    return true;
}, _ChestUI_spawnEntity = function _ChestUI_spawnEntity(player, page = this.getPage(player)) {
    __classPrivateFieldGet(this, _a, "m", _ChestUI_killEntity).call(this, this.getEntity(player));
    let entity;
    try {
        entity = player.dimension.spawnEntity("yb:ui_entity", player.getHeadLocation());
    }
    catch {
        return;
    }
    entity.getComponent("tameable").tame(player);
    entity.nameTag =
        __classPrivateFieldGet(this, _a, "m", _ChestUI_getSizeName).call(this, page.size ?? this.config.defaultPageSize) +
            "§r" +
            (page.displayName ?? "ChestUI");
    player.setDynamicProperty("yb:eui_entityId", entity.id);
    __classPrivateFieldGet(this, _a, "m", _ChestUI_pageInit).call(this, player, entity, page);
    // if (pageName) this.#setPageName(player, pageName)
    return entity;
}, _ChestUI_getSizeName = function _ChestUI_getSizeName(size) {
    switch (size) {
        case Size.small:
            return "§l";
        case Size.large:
            return "§l§a§r§g§e";
        case Size.extra:
            return "§e§x§t§r§a";
        case Size.piano:
            return "§p§i§a§n§o";
    }
};
ChestUI.config = {
    defaultPageName: "piano",
    defaultClickSound: "random.click",
    defaultButtonUpdateType: UpdateType.typeId,
    defaultPage: new Page({
        13: new Button("Hello World!\n[defaultPage]", "bedrock"),
    }),
    defaultPageSize: Size.small,
};
// Static pages store
_ChestUI_pages = { value: {
        [_a.config.defaultPageName]: _a.config.defaultPage,
    } };
system.run(() => {
    ChestUI.init();
});
export { Button, Page, Size, UpdateType };
