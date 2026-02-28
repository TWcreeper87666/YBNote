export function newVector(x, y, z) {
    return { x, y, z };
}
export function vectorEqual(u, v) {
    return u.x === v.x && u.y === v.y && u.z === v.z;
}
export function vectorMinus(u, v) {
    return { x: u.x - v.x, y: u.y - v.y, z: u.z - v.z };
}
export function vectorAdd(...vectors) {
    return vectors.reduce((sum, v) => ({
        x: sum.x + v.x,
        y: sum.y + v.y,
        z: sum.z + v.z,
    }), { x: 0, y: 0, z: 0 });
}
export function vectorMultipy(u, amp) {
    return { x: u.x * amp, y: u.y * amp, z: u.z * amp };
}
export function vectorOffset(vector, dx = 0, dy = 0, dz = 0) {
    const { x, y, z } = vector;
    return { x: x + dx, y: y + dy, z: z + dz };
}
export function vectorFloor(vector) {
    const { x, y, z } = vector;
    return { x: Math.floor(x), y: Math.floor(y), z: Math.floor(z) };
}
export function vectorNormalize(vector) {
    let length = Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
    return {
        x: vector.x / length,
        y: vector.y / length,
        z: vector.z / length
    };
}
/** @param soundId [default] random.orb */
export function sendMessage(target, message, soundId = 'random.orb') {
    target.onScreenDisplay.setActionBar(message); // §l 讓actionbar歪掉的罪魁禍首lol
    if (soundId)
        target.playSound(soundId);
}
