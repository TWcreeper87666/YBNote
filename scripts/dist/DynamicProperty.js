import { world } from "@minecraft/server";
export class PlayerDP {
    constructor(name, defaultValue) {
        this.name = `yb:${name.replace(/^yb:/, '')}`; // 移除開頭的 yb: 避免重複
        this.defaultValue = defaultValue;
    }
    set(player, value) {
        if (typeof value === "object") {
            player.setDynamicProperty(this.name, JSON.stringify(value));
        }
        else {
            player.setDynamicProperty(this.name, value);
        }
    }
    get(player) {
        const data = player.getDynamicProperty(this.name);
        if (typeof this.defaultValue === "object") {
            return (data ? JSON.parse(data) : this.defaultValue);
        }
        return data ?? this.defaultValue;
    }
    add(player, value) {
        if (typeof this.defaultValue !== "number") {
            throw new Error("Add method is only available for number type");
        }
        const currentValue = this.get(player);
        this.set(player, (currentValue + value));
        return currentValue + value;
    }
}
export class EntityDP {
    constructor(name, defaultValue) {
        this.name = `yb:${name.replace(/^yb:/, '')}`; // 移除開頭的 yb: 避免重複
        this.defaultValue = defaultValue;
    }
    set(entity, value) {
        if (typeof value === "object") {
            entity.setDynamicProperty(this.name, JSON.stringify(value));
        }
        else {
            entity.setDynamicProperty(this.name, value);
        }
    }
    get(entity) {
        const data = entity.getDynamicProperty(this.name);
        if (typeof this.defaultValue === "object") {
            return (data ? JSON.parse(data) : this.defaultValue);
        }
        return data ?? this.defaultValue;
    }
    add(entity, value) {
        if (typeof this.defaultValue !== "number") {
            throw new Error("Add method is only available for number type");
        }
        const currentValue = this.get(entity);
        this.set(entity, (currentValue + value));
        return currentValue + value;
    }
}
export class WorldDP {
    constructor(name, defaultValue) {
        this.name = `yb:${name.replace(/^yb:/, '')}`; // 移除開頭的 yb: 避免重複
        this.defaultValue = defaultValue;
    }
    set(value) {
        if (typeof value === "object") {
            world.setDynamicProperty(this.name, JSON.stringify(value));
        }
        else {
            world.setDynamicProperty(this.name, value);
        }
    }
    get() {
        const data = world.getDynamicProperty(this.name);
        if (typeof this.defaultValue === "object") {
            return (data ? JSON.parse(data) : this.defaultValue);
        }
        return data ?? this.defaultValue;
    }
}
