import { Entity, Player, Vector3, world } from "@minecraft/server"

export class PlayerDP<T extends string | number | boolean | object> {
    readonly name: string;
    readonly defaultValue: T;

    constructor(name: string, defaultValue: T) {
        this.name = `yb:${name.replace(/^yb:/, '')}`; // 移除開頭的 yb: 避免重複
        this.defaultValue = defaultValue;
    }

    set(player: Player, value: T) {
        if (typeof value === "object") {
            player.setDynamicProperty(this.name, JSON.stringify(value));
        } else {
            player.setDynamicProperty(this.name, value);
        }
    }

    get(player: Player): T {
        const data = player.getDynamicProperty(this.name);

        if (typeof this.defaultValue === "object") {
            return (data ? JSON.parse(data as string) : this.defaultValue) as T;
        }

        return (data as T) ?? this.defaultValue;
    }

    add(player: Player, value: T extends number ? number : never) {
        if (typeof this.defaultValue !== "number") {
            throw new Error("Add method is only available for number type");
        }
        const currentValue = this.get(player) as number;
        this.set(player, (currentValue + value) as T);
        return currentValue + value;
    }
}

export class EntityDP<T extends string | number | boolean | object> {
    readonly name: string;
    readonly defaultValue: T;

    constructor(name: string, defaultValue: T) {
        this.name = `yb:${name.replace(/^yb:/, '')}`; // 移除開頭的 yb: 避免重複
        this.defaultValue = defaultValue;
    }

    set(entity: Entity, value: T) {
        if (typeof value === "object") {
            entity.setDynamicProperty(this.name, JSON.stringify(value));
        } else {
            entity.setDynamicProperty(this.name, value);
        }
    }

    get(entity: Entity): T {
        const data = entity.getDynamicProperty(this.name);

        if (typeof this.defaultValue === "object") {
            return (data ? JSON.parse(data as string) : this.defaultValue) as T;
        }

        return (data as T) ?? this.defaultValue;
    }

    add(entity: Entity, value: T extends number ? number : never) {
        if (typeof this.defaultValue !== "number") {
            throw new Error("Add method is only available for number type");
        }
        const currentValue = this.get(entity) as number;
        this.set(entity, (currentValue + value) as T);
        return currentValue + value;
    }
}

export class WorldDP<T extends string | number | boolean | object> {
    readonly name: string;
    readonly defaultValue: T;

    constructor(name: string, defaultValue: T) {
        this.name = `yb:${name.replace(/^yb:/, '')}`; // 移除開頭的 yb: 避免重複
        this.defaultValue = defaultValue;
    }

    set(value: T) {
        if (typeof value === "object") {
            world.setDynamicProperty(this.name, JSON.stringify(value));
        } else {
            world.setDynamicProperty(this.name, value);
        }
    }

    get(): T {
        const data = world.getDynamicProperty(this.name);

        if (typeof this.defaultValue === "object") {
            return (data ? JSON.parse(data as string) : this.defaultValue) as T;
        }

        return (data as T) ?? this.defaultValue;
    }
}