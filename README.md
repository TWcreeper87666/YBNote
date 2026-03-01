# YBNote

## 介紹
- 在立體的空間中擺放你的音符，拼湊出你的音樂！
- 基於麥塊的極限是 0.05 秒，因此實際的體驗並不是很舒服。
- Inspired by: BOCLAA

<!-- [![介紹影片](https://img.youtube.com/vi/3HCimKeEIN8/maxresdefault.jpg)](https://www.youtube.com/watch?v=3HCimKeEIN8) -->

## 版本
- `@minecraft/server`：`2.5.0`
- `@minecraft/server-ui`：`2.0.0`

## 物品
- `yb:eui_open` 右鍵開啟介面，可修改、創建音符
- `yb:note_play` 右鍵播放音符，左鍵調整音高
- `yb:note_edit` 右鍵移動、創建音符，左鍵移除音符
- `yb:note_record` 開啟錄製選單

## 下載

### YBNote
<!-- - [YB_ChestUI_bp.mcpack](https://drive.google.com/file/d/1mJqsiihfAd2w7Ks2fSigCgk4fO5bAoUq/view?usp=sharing)
- [YB_ChestUI_rp.mcpack](https://drive.google.com/file/d/1Jcxw4wSeKuQIIOPivXvKCtBjbooeu-__/view?usp=sharing)
- [YB_ChestUI.mcaddon](https://drive.google.com/file/d/1A11UyD0mg-YuNSTtIXQc6HwunoeGhdzn/view?usp=drive_link) -->

### TODO
- [x] ChestUI 新增上一個sound按鈕
- [x] record store player location 
- [x] stop playing record 
- [x] record auto-play animation 
- [ ] remove yb:note_edit form, add a form to change holding distance
- [ ] export music using structure (store in entity dynamicProperty)
- [ ] play record: lifetime(osu mode), height(lane mode) change with bpm
- [ ] 添加帥到爆炸的粒子

### BUG
- [x] chestUI編輯entity 不切換手中物品不會更新pitch, sound
