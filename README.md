# YBNote

## Introduction
- Place your notes in 3D space to compose music!
- Because of Minecraft's tick granularity (0.05s), timing may not feel perfectly smooth.
- Inspired by: BOCLAA

[![Demo Video](https://img.youtube.com/vi/EovpaqIVAds/maxresdefault.jpg)](https://www.youtube.com/watch?v=EovpaqIVAds)

## Versions
- `@minecraft/server`: `2.5.0`
- `@minecraft/server-ui`: `2.0.0`

## Items
- `yb:eui_open` Right-click to open the chest UI (edit/create notes)
- `yb:note_play` Right-click to play notes, left-click to change pitch (sneak to lower a semitone)
- `yb:note_edit` Right-click to move/create notes, left-click to remove a note
- `yb:note_record` Open recording menu

## Download

### YBNote
- [YBNoteEng_bp.mcpack](https://drive.google.com/file/d/1zrg9pEcvvKvJv6ybyjYyHjYTm5Joku0S/view?usp=sharing)
- [YBNote_rp.mcpack](https://drive.google.com/file/d/1kJLOiTzUJMy9xnfs0Gahb9rHi5gAzCE9/view?usp=sharing)
- [YBNoteEng.mcaddon](https://drive.google.com/file/d/1KXSsvM9_bhwxFy-TROdgbZ-q5SXTBDeQ/view?usp=sharing)

## TODO
- [x] Add "previous sound" button in ChestUI
- [x] Record store player location
- [x] Stop playing record
- [x] Record auto-play animation
- [ ] Multiplayer test
- [ ] Remove `yb:note_edit` form, add a form to change holding distance
- [ ] Export music using structure (store in entity dynamicProperty)
- [ ] Play record: lifetime (Osu mode), height (lane mode) change with BPM
- [ ] Add fancy particles

## BUGS
- [x] ChestUI editing entity doesn't update pitch/sound when hand item not switched
- [x] Mobile ChestUI cannot select pitch?
