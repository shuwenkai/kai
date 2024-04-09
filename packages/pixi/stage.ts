import { Application, Assets, Container, DisplayObject, FederatedPointerEvent, FederatedWheelEvent, Graphics, ILineStyleOptions, LINE_CAP, Matrix, Sprite } from "pixi.js"
import { ColorOverlayFilter } from "./filters/ColorOverlay"
import { ColorReplaceFilter } from "./filters/ColorReplace"

enum HandleType {
    Draw,
    Erase,
}

class Passage {
    private config: any = {}
    /** 基础画布 */
    private app!: Application
    /** 成品预览画布 */
    private appShow!: Application
    constructor(view: HTMLCanvasElement,
        view2: HTMLCanvasElement,
        private backgroundImagePath: string,
        config: any,
        private stageType: 'merge' | 'edit' = 'merge',
        private passImageUrl: string = '',
    ) {
        if (!view) {
            throw new TypeError('必须传入一个canvas节点')
        }
        if (stageType === 'merge' && !passImageUrl) {
            throw new TypeError('必须传入蒙版图片')
        }
        this.config = Object.assign(this.config, config)
        this.initStage(view, view2).then(() => {
            if (stageType === 'edit') {
                this.bindEvent()
            } else {

                // 前面已经做了校验
                this.setPassage(passImageUrl)
                this.bindEvent()
            }
        })
    }

    private spriteBackground!: Sprite // 画布背景
    private spriteBackground2!: Sprite // 预览背景
    private textureBackground!: any // 背景图的纹理

    /** 最后绘制完成生成蒙版图片的容器 */
    private container: Container = new Container()
    /** 初始化stage */
    private async initStage(view: HTMLCanvasElement, view2: HTMLCanvasElement) {
        const texture = await Assets.load(this.backgroundImagePath)
        this.textureBackground = texture
        const sprite = Sprite.from(texture)
        // todo 这种方式获取宽高时为0，不准确?
        // const sprite = Sprite.from(this.backgroundImagePath)
        this.app = new Application({
            ...this.config,
            width: texture.width,
            height: texture.height,
            background: 0xffffff,
            view: view
        })
        const sprite2 = Sprite.from(texture)

        this.spriteBackground = sprite2
        this.app.stage.addChild(sprite2)
        /** 默认生成的蒙版图片应该是算法模型返回的 */
        {
            const fill = Sprite.from(this.passImageUrl)
            fill.width = texture.width
            fill.height = texture.height
            // @ts-ignore
            fill.key = '__fill_background'
            this.container.addChild(fill)
        }

        this.appShow = new Application({
            ...this.config,
            width: texture.width,
            height: texture.height,
            background: 0xffffff,
            // background: 0xff33ff,
            view: view2
        })
        this.spriteBackground2 = sprite
        // this.app.stage.addChild(sprite)

        this.appShow.stage.addChild(sprite)
    }

    private maskBackground!: Sprite
    private maskBackground2!: Sprite
    /** 设置蒙版 */
    private async setPassage(url: string) {
        const texture = await Assets.load(url)
        const passage = Sprite.from(texture)
        passage.width = 512
        passage.height = 512
        this.spriteBackground2.mask = passage
        this.maskBackground2 = passage
        this.appShow.stage.addChild(passage)

        // 增加三个颜色过滤器，将黑白色对换
        const filter = new ColorReplaceFilter()
        filter.originalColor = 0x000000
        filter.newColor = 0xff33ff

        const f2 = new ColorReplaceFilter()
        f2.originalColor = 0xffffff
        f2.newColor = 0x000000

        const f3 = new ColorReplaceFilter()
        f3.originalColor = 0xff33ff
        f3.newColor = 0xffffff

        const passageShow = Sprite.from(texture)
        passageShow.filters = [filter, f2, f3]
        const t2 = this.app.renderer.generateTexture(passageShow)
        const mask = Sprite.from(t2)

        this.app.stage.addChild(mask)
        this.spriteBackground.mask = mask
        this.maskBackground = mask
    }


    /** 添加元素至画布 */
    addChild<T extends DisplayObject>(child: T, name?: string) {
        // @ts-ignore
        name && (child.key = name)
        this.app.stage.addChild(child)
    }

    private bindEvent() {
        this.app.stage.cursor = 'pointer'
        this.app.stage.eventMode = 'static'
        this.app.stage.on('pointerdown', this.pointerdownHandler, this)
        this.app.stage.on('pointermove', this.pointermoveHandler, this)
        this.app.stage.on('pointerup', this.pointerupHandler, this)
        // 绑定鼠标移动效果
        this.app.stage.on('pointerenter', this.pointerEnter, this)
        this.app.stage.on('pointerleave', this.pointerLeave, this)

        // 缩放效果
        this.app.stage.on('wheel', this.scaleHandle, this)
    }
    private scaleHandle(event: FederatedWheelEvent) {
        // console.log(event.deltaY)
        event.stopPropagation()
        // if(event.altKey){
        if (event.deltaY > 0) {
            // 缩小
            this.scaleDown(event.global)
        } else {
            // 放大
            this.scaleUp(event.global)
        }
        // }

    }
    private pointer: Graphics = new Graphics()
    private pointerS: Graphics = new Graphics()
    private pointerEnter(event: FederatedPointerEvent) {
        const pointer = new Graphics()
        pointer.beginFill(0xff33ff, .5)
        pointer.drawCircle(0, 0, (this.penStyle.width! / 2) || 10)
        pointer.endFill()
        this.pointer = pointer
        this.pointerS = pointer.clone()
        this.addChild(this.pointer, 'cursor')
        this.appShow.stage.addChild(this.pointerS)
    }
    private pointerLeave(event: FederatedPointerEvent) {
        this.app.stage.removeChild(this.pointer)
        this.appShow.stage.removeChild(this.pointerS)
    }

    private handleType = HandleType.Draw
    setHandleType(type: HandleType) {
        this.handleType = type
    }



    private currentIndex = 0
    private maxIndex = 0
    private historyList: Array<{ a: Graphics, b: Graphics, idx: number }> = []
    // 是否有历史记录
    public get hasHistory() {
        return {
            next: this.currentIndex < this.maxIndex,
            prev: this.currentIndex > 0
        }
    }
    /** 重做 */
    public redo() {
        if (this.currentIndex === this.maxIndex) {
            console.warn('没有下一步了')
            return
        }

        // 重做应该先加
        this.currentIndex++
        this.historyList.forEach(el => {
            if (el.idx === this.currentIndex) {
                el.a.visible = true
                el.b.visible = true
            }
        })
        this.reviewShowStage()
    }
    /** 撤销操作 */
    public undo() {
        if (this.currentIndex === 0) {
            console.warn('没有上一步了')
            return
        }
        this.historyList.forEach(el => {
            if (el.idx === this.currentIndex) {
                el.a.visible = false
                el.b.visible = false
            }
        })
        this.currentIndex--
        this.reviewShowStage()
    }

    private handling = false
    private handlingPoint = { x: 0, y: 0 }
    private pointerdownHandler(event: FederatedPointerEvent) {
        console.log(event.global)
        this.handling = true
        this.handlingPoint.x = event.global.x
        this.handlingPoint.y = event.global.y
        // 当前下标跟最大下标应当保持一致，当他们不一致时，代表进行过撤销操作，此时再绘制将原本隐藏的操作删除掉
        if (this.currentIndex !== this.maxIndex) {
            for (let idx = this.maxIndex; idx > this.currentIndex; idx--) {
                const index = this.historyList.findIndex(el => el.idx === idx)
                const child = this.historyList.splice(index)
                console.log(child, this.historyList)
                child.forEach(el => {
                    this.app.stage.removeChild(el.a)
                    this.appShow.stage.removeChild(el.b)
                })
            }
            this.maxIndex = this.currentIndex
        }
        this.currentIndex++
        this.maxIndex++

    }
    private pointermoveHandler(event: FederatedPointerEvent) {
        // todo graphics没有anchor属性，所以减去本身半径？好像默认就在中心？
        this.pointer.position.set(event.global.x, event.global.y)
        this.pointerS.position.set(event.global.x, event.global.y)
        if (this.handling) {
            if (this.handleType === HandleType.Draw) {
                const gd = new Graphics()
                gd.lineStyle({
                    ...this.penStyle,
                })
                // gd.scale = { x: .5, y: .5 }
                gd.moveTo(this.handlingPoint.x, this.handlingPoint.y)
                gd.lineTo(event.global.x, event.global.y)

                // @ts-ignore
                gd.key = '__line'
                this.app.stage.addChild(gd)
                const gdb = gd.clone()
                this.container.addChild(gdb)
                this.historyList.push({
                    idx: this.currentIndex,
                    a: gd,
                    b: gdb
                })
            } else {
                const ge = new Graphics()
                ge.lineStyle({
                    width: this.penStyle.width,
                    cap: LINE_CAP.ROUND,
                    texture: this.textureBackground
                })
                ge.moveTo(this.handlingPoint.x, this.handlingPoint.y)
                ge.lineTo(event.global.x, event.global.y)
                // @ts-ignore
                ge.key = '__line'
                this.app.stage.addChild(ge)

                // const geb = new Graphics()
                // geb.lineStyle({
                //     width: this.penStyle.width,
                //     cap: LINE_CAP.ROUND,
                //     color: 0x000000
                //     // texture: this.textureBackground
                // })
                // geb.moveTo(this.handlingPoint.x, this.handlingPoint.y)
                // geb.lineTo(event.global.x, event.global.y)

                // 这里克隆一个，然后改变它的色调
                const geb = ge.clone()
                geb.tint = 0x000000
                this.container.addChild(geb)
                this.historyList.push({
                    idx: this.currentIndex,
                    a: ge,
                    b: geb
                })
            }
            this.handlingPoint.x = event.global.x
            this.handlingPoint.y = event.global.y
        }
    }
    private pointerupHandler(event: FederatedPointerEvent) {
        this.handling = false
        this.reviewShowStage()
    }

    /** 重新绘制预览图 */
    private reviewShowStage() {
        this.spriteBackground2.visible = false
        this.app.renderer.extract.image(this.container).then(image => {
            // document.body.appendChild(image)
            const mask = Sprite.from(image)
            // @ts-ignore
            mask.key = 'mask'
            this.appShow.stage.removeChildren()
            this.appShow.stage.addChild(this.spriteBackground2, mask, this.pointerS)
            this.spriteBackground2.mask = mask
        })

        this.spriteBackground2.visible = true
    }

    private penStyle: ILineStyleOptions = {
        width: 10,
        color: 0xffffff,
        alpha: 1,
        cap: LINE_CAP.ROUND, // 笔尖样式
    }

    public setPenSize(size: number) {
        this.penStyle = Object.assign(this.penStyle, { width: size })
    }

    public scaleUp(position: { x: number, y: number }) {
        this.spriteBackground.pivot = position
        this.spriteBackground.position = position
        this.spriteBackground.scale.x += 0.1
        this.spriteBackground.scale.y += 0.1

        this.maskBackground.pivot = position
        this.maskBackground.position = position
        this.maskBackground.scale.x += 0.1
        this.maskBackground.scale.y += 0.1

        this.app.stage.children.forEach(el => {
            // @ts-ignore
            if (el.key === '__line') {
                el.pivot = position
                el.position = position
                el.scale.x += 0.1
                el.scale.y += 0.1
            }

        })
        // this.app.stage.pivot = position
        // this.app.stage.position = position
        // this.app.stage.scale.x += 0.1
        // this.app.stage.scale.y += 0.1

        console.log(this.app.stage.localTransform)
        // this.pointer.setTransform(0, 0, 1 / this.app.stage.scale.x, 1 / this.app.stage.scale.y)
    }
    public scaleDown(position: { x: number, y: number }) {
        // if (this.spriteBackground.scale.x <= 1) {
        //     return
        // }
        if (this.maskBackground.scale.x <= 1) {
            return
        }

        // this.spriteBackground.pivot = position
        // this.spriteBackground.position = position

        this.spriteBackground.scale.x -= 0.1
        this.spriteBackground.scale.y -= 0.1

        // this.maskBackground.pivot = position
        // this.maskBackground.position = position

        this.maskBackground.scale.x -= 0.1
        this.maskBackground.scale.y -= 0.1

        console.log(this.app.stage.children)
        this.app.stage.children.forEach(el => {
            // el.pivot = position
            // el.position = position           
            // @ts-ignore
            if (el.key === '__line') {
                el.pivot = position
                el.position = position
                // el.scale.x -= 0.1
                // el.scale.y -= 0.1
                el.scale.x = -1
                el.scale.y = -1
            }
        })

    }

    /** 输出图片 */
    getImage() { }


}



function useTestPassage() {
    const view = document.createElement('canvas')
    // document.body.appendChild(view)
    view.setAttribute('style', 'box-shadow: 5px 5px 5px #f5f5f5;float: left')

    const view2 = document.createElement('canvas')
    // document.body.appendChild(view2)
    view2.setAttribute('style', 'box-shadow: 5px 5px 5px #f5f5f5; margin-left: 10px;float: left')


    const d1 = document.createElement('div')
    d1.appendChild(view)
    d1.appendChild(view2)
    // d1.setAttribute('style', 'display:flex;justify-content: space-between')
    document.body.appendChild(d1)

    const config = {
        width: window.innerWidth,
        height: window.innerHeight,
        antialias: true, // 抗锯齿
        backgroundAlpha: 1, // 透明度
        resolution: 1, // 分辨率
        view,
    }
    const stage = new Passage(view, view2, '../images/dungeon.png', config, 'merge', '../images/mb.png')


    const div = document.createElement('div')
    const button = document.createElement('button')
    button.innerText = '绘制'
    const button2 = document.createElement('button')
    button2.innerText = '擦除'
    const button3 = document.createElement('button')
    button3.innerText = '设置画笔'
    const button4 = document.createElement('button')
    button4.innerText = '撤销'

    const button5 = document.createElement('button')
    button5.innerText = '重做'
    button.addEventListener("click", () => {
        stage.setHandleType(HandleType.Draw)
    })
    button2.addEventListener("click", () => {
        stage.setHandleType(HandleType.Erase)
    })
    button3.addEventListener('click', () => {
        // stage.setPassage('../images/mb.png')
        stage.setPenSize(33)
        // stage.scaleUp()
    })
    button4.addEventListener('click', () => {
        stage.undo()
    })
    button5.addEventListener('click', () => {
        stage.redo()
    })
    div.appendChild(button)
    div.appendChild(button2)
    div.appendChild(button3)
    div.appendChild(button4)
    div.appendChild(button5)
    div.setAttribute('style', 'width:300px;display:flex;justify-content: space-between')
    document.body.appendChild(div)

}

useTestPassage()
