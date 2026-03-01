import { ModalFormData } from "@minecraft/server-ui";
import { PDP_tmpPitchIdx, PDP_tmpSoundIdx } from "./constants";
import { YBNote } from "./YBNote";
import { sounds, PITCH, noteNames } from "./constants";
import { sendMessage } from "./functions";
import { RecordManager } from "./RecordManager";
export async function form_addNote(player, tempValues) {
    const form = new ModalFormData()
        .title("§l§1創建音符")
        .dropdown("§l音調", PITCH.map((_, i) => `${i} ${noteNames[i % 12]}`), { defaultValueIndex: tempValues?.pitchIdx })
        .dropdown("§l音源", sounds, {
        defaultValueIndex: tempValues?.soundIdx ?? sounds.length - 1,
    })
        .toggle("§l預覽", { defaultValue: tempValues?.preview });
    const { canceled, formValues } = await form.show(player);
    if (canceled)
        return;
    const [pitchIdx, soundIdx, preview] = formValues;
    if (preview) {
        player.playSound(sounds[soundIdx], { pitch: PITCH[pitchIdx] });
        form_addNote(player, { pitchIdx, soundIdx, preview });
        return;
    }
    YBNote.spawn(pitchIdx, soundIdx, player);
    PDP_tmpPitchIdx.set(player, pitchIdx);
    PDP_tmpSoundIdx.set(player, soundIdx);
    sendMessage(player, "§b已創建音符!");
}
export async function form_modifyNote(player, entity, tempValues) {
    const { pitchIdx: entityPitchIdx, soundIdx: entitySoundIdx } = YBNote.info(entity);
    const form = new ModalFormData()
        .title("§l§1修改音符")
        .dropdown("§l音調", PITCH.map((_, i) => `${i} ${noteNames[i % 12]}`), { defaultValueIndex: tempValues?.pitchIdx ?? entityPitchIdx })
        .dropdown("§l音源", sounds, {
        defaultValueIndex: tempValues?.soundIdx ?? entitySoundIdx,
    })
        .toggle("§l預覽", { defaultValue: tempValues?.preview });
    const { canceled, formValues } = await form.show(player);
    if (canceled)
        return;
    const [pitchIdx, soundIdx, preview] = formValues;
    if (preview) {
        player.playSound(sounds[soundIdx], { pitch: PITCH[pitchIdx] });
        form_modifyNote(player, entity, { pitchIdx, soundIdx, preview });
        return;
    }
    YBNote.update(entity, { pitchIdx, soundIdx });
    PDP_tmpPitchIdx.set(player, pitchIdx);
    PDP_tmpSoundIdx.set(player, soundIdx);
    sendMessage(player, "§b已修改音符!");
}
export async function form_recordSetting(player) {
    const form = new ModalFormData().title("§l§1錄製設定");
    // 錄製操作下拉選單
    const recordActions = ["開始錄製", "停止錄製", "儲存錄製", "無"];
    let recordDefaultIndex = 3; // 預設為 "無"
    if (RecordManager.isRecording) {
        recordDefaultIndex = 1; // 如果正在錄製，預設為 "停止錄製"
    }
    form.dropdown("§l錄製操作", recordActions, {
        defaultValueIndex: recordDefaultIndex,
    });
    // 播放操作下拉選單
    const playbackActions = ["播放目前錄製", "停止播放", "載入並播放", "無"];
    let playbackDefaultIndex = 3; // 預設為 "無"
    if (RecordManager.isPlaying) {
        playbackDefaultIndex = 1; // 如果正在播放，預設為 "停止播放"
    }
    form.dropdown("§l播放操作", playbackActions, {
        defaultValueIndex: playbackDefaultIndex,
    });
    // 練習模式
    const practiceModes = ["Osu", "掉落", "自動播放"];
    form.dropdown("§l練習模式", practiceModes, {
        defaultValueIndex: RecordManager.playbackMode,
    });
    // 播放速度
    const wasSpeed = RecordManager.playbackSpeed;
    form.textField("§l倍速播放", "請輸入播放速度", {
        defaultValue: wasSpeed.toString(),
    });
    const { canceled, formValues } = await form.show(player);
    if (canceled)
        return;
    const [recordActionIndex, playbackActionIndex, practiceModeIndex, speedStr,] = formValues;
    // 處理錄製操作
    switch (recordActionIndex) {
        case 0: // 開始錄製
            if (!RecordManager.startRecording()) {
                sendMessage(player, "§c已經在錄製中了!");
            }
            else {
                sendMessage(player, `§b已開始錄製!`);
            }
            break;
        case 1: // 停止錄製
            if (!RecordManager.stopRecording()) {
                sendMessage(player, "§c尚未開始錄製!");
            }
            else {
                sendMessage(player, `§b已停止錄製!`);
            }
            break;
        case 2: // 儲存錄製
            if (RecordManager.isRecording) {
                sendMessage(player, "§c請先停止錄製!");
            }
            else if (RecordManager.currentData.length === 0) {
                sendMessage(player, "§c沒有錄製資料可儲存!");
            }
            else {
                form_saveRecord(player);
            }
            break;
    }
    // 處理播放操作
    switch (playbackActionIndex) {
        case 0: // 播放目前錄製
            RecordManager.play(player);
            break;
        case 1: // 停止播放
            RecordManager.stopPlayback(player);
            break;
        case 2: // 載入並播放
            form_loadRecord(player);
            break;
    }
    // 處理練習模式
    if (RecordManager.playbackMode !== practiceModeIndex) {
        RecordManager.playbackMode = practiceModeIndex;
        sendMessage(player, `§b練習模式已設定為 ${practiceModes[practiceModeIndex]}`);
    }
    // 處理播放速度
    const newSpeed = parseFloat(speedStr);
    if (!isNaN(newSpeed) && newSpeed > 0) {
        if (wasSpeed !== newSpeed) {
            RecordManager.playbackSpeed = newSpeed;
            sendMessage(player, `§b播放速度已設定為 ${newSpeed}x`);
        }
    }
    else if (speedStr !== wasSpeed.toString()) {
        sendMessage(player, `§c無效的速度值 "${speedStr}"，將維持 ${wasSpeed}x`);
    }
}
export async function form_saveRecord(player) {
    const form = new ModalFormData()
        .title("§l§1儲存錄製")
        .textField("§l名稱", "請輸入存檔名稱");
    const { canceled, formValues } = await form.show(player);
    if (canceled)
        return;
    const [name] = formValues;
    if (RecordManager.save(name, player.location)) {
        player.sendMessage(`§a成功儲存錄製: ${name} (已優化儲存空間)`);
    }
    else {
        player.sendMessage(`§c儲存失敗，名稱不可為空。`);
    }
}
export async function form_loadRecord(player) {
    const form = new ModalFormData().title("§l§1載入錄製");
    const records = RecordManager.getSavedRecordNames();
    if (records.length === 0) {
        player.sendMessage("§c沒有可用的錄製存檔。");
        return;
    }
    form.dropdown("§l選擇錄製", records);
    const { canceled, formValues } = await form.show(player);
    if (canceled)
        return;
    const [recordIndex] = formValues;
    const recordName = records[recordIndex];
    const loadedData = RecordManager.load(recordName);
    if (loadedData) {
        player.sendMessage(`§a成功載入錄製: ${recordName}`);
        RecordManager.play(player, loadedData.data, loadedData.location);
    }
    else {
        player.sendMessage(`§c載入錄製 ${recordName} 失敗。`);
    }
}
