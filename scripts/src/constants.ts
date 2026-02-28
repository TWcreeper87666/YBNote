import { MolangVariableMap, system } from "@minecraft/server";
import { PlayerDP } from "./DynamicProperty";

// pitch=0 是 C4，pitch=9 是 A4 (440Hz)，pitch=24 是 C5
export const PITCH: number[] = Array.from({ length: 36 }, (_, i) =>
  Math.pow(2, (i - 9) / 12)
);

export const PITCH_COLOR = [
  { red: 0.467, green: 0.843, blue: 0.0 },
  { red: 0.547, green: 0.781, blue: 0.0 },
  { red: 0.626, green: 0.714, blue: 0.0 },
  { red: 0.704, green: 0.64, blue: 0.0 },
  { red: 0.774, green: 0.556, blue: 0.0 },
  { red: 0.837, green: 0.47, blue: 0.0 },
  { red: 0.894, green: 0.38, blue: 0.0 },
  { red: 0.94, green: 0.283, blue: 0.0 },
  { red: 0.97, green: 0.188, blue: 0.0 },
  { red: 0.989, green: 0.098, blue: 0.01 },
  { red: 0.995, green: 0.017, blue: 0.051 },
  { red: 0.981, green: 0.0, blue: 0.136 },
  { red: 0.956, green: 0.0, blue: 0.235 },
  { red: 0.915, green: 0.0, blue: 0.34 },
  { red: 0.851, green: 0.0, blue: 0.45 },
  { red: 0.775, green: 0.0, blue: 0.557 },
  { red: 0.686, green: 0.0, blue: 0.659 },
  { red: 0.579, green: 0.0, blue: 0.753 },
  { red: 0.467, green: 0.0, blue: 0.836 },
  { red: 0.352, green: 0.0, blue: 0.908 },
  { red: 0.228, green: 0.0, blue: 0.956 },
  { red: 0.109, green: 0.016, blue: 0.984 },
  { red: 0.007, green: 0.054, blue: 0.993 },
  { red: 0.002, green: 0.176, blue: 0.972 },
  { red: 0.0, green: 0.304, blue: 0.925 },
  { red: 0.0, green: 0.436, blue: 0.858 },
  { red: 0.0, green: 0.57, blue: 0.761 },
  { red: 0.0, green: 0.692, blue: 0.642 },
  { red: 0.0, green: 0.804, blue: 0.511 },
  { red: 0.0, green: 0.898, blue: 0.369 },
  { red: 0.0, green: 0.956, blue: 0.222 },
  { red: 0.031, green: 0.988, blue: 0.096 },
  { red: 0.115, green: 0.988, blue: 0.007 },
  { red: 0.265, green: 0.939, blue: 0.0 },
  { red: 0.422, green: 0.862, blue: 0.0 },
  { red: 0.58, green: 0.757, blue: 0.0 },
];

export const sounds = [
  "note.bass",
  "note.snare",
  "note.hat",
  "note.bd",
  "note.bell",
  "note.flute",
  "note.chime",
  "note.guitar",
  "note.xylophone",
  "note.iron_xylophone",
  "note.cow_bell",
  "note.didgeridoo",
  "note.bit",
  "note.banjo",
  "note.pling",
  "note.harp",
];

export const REACH_DISTANCE = 5;
export const RENDERING_DISTANCE = 10;
export const noteNames = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

export const PDP_tmpPitchIdx = new PlayerDP<number>("note_tmpPitchIdx", 0);
export const PDP_tmpSoundIdx = new PlayerDP<number>(
  "note_tmpSoundIdx",
  sounds.length - 1
);

// === 粒子效果 Molang ===
export let circle_mvm: MolangVariableMap;
export let circle_move_mvm: MolangVariableMap;
export let test4_mvm: MolangVariableMap;
export let test_mvm: MolangVariableMap;
export let note_mvm: MolangVariableMap;
export let highlight_mvm: MolangVariableMap;
export let particle_mvm: MolangVariableMap;
system.run(() => {
  circle_mvm = new MolangVariableMap();
  circle_mvm.setColorRGBA("color", { red: 1, green: 0, blue: 0, alpha: 0.5 });
  circle_mvm.setSpeedAndDirection("sad", 0, { x: 0, y: 0, z: 0 });
  circle_mvm.setFloat("size", 0.3);
  circle_mvm.setFloat("max_lifetime", 0.05);

  circle_move_mvm = new MolangVariableMap();
  circle_move_mvm.setColorRGBA("color", {
    red: 1,
    green: 1,
    blue: 1,
    alpha: 1,
  });
  circle_move_mvm.setSpeedAndDirection("sad", 0, { x: 0, y: 0, z: 0 });
  circle_move_mvm.setFloat("size", 1); // 0.2
  circle_move_mvm.setFloat("max_lifetime", 1);

  test4_mvm = new MolangVariableMap();
  test4_mvm.setFloat("size", 1);

  test_mvm = new MolangVariableMap();
  test_mvm.setColorRGBA("color", { red: 1, green: 1, blue: 1, alpha: 0.005 });
  test_mvm.setSpeedAndDirection("sad", 0, { x: 0, y: 0, z: 0 });
  test_mvm.setFloat("size", 100);
  test_mvm.setFloat("max_lifetime", 0.05);

  note_mvm = new MolangVariableMap();
  note_mvm.setColorRGB("note_color", { red: 1, green: 0, blue: 0 });

  highlight_mvm = new MolangVariableMap();
  highlight_mvm.setColorRGBA("color", { red: 1, green: 1, blue: 1, alpha: 1 });
  highlight_mvm.setSpeedAndDirection("sad", 0, { x: 0, y: 0, z: 0 });
  highlight_mvm.setFloat("size", 0.3);
  highlight_mvm.setFloat("max_lifetime", 0.05);

  particle_mvm = new MolangVariableMap();
  particle_mvm.setColorRGBA("color", { red: 1, green: 1, blue: 1, alpha: 1 });
  particle_mvm.setFloat("size", 0.1);
  particle_mvm.setFloat("max_lifetime", 1);
});
