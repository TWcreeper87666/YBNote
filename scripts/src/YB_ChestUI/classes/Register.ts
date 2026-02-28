import { Container, ItemStack, Player, system, world } from "@minecraft/server"
import { ActionFormData, ModalFormData } from "@minecraft/server-ui"
import { ButtonsWithIndex, Page, Size } from "./Page"
import { Button } from "./Button"
import { ChestUI } from "./ChestUI"
import { sendMessage } from "../functions"

type JsonButton = {
    name: string
    typeId: string
    amount?: number
    lore?: string[]
    commands?: string
    clickSound?: string
    toPage?: string
}

type JsonPage = Page & {
    btnWithIdx: { [key: number]: JsonButton }
};


export class Register {
    player: Player
    container: Container

    constructor(player: Player, container?: Container) {
        this.player = player
        this.container = container
    }

    form_menu() {
        if (this.#invalid()) return
        const form = new ActionFormData().title('§l§1修改頁面')
        const indices = []
        for (let i = 0; i < this.container.size; i++) {
            const item = this.container.getItem(i)
            if (!item) continue
            form.button(`${i} ${item.nameTag ? item.nameTag.split('\n')[0] : item.typeId.replace(/^.*?:/, '')}`)
            indices.push(i)
        }
        form.button('§l註冊頁面')
        form.show(this.player).then(({ canceled, selection }) => {
            if (canceled || this.#invalid()) return
            if (selection < indices.length) {
                this.#form_edit(indices[selection])
            } else {
                this.#form_register()
            }
        })
    }

    form_delete() {
        if (this.#invalid(false)) return
        const jsonPages = Register.#getPages()
        const names = Object.keys(jsonPages)
        if (names.length === 0) {
            return sendMessage(this.player, '§c目前沒有頁面, 點擊箱子註冊')
        }
        const form = new ActionFormData().title('§l§1刪除頁面')
        for (const name of names) form.button(name)
        form.show(this.player).then(({ canceled, selection }) => {
            if (canceled) return
            const jsonPages = Register.#getPages()
            const name = names[selection]
            delete jsonPages[name]
            Register.#setPages(jsonPages)
            ChestUI.setUIPage(name, undefined)
            this.player.sendMessage(`§l§a- 已刪除頁面 ${name}`)
        })
    }

    #invalid(checkContainer = true) {
        if (!this.player.hasTag('yb:eui_op')) {
            sendMessage(this.player, '§c沒有權限使用, 若要使用請輸入\n/tag @s add yb:eui_op')
            return true
        }
        if (checkContainer && !this.container) {
            sendMessage(this.player, '§c目標箱子已消失')
            return true
        }
        return false
    }

    #form_edit(idx: number) {
        const item = this.container.getItem(idx)
        const [lore, _, clickSound, toPage, commands] = item.getLore()
        const name = item.nameTag ? Register.#parse(item.nameTag.replace(/^§r/, '')) : ''
        const processedCommands = commands ? Register.#parse(commands) : ''
        const form = new ModalFormData().title('§l§1修改按鈕')
            .textField('§l名稱("/"換行)', '', { defaultValue: name })
            .textField('§l說明("/"換行)', '', { defaultValue: lore ?? '' })
            .textField(`§l點擊音效(預設為 ${ChestUI.config.defaultClickSound})`, '', { defaultValue: clickSound ?? '' })
            .textField('§l切換至頁面(將不執行指令)', '', { defaultValue: toPage ?? '' })
            .textField('§l指令("/"換行, toPage:頁面名稱 可切換頁面, closeUI 關閉UI)', '', { defaultValue: processedCommands })
        form.show(this.player).then(({ canceled, formValues }) => {
            if (canceled || this.#invalid()) return
            const [name, lore, clickSound, toPage, commands] = formValues as string[]
            const processedCommands = Register.#split(commands).join('\n')
            item.nameTag = '§r' + Register.#split(name).join('\n')
            item.setLore([lore, '§r§7-----', clickSound, toPage, processedCommands])
            this.container.setItem(idx, item)
            sendMessage(this.player, '§e已更新按鈕')
        })
    }

    #form_register() {
        const options = ['small', 'large']
        const form = new ModalFormData().title('§l§1註冊頁面')
            .textField('§l頁面名稱', ChestUI.config.defaultPageName)
            .dropdown('§l頁面大小', options)
        form.show(this.player).then(({ canceled, formValues }) => {
            if (canceled || this.#invalid()) return
            const [name, sizeIdx] = formValues as [string, number]
            if (name.length === 0) return sendMessage(this.player, '§c頁面名稱不可為空')
            const jsonPages = Register.#getPages()
            jsonPages[name] = {
                size: Size[options[sizeIdx]],
                btnWithIdx: this.#getBtnWithIdx()
            } as JsonPage
            Register.#setPages(jsonPages)
            Register.load()
            this.player.sendMessage(`§l§a- 已註冊頁面 ${name}`)
        })
    }

    #getBtnWithIdx() {
        const btnWithIdx = {} as { [key: number]: JsonButton }
        for (let i = 0; i < this.container.size; i++) {
            const item = this.container.getItem(i)
            if (!item) continue
            const [lore, _, clickSound, toPage, commands] = item.getLore()
            btnWithIdx[i] = { name: item.nameTag ?? '', typeId: item.typeId, amount: item.amount }
            if (clickSound) btnWithIdx[i].clickSound = clickSound
            if (toPage) btnWithIdx[i].toPage = toPage
            if (commands) btnWithIdx[i].commands = Register.#parse(commands)
            if (lore) btnWithIdx[i].lore = Register.#split(lore)
        }
        return btnWithIdx
    }

    static init() {
        world.beforeEvents.playerInteractWithBlock.subscribe(async (e) => {
            const { player, itemStack, block } = e
            if (itemStack?.typeId !== 'yb:eui_register') return
            if (block.typeId !== 'minecraft:chest') return
            e.cancel = true
            await system.waitTicks(1)

            const container = block.getComponent('inventory').container
            new Register(player, container).form_menu()
        })

        world.afterEvents.itemUse.subscribe(({ source, itemStack }) => {
            if (itemStack.typeId !== 'yb:eui_register') return
            new Register(source).form_delete()
        })

        this.load()
    }

    static load() {
        const pages = this.#getPages()
        for (const pageName in pages) {
            const jsonPage = pages[pageName]
            const btnWithIdx = {} as ButtonsWithIndex
            for (const idx in jsonPage.btnWithIdx) {
                btnWithIdx[idx] = this.#buildButton(jsonPage.btnWithIdx[idx])
            }
            ChestUI.setUIPage(pageName, new Page(btnWithIdx, { size: jsonPage.size }))
        }
    }

    static #buildButton(jsonButton: JsonButton) {
        const { name, typeId, amount, lore, commands, clickSound, toPage } = jsonButton
        const processedCommands = commands ? this.#split(commands).map(command => command.trim()) : []
        return new Button(name, typeId, {
            amount, clickSound, toPage, lore, onClick: ({ player }) => {
                processedCommands.forEach(command => {
                    if (command.startsWith('toPage:')) {
                        const pageName = command.slice(7).trim()
                        ChestUI.setPage(player, pageName)
                    } else if (command.startsWith('closeUI')) {
                        ChestUI.close(player)
                    } else {
                        player.runCommand(command)
                    }
                })
            }
        })
    }

    static #setPages(pages: { [key: string]: JsonPage }) {
        world.setDynamicProperty('yb:eui_pages', JSON.stringify(pages) || undefined)
    }

    static #getPages() {
        const data = world.getDynamicProperty('yb:eui_pages') as string
        return data ? JSON.parse(data) as { [key: string]: JsonPage } : {}
    }

    static #split(string: string) {
        return string.replace(/\/\//g, '#yb:sep#').split('/').map(s => s.replace(/#yb:sep#/g, '/'))
    }

    static #parse(string: string) {
        return string.replace(/\//g, '//').replace(/\n/g, '/')
    }
}