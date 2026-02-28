import { ChestUI } from "./ChestUI";
export var UpdateType;
(function (UpdateType) {
    UpdateType[UpdateType["empty"] = 0] = "empty";
    UpdateType[UpdateType["amount"] = 1] = "amount";
    UpdateType[UpdateType["typeId"] = 2] = "typeId";
    UpdateType[UpdateType["stackable"] = 3] = "stackable";
})(UpdateType || (UpdateType = {}));
export class Button {
    constructor(nameTag, itemType, options = {}) {
        this.nameTag = nameTag;
        this.itemType = itemType;
        Object.assign(this, options);
    }
    getItem() {
        return ChestUI.newUIItem(this.nameTag, this.itemType, { amount: this.amount, lore: this.lore });
    }
    updateCheck(item, buttonItem = this.getItem()) {
        switch (this.updateType ?? ChestUI.config.defaultButtonUpdateType) {
            case UpdateType.empty: return !item;
            case UpdateType.amount: return item?.amount !== buttonItem.amount;
            case UpdateType.typeId: return item?.typeId !== buttonItem.typeId;
            case UpdateType.stackable: return !item?.isStackableWith(buttonItem);
            default: return false;
        }
    }
}
