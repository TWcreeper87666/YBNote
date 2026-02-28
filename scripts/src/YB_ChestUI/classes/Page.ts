import {
  Container,
  Entity,
  ItemStack,
  Player,
  system,
} from "@minecraft/server";
import { Button } from "./Button";

export enum Size {
  small = 27,
  large = 54,
  extra = 117,
  piano = 48,
}

export type ButtonsWithIndex = { [key: number]: Button };

export type PageStartFunc = (arg: {
  player: Player;
  container_e: Container;
}) => void;
export type PageUpdateFunc = (arg: {
  player: Player;
  container_e: Container;
}) => void;
export type PageQuitFunc = (arg: {
  playerName: string;
  player?: Player;
}) => void;

export type PageOptions = {
  /** display name */
  displayName?: string;
  /** The size of the UI, defaults to Size.small */
  size?: Size;
  /** Function to execute when the page starts */
  start?: PageStartFunc;
  /**
   * Function to execute when player opened UI
   */
  open?: PageStartFunc;
  /**
   * Function to update the page.
   * Note: The update function will only run if `tickInterval` is set to a number.
   */
  update?: PageUpdateFunc;
  /**
   * The tick interval at which the update function runs, defaults to undefined.
   * If a number is set, the update function will be executed.
   */
  tickInterval?: number;
  /**
   * Function to execute when the page is closed.
   * This can be used to clean up resources or handle exit logic.
   */
  quit?: PageQuitFunc;
};

export class Page {
  displayName?: string;
  btnWithIdx?: ButtonsWithIndex;
  size?: Size;
  start?: PageStartFunc;
  open?: PageStartFunc;
  update?: PageUpdateFunc;
  tickInterval?: number;
  quit?: PageQuitFunc;

  constructor(btnWithIdx?: ButtonsWithIndex, options: PageOptions = {}) {
    this.btnWithIdx = btnWithIdx;
    Object.assign(this, options);
  }
}
