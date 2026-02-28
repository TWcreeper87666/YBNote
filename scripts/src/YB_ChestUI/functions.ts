import { ItemStack, Player } from "@minecraft/server";
import { Button } from "./classes/Button";
import { ButtonsWithIndex } from "./classes/Page";

export function givePlayerItem(player: Player, item: ItemStack) {
    const container = player.getComponent('inventory').container
    if (container.addItem(item)) {
        player.dimension.spawnItem(item, player.location)
    }
}

export function sendMessage(player: Player, message: string) {
    player.onScreenDisplay.setActionBar(message)
}

export function getBorderButtonAndIdxs(width: number, button: Button, fromIdx: number, toIdx: number, obj: ButtonsWithIndex = {}) {
    const startRow = Math.floor(fromIdx / width);
    const startCol = fromIdx % width;
    const endRow = Math.floor(toIdx / width);
    const endCol = toIdx % width;

    for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
            const currentIdx = row * width + col;

            if (row === startRow || row === endRow || col === startCol || col === endCol) {
                obj[currentIdx] = button;
            }
        }
    }

    return obj;
}

export function addLore(item: ItemStack, ...value: string[]) {
    const loreList = item.getLore()
    loreList.push(...value)
    item.setLore(loreList)
}