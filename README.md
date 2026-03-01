# YBNote

## 介紹
- 在立體的空間中擺放你的音符，拼湊出你的音樂！
- 基於麥塊的極限是 0.05 秒，因此實際的體驗並不是很舒服。
- Inspired by: BOCLAA

[![介紹影片](https://img.youtube.com/vi/EovpaqIVAds/maxresdefault.jpg)](https://www.youtube.com/watch?v=EovpaqIVAds)

## 版本
- `@minecraft/server`：`2.5.0`
- `@minecraft/server-ui`：`2.0.0`

## 物品
- `yb:eui_open` 右鍵開啟介面，可修改、創建音符
- `yb:note_play` 右鍵播放音符，左鍵調整音高（蹲下降半音）
- `yb:note_edit` 右鍵移動、創建音符，左鍵移除音符
- `yb:note_record` 開啟錄製選單

## 下載

### YBNote
- [YBNote_bp.mcpack](https://drive.google.com/file/d/1cEJLz34Z_Ew6tnSy6V_8gUhtMV9ouyuH/view?usp=sharing)
- [YBNote_rp.mcpack](https://drive.google.com/file/d/1kJLOiTzUJMy9xnfs0Gahb9rHi5gAzCE9/view?usp=sharing)
- [YBNote.mcaddon](https://drive.google.com/file/d/1cFmwbAqW9Nh65WXsRFjVuDDtZI8Oai9H/view?usp=sharing)
- [YBNoteEng.mcaddon](https://drive.google.com/file/d/1KXSsvM9_bhwxFy-TROdgbZ-q5SXTBDeQ/view?usp=sharing)

## TODO
- [x] ChestUI 新增上一個sound按鈕
- [x] record store player location 
- [x] stop playing record 
- [x] record auto-play animation
- [ ] mutiplayer test
- [ ] remove yb:note_edit form, add a form to change holding distance
- [ ] export music using structure (store in entity dynamicProperty)
- [ ] play record: lifetime(osu mode), height(lane mode) change with bpm
- [ ] 添加帥到爆炸的粒子

## BUG
- [x] chestUI編輯entity 不切換手中物品不會更新pitch, sound
- [x] 手機版 ChestUI 無法挑選音調?
