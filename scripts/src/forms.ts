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
    .title("§l§1創建音符")
    .dropdown(
      "§l音調",
      PITCH.map((_, i) => `${i} ${noteNames[i % 12]}`),
      { defaultValueIndex: tempValues?.pitchIdx },
    )
    .dropdown("§l音源", sounds, {
      defaultValueIndex: tempValues?.soundIdx ?? sounds.length - 1,
    })
    .toggle("§l預覽", { defaultValue: tempValues?.preview });
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
  sendMessage(player, "§b已創建音符!");
}

export async function form_modifyNote(
  player: Player,
  entity: Entity,
  tempValues?: { pitchIdx?: number; soundIdx?: number; preview?: boolean },
) {
  const { pitchIdx: entityPitchIdx, soundIdx: entitySoundIdx } =
    YBNote.info(entity);

  const form = new ModalFormData()
    .title("§l§1修改音符")
    .dropdown(
      "§l音調",
      PITCH.map((_, i) => `${i} ${noteNames[i % 12]}`),
      { defaultValueIndex: tempValues?.pitchIdx ?? entityPitchIdx },
    )
    .dropdown("§l音源", sounds, {
      defaultValueIndex: tempValues?.soundIdx ?? entitySoundIdx,
    })
    .toggle("§l預覽", { defaultValue: tempValues?.preview });
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
  sendMessage(player, "§b已修改音符!");
}

export async function form_recordSetting(player: Player) {
  const form = new ActionFormData()
    .title("§l§1錄製設定")
    .button("§l儲存目前錄製")
    .button("§l載入並播放")
    .button("§l播放目前錄製")
    .button(`§l${RecordManager.isRecording ? "停止" : "開始"}錄製`)
    .button(`§l自動播放: ${RecordManager.autoPlayEnabled ? "§a開" : "§c關"}`);
  const { canceled, selection } = await form.show(player);
  if (canceled) return;

  switch (selection) {
    case 0: // Save
      form_saveRecord(player);
      break;
    case 1: // Load
      form_loadRecord(player);
      break;
    case 2: // Play
      RecordManager.play(player);
      break;
    case 3: // Record
      RecordManager.toggleRecording(player);
      break;
    case 4: // Auto Play
      RecordManager.toggleAutoPlay(player);
      break;
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
  form.textField("§l倍速播放", "", { defaultValue: "1" });

  const { canceled, formValues } = await form.show(player);
  if (canceled) return;

  const [recordIndex, speedStr] = formValues as [number, string];
  const recordName = records[recordIndex];
  const speed = parseFloat(speedStr) || 1;

  const loadedData = RecordManager.load(recordName);

  if (loadedData) {
    RecordManager.play(player, loadedData.data, loadedData.location, speed);
  } else {
    player.sendMessage(`§c載入錄製 ${recordName} 失敗。`);
  }
}
