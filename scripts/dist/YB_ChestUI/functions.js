export function givePlayerItem(player, item) {
    const container = player.getComponent('inventory').container;
    if (container.addItem(item)) {
        player.dimension.spawnItem(item, player.location);
    }
}
export function sendMessage(player, message) {
    player.onScreenDisplay.setActionBar(message);
}
export function getBorderButtonAndIdxs(width, button, fromIdx, toIdx, obj = {}) {
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
export function addLore(item, ...value) {
    const loreList = item.getLore();
    loreList.push(...value);
    item.setLore(loreList);
}
