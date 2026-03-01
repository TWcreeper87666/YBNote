import { Player, Entity, world, Vector3 } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { PDP_tmpPitchIdx, PDP_tmpSoundIdx } from "./constants";
import { YBNote } from "./YBNote";
import { sounds, PITCH, noteNames, PITCH_COLOR } from "./constants";
import { sendMessage } from "./functions";
import { RecordManager } from "./RecordManager";

export async function form_addNote(
  player: Player,
  tempValues?: { pitchIdx?: number; soundIdx?: number; preview?: boolean },
) {
  const form = new ModalFormData()
    .title("§l§1Create Note")
    .dropdown(
      "§lPitch",
      PITCH.map((_, i) => `${i} ${noteNames[i % 12]}`),
      { defaultValueIndex: tempValues?.pitchIdx },
    )
    .dropdown("§lSound", sounds, {
      defaultValueIndex: tempValues?.soundIdx ?? sounds.length - 1,
    })
    .toggle("§lPreview", { defaultValue: tempValues?.preview });
  const { canceled, formValues } = await form.show(player);
  if (canceled) return;

  const [pitchIdx, soundIdx, preview] = formValues as [number, number, boolean];
  if (preview) {
    player.playSound(sounds[soundIdx], { pitch: PITCH[pitchIdx] });
    form_addNote(player, { pitchIdx, soundIdx, preview });
    return;
  }

  YBNote.spawn(pitchIdx, soundIdx, player);

  PDP_tmpPitchIdx.set(player, pitchIdx);
  PDP_tmpSoundIdx.set(player, soundIdx);
  sendMessage(player, "§bNote created!");
}

export async function form_modifyNote(
  player: Player,
  entity: Entity,
  tempValues?: { pitchIdx?: number; soundIdx?: number; preview?: boolean },
) {
  const { pitchIdx: entityPitchIdx, soundIdx: entitySoundIdx } =
    YBNote.info(entity);

  const form = new ModalFormData()
    .title("§l§1Edit Note")
    .dropdown(
      "§l音調",
      PITCH.map((_, i) => `${i} ${noteNames[i % 12]}`),
      { defaultValueIndex: tempValues?.pitchIdx ?? entityPitchIdx },
    )
    .dropdown("§lSound", sounds, {
      defaultValueIndex: tempValues?.soundIdx ?? entitySoundIdx,
    })
    .toggle("§lPreview", { defaultValue: tempValues?.preview });
  const { canceled, formValues } = await form.show(player);
  if (canceled) return;

  const [pitchIdx, soundIdx, preview] = formValues as [number, number, boolean];
  if (preview) {
    player.playSound(sounds[soundIdx], { pitch: PITCH[pitchIdx] });
    form_modifyNote(player, entity, { pitchIdx, soundIdx, preview });
    return;
  }

  YBNote.update(entity, { pitchIdx, soundIdx });

  PDP_tmpPitchIdx.set(player, pitchIdx);
  PDP_tmpSoundIdx.set(player, soundIdx);
  sendMessage(player, "§bNote updated!");
}

export async function form_recordSetting(player: Player) {
  const form = new ModalFormData().title("§l§1Recording Settings");

  // Record action dropdown
  const recordActions = ["Start Recording", "Stop Recording", "Save Recording", "None"];
  let recordDefaultIndex = 3; // default to "None"
  if (RecordManager.isRecording) {
    recordDefaultIndex = 1; // if recording, default to "Stop Recording"
  }
  form.dropdown("§lRecord Action", recordActions, {
    defaultValueIndex: recordDefaultIndex,
  });

  // Playback action dropdown
  const playbackActions = ["Play Current Recording", "Stop Playback", "Load & Play", "None"];
  let playbackDefaultIndex = 3; // default to "None"
  if (RecordManager.isPlaying) {
    playbackDefaultIndex = 1; // if playing, default to "Stop Playback"
  }
  form.dropdown("§lPlayback Action", playbackActions, {
    defaultValueIndex: playbackDefaultIndex,
  });

  // Practice modes
  const practiceModes = ["Osu", "Lane", "Auto-play"];
  form.dropdown("§lPractice Mode", practiceModes, {
    defaultValueIndex: RecordManager.playbackMode,
  });
  
  // Playback speed
  const wasSpeed = RecordManager.playbackSpeed;
  form.textField("§lPlayback Speed", "Enter playback speed", {
    defaultValue: wasSpeed.toString(),
  });

  const { canceled, formValues } = await form.show(player);
  if (canceled) return;

  const [
    recordActionIndex,
    playbackActionIndex,
    practiceModeIndex,
    speedStr,
  ] = formValues as [number, number, number, string];

  // Handle record action
  switch (recordActionIndex) {
    case 0: // Start recording
      if (!RecordManager.startRecording()) {
        sendMessage(player, "§cAlready recording!");
      } else {
        sendMessage(player, `§bRecording started!`);
      }
      break;
    case 1: // Stop recording
      if (!RecordManager.stopRecording()) {
        sendMessage(player, "§cNot recording!");
      } else {
        sendMessage(player, `§bRecording stopped!`);
      }
      break;
    case 2: // Save recording
      if (RecordManager.isRecording) {
        sendMessage(player, "§cPlease stop recording first!");
      } else if (RecordManager.currentData.length === 0) {
        sendMessage(player, "§cNo recorded data to save!");
      } else {
        form_saveRecord(player);
      }
      break;
  }

  // Handle playback action
  switch (playbackActionIndex) {
    case 0: // Play current recording
      RecordManager.play(player);
      break;
    case 1: // Stop playback
      RecordManager.stopPlayback(player);
      break;
    case 2: // Load & play
      form_loadRecord(player);
      break;
  }

  // Handle practice mode
  if (RecordManager.playbackMode !== practiceModeIndex) {
    RecordManager.playbackMode = practiceModeIndex;
    sendMessage(
      player,
      `§bPractice mode set to ${practiceModes[practiceModeIndex]}`,
    );
  }

  // Handle playback speed
  const newSpeed = parseFloat(speedStr);
  if (!isNaN(newSpeed) && newSpeed > 0) {
    if (wasSpeed !== newSpeed) {
      RecordManager.playbackSpeed = newSpeed;
      sendMessage(player, `§bPlayback speed set to ${newSpeed}x`);
    }
  } else if (speedStr !== wasSpeed.toString()) {
    sendMessage(player, `§cInvalid speed value "${speedStr}", keeping ${wasSpeed}x`);
  }
}

export async function form_saveRecord(player: Player) {
  const form = new ModalFormData()
    .title("§l§1儲存錄製")
    .textField("§l名稱", "請輸入存檔名稱");
  const { canceled, formValues } = await form.show(player);
  if (canceled) return;
  const [name] = formValues as [string];

  if (RecordManager.save(name, player.location)) {
    player.sendMessage(`§a成功儲存錄製: ${name} (已優化儲存空間)`);
  } else {
    player.sendMessage(`§c儲存失敗，名稱不可為空。`);
  }
}

export async function form_loadRecord(player: Player) {
  const form = new ModalFormData().title("§l§1載入錄製");
  const records = RecordManager.getSavedRecordNames();

  if (records.length === 0) {
    player.sendMessage("§c沒有可用的錄製存檔。");
    return;
  }

  form.dropdown("§l選擇錄製", records);

  const { canceled, formValues } = await form.show(player);
  if (canceled) return;

  const [recordIndex] = formValues as [number];
  const recordName = records[recordIndex];

  const loadedData = RecordManager.load(recordName);

  if (loadedData) {
    player.sendMessage(`§a成功載入錄製: ${recordName}`);
    RecordManager.play(player, loadedData.data, loadedData.location);
  } else {
    player.sendMessage(`§c載入錄製 ${recordName} 失敗。`);
  }
}
