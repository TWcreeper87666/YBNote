import { Player, Entity, world, Vector3 } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { PDP_tmpPitchIdx, PDP_tmpSoundIdx } from "./constants";
import { YBNote } from "./YBNote";
import { sounds, PITCH, noteNames, PITCH_COLOR } from "./constants";
import { vectorAdd, sendMessage } from "./functions";
import { currentData, playRecordedData } from "./index";

export async function form_addNote(
  player: Player,
  tempValues?: { pitchIdx?: number; soundIdx?: number; preview?: boolean }
) {
  const form = new ModalFormData()
    .title("§l§1創建音符")
    .dropdown(
      "§l音調",
      PITCH.map((_, i) => `${i} ${noteNames[i % 12]}`),
      { defaultValueIndex: tempValues?.pitchIdx }
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
  tempValues?: { pitchIdx?: number; soundIdx?: number; preview?: boolean }
) {
  const { pitchIdx: entityPitchIdx, soundIdx: entitySoundIdx } =
    YBNote.info(entity);

  const form = new ModalFormData()
    .title("§l§1修改音符")
    .dropdown(
      "§l音調",
      PITCH.map((_, i) => `${i} ${noteNames[i % 12]}`),
      { defaultValueIndex: tempValues?.pitchIdx ?? entityPitchIdx }
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

export async function form_recordSetting(player: Player, isRecording: boolean) {
  const form = new ActionFormData()
    .title("§l§1錄製設定")
    .button("§l儲存")
    .button("§l載入")
    .button("§l播放")
    .button(`§l${isRecording ? "停止" : "開始"}錄製`);
  const { canceled, selection } = await form.show(player);
  if (canceled) return;
  if (selection === 0) {
    form_saveRecord(player);
    return;
  } else if (selection === 1) {
    form_loadRecord(player);
    return;
  }

  return { play: selection === 2, record: selection === 3 };
}

type RecordData = {
  location?: Vector3;
  data: { tick: number; entityId: string }[];
};

type RawRecordData = {
  location?: Vector3;
  data: { tick: number; entityId: number }[];
  idMapping: Record<number, string>;
};

export async function form_saveRecord(player: Player) {
  const form = new ModalFormData()
    .title("§l§1儲存錄製")
    .textField("§l名稱", "");

  const { canceled, formValues } = await form.show(player);
  if (canceled) return;
  const [name] = formValues as [string];

  // --- 轉換邏輯開始 (RecordData -> RawRecordData) ---

  // 1. 建立 ID 對照表
  const uniqueIds = Array.from(new Set(currentData.map((d) => d.entityId)));
  const idMapping: Record<number, string> = {};
  const strToNumMap = new Map<string, number>();

  uniqueIds.forEach((id, index) => {
    idMapping[index] = id;
    strToNumMap.set(id, index);
  });

  // 2. 轉換資料結構
  const rawData: RawRecordData = {
    location: player.location,
    idMapping: idMapping,
    data: currentData.map((d) => ({
      tick: d.tick,
      entityId: strToNumMap.get(d.entityId)!, // 轉為數字 ID
    })),
  };

  // --- 轉換邏輯結束 ---

  world.setDynamicProperty("yb:note_record_" + name, JSON.stringify(rawData));

  player.sendMessage(`§a成功儲存錄製: ${name} (已優化儲存空間)`);
}

export async function form_loadRecord(player: Player) {
  const form = new ModalFormData().title("§l§1載入錄製");
  const records = world
    .getDynamicPropertyIds()
    .filter((id) => id.startsWith("yb:note_record_"));

  if (records.length === 0) {
    player.sendMessage("§c沒有可用的錄製存檔。");
    return;
  }

  form.dropdown(
    "§l選擇錄製",
    records.map((record) => record.replace("yb:note_record_", ""))
  );
  form.textField("§l倍速播放", "", { defaultValue: "1" });

  const { canceled, formValues } = await form.show(player);
  if (canceled) return;

  const rawJson = world.getDynamicProperty(
    records[formValues[0] as number]
  ) as string;

  if (!rawJson) return;

  const speed = parseFloat(formValues[1] as string) || 1;

  // --- 轉換邏輯開始 (RawRecordData -> RecordData) ---

  const rawData = JSON.parse(rawJson) as RawRecordData;

  // 還原資料結構並應用倍速
  const restoredData: RecordData = {
    location: rawData.location,
    data: rawData.data.map((d) => ({
      tick: Math.floor(d.tick / speed), // 同時處理倍速
      entityId: rawData.idMapping[d.entityId], // 將數字 ID 還原為字串
    })),
  };

  // --- 轉換邏輯結束 ---

  // 根據你的 playRecordedData 函式需求傳入參數
  // 如果它需要整個物件：
  playRecordedData(player, restoredData.data, restoredData?.location);

  // 如果它只需要 data 陣列 (根據你原本的代碼邏輯推測可能是這樣)：
  // playRecordedData(player, restoredData.data);
}
