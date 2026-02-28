import { Player, Entity, Container, ItemStack, ItemLockMode, ItemType } from "@minecraft/server"
import { ChestUI } from "./ChestUI"

export type OnClickFunc = (arg: {
    /** The player interacting with the UI */
    player: Player
    /** The container entity holding the inventory */
    container_e: Container
    /** The item being interacted with */
    item: ItemStack
    /** The index of the item in the container */
    idx: number
}) => void;

export enum UpdateType {
    empty,
    amount,
    typeId,
    stackable
}

type buttonOptions = {
    /** Function to execute when clicked */
    onClick?: OnClickFunc
    /** Update type, defaults to typeId */
    updateType?: UpdateType
    /** Sound effect to play when clicked, defaults to 'random.click' */
    clickSound?: string
    /** If set, the onClick function will not execute, and it will navigate to the specified page */
    toPage?: string
    /** Sets the lore value - a secondary display string - for an ItemStack. The lore list is cleared if set to an empty string or undefined. */
    lore?: string[]
    /** Number of the items in the stack. Valid values range between 1-255. The provided value will be clamped to the item's maximum stack size. */
    amount?: number
}

export class Button {
    nameTag: string
    itemType: string
    lore?: string[]
    amount?: number
    updateType?: UpdateType
    onClick?: OnClickFunc
    clickSound?: string
    toPage?: string

    constructor(
        nameTag: string,
        itemType: string,
        options: buttonOptions = {}
    ) {
        this.nameTag = nameTag
        this.itemType = itemType

        Object.assign(this, options)
    }

    getItem() {
        return ChestUI.newUIItem(this.nameTag, this.itemType, { amount: this.amount, lore: this.lore })
    }

    updateCheck(item: ItemStack, buttonItem = this.getItem()) {
        switch (this.updateType ?? ChestUI.config.defaultButtonUpdateType) {
            case UpdateType.empty: return !item
            case UpdateType.amount: return item?.amount !== buttonItem.amount
            case UpdateType.typeId: return item?.typeId !== buttonItem.typeId
            case UpdateType.stackable: return !item?.isStackableWith(buttonItem)
            default: return false
        }
    }
}