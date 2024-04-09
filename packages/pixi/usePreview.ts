import {
    Point,
    Application,
    Container,
    type IApplicationOptions,
    FederatedPointerEvent,
    Rectangle,
    Assets,
    Sprite,
    FederatedWheelEvent,
    Graphics,
    type ILineStyleOptions,
    LINE_CAP
} from 'pixi.js'
import { ColorReplaceFilter } from './filters/ColorReplace'
import { Preview } from './Preview'
//   import type { ClickCallbackType, handleCallbackType } from '../types'
//   import { HandleType, MattingMaxZoom, MattingMinZoom } from '../config'

//   import { base64ToBlob } from '../basicgraph/utils'
type PointPreview = Point
type ClickCallbackType = (type: HandleType, point: Point) => void | Promise<void>

type handleCallbackType = (
    handleType?: HandleType,
    arg1?: number,
    arg2?: number | Point
) => Promise<void>
enum HandleType {
    Draw,
    Erase,
    Move,
    Scale,
    Auto, // 自动识别
    Remove, // 去除
    Retrain // 保留
}
const MattingMaxZoom = 5
const MattingMinZoom = 0.2
function base64ToBlob(str: string) { }

function copyPoint(point: Point) {
    const { x, y } = point
    return new Point(x, y)
}

class PreviewStage extends Application {
    private minZoom = MattingMinZoom
    private maxZoom = MattingMaxZoom
    /** canvas的位置宽高信息 */
    private viewClientRect?: DOMRect
    private onLoad?: () => void // 加载完成操作
    private touchBlank = false // 是否点击
    private mouseDownPoint = new Point(0, 0) // 鼠标按下位置
    private rootContainerOriginalPos = new Point(0, 0) // container移动前的位置
    public rootContainer = new Container()

    private spaceKey = false
    private stageType: 'preview' | 'handle' = 'preview'
    constructor(
        args: Partial<IApplicationOptions>,
        options: { type: 'preview' | 'handle'; originalImage: string } = {
            type: 'preview',
            originalImage: '../images/dungeon.png'
        },
        cb: () => void = () => { }
    ) {
        super(args)
        this.stage.eventMode = 'static'
        this.rootContainer.eventMode = 'static'
        this.stage.addChild(this.rootContainer)
        this.backgroundImagePath = options.originalImage as string
        this.stageType = options.type
        this.initBackground().then(() => {
            cb && cb()
        })
        this.stageResize(args.width || 800, args.height || 600)

        if (options.type !== 'preview') {
            window.addEventListener('keydown', (event) => {
                if (event.code === 'Space') {
                    this.spaceKey = true
                    this.rootContainer.cursor = 'grab'
                }
            })
            window.addEventListener('keyup', (event) => {
                if (event.code === 'Space') {
                    this.spaceKey = false
                    this.rootContainer.cursor = 'default'
                }
            })
        } else {
            this.handleType = HandleType.Move
        }
        this.bindEvents()
    }

    /** 设置container位置,暴露出去，同步时会调用 */
    setContainerPosition(x: number, y: number) {
        this.rootContainer.position.set(x, y)
    }

    private handleCallback: handleCallbackType = async () => { }
    bindSyncHandle(cb: handleCallbackType) {
        this.handleCallback = cb
    }

    private backgroundSprite = new Sprite()
    private async initBackground() {
        // this.backgroundImagePath = '../images/dungeon.png'
        this.textureBackground = await Assets.load(this.backgroundImagePath)
        const spriteDungeon = Sprite.from(this.textureBackground)
        this.rootContainer.addChild(spriteDungeon)
        this.backgroundSprite = spriteDungeon
    }

    /** 绑定事件 */
    private bindEvents() {
        this.stage.on('wheel', this.scaleHandle, this)
        this.stage.on('pointerdown', this.pointerDownHandler, this)
        this.stage.on('pointermove', this.pointerMoveHandler, this)
        this.stage.on('pointerup', this.pointerUpHandler, this)
        this.stage.on('pointerupoutside', this.pointerUpHandler, this)
    }

    private pointerUpHandler(event: FederatedPointerEvent) {
        this.touchBlank = false
    }
    private handleType = HandleType.Auto // 默认自动识别
    setHandleType(type: HandleType) {
        this.handleType = type
    }

    private penStyle: ILineStyleOptions = {
        width: 10,
        color: 0xffff33,
        alpha: 1,
        cap: LINE_CAP.ROUND // 笔尖样式
    }

    setPenSize(size: number) {
        this.penStyle = Object.assign(this.penStyle, { width: size })
    }
    // 画笔硬度
    setPenHardness(size: number) {
        // this.penStyle = Object.assign(this.penStyle, { width: size })
    }

    private currentIndex = 0
    private maxIndex = 0
    private historyList: Array<{
        type: HandleType
        a?: Graphics
        b?: Graphics
        image?: string | HTMLImageElement
        idx: number
        prevIdx?: number
    }> = []
    // 是否有历史记录
    get hasHistory() {
        return {
            next: this.currentIndex < this.maxIndex,
            prev: this.currentIndex > 0
        }
    }
    private updateHistory = () => { }
    bindUpdateHistory(cb: () => void = () => { }) {
        this.updateHistory = cb
    }
    // getStageVertex() {
    //     // 这里使用背景图即原图大小作为边界
    //     const localBounds = this.backgroundSprite.getLocalBounds();
    //     const { x, y, width, height } = localBounds;
    //     const tl = new Point(x, y);
    //     const tr = new Point(x + width, y);
    //     const br = new Point(x + width, y + height);
    //     const bl = new Point(x, y + height);
    //     return [tl, tr, br, bl];
    // }
    private getHandleRange() {
        const localBounds = this.backgroundSprite.getLocalBounds()
        const { x, y, width, height } = localBounds
        return new Rectangle(x, y, width, height)
    }
    private handlingPoint: Point = new Point(0, 0)
    private pointerMoveHandler(event: FederatedPointerEvent) {
        const globalPos = event.global
        if (this.touchBlank) {
            const originalType = this.handleType
            if (this.spaceKey) {
                this.handleType = HandleType.Move
            }
            if (this.handleType === HandleType.Move) {
                // 拖拽画布
                const dx = globalPos.x - this.mouseDownPoint.x
                const dy = globalPos.y - this.mouseDownPoint.y
                this.setContainerPosition(
                    this.rootContainerOriginalPos.x + dx,
                    this.rootContainerOriginalPos.y + dy
                )
                this.handleType = originalType

                this.handleCallback(
                    HandleType.Move,
                    this.rootContainerOriginalPos.x + dx,
                    this.rootContainerOriginalPos.y + dy
                )
            } else if (this.handleType === HandleType.Draw) {
                const curPoint = this.rootContainer.localTransform.clone().applyInverse(globalPos)
                const startPoint = this.rootContainer.localTransform
                    .clone()
                    .applyInverse(this.handlingPoint)
                const range = this.getHandleRange()
                if (!range.contains(curPoint.x, curPoint.y)) {
                    // 不在可操作范围内
                    return
                }
                // 绘制图案
                const gd = new Graphics()
                const scaleNumber = this.getZoom()
                gd.lineStyle({
                    ...this.penStyle,
                    width: this.penStyle.width! / scaleNumber
                })
                gd.moveTo(startPoint.x, startPoint.y)
                gd.lineTo(curPoint.x, curPoint.y)

                // @ts-ignore
                gd.key = '__line'
                this.rootContainer.addChild(gd)
                const gdb = gd.clone()
                this.containerResult.addChild(gdb)
                this.historyList.push({
                    type: HandleType.Draw,
                    idx: this.currentIndex,
                    a: gd,
                    b: gdb
                })
                this.handleCallback(HandleType.Draw)
            } else if (this.handleType === HandleType.Erase) {
                // 擦除
                const curPoint = this.rootContainer.localTransform.clone().applyInverse(globalPos)
                const startPoint = this.rootContainer.localTransform
                    .clone()
                    .applyInverse(this.handlingPoint)
                const range = this.getHandleRange()
                if (!range.contains(curPoint.x, curPoint.y)) {
                    // 不在可操作范围内
                    return
                }
                const ge = new Graphics()
                const scaleNumber = this.getZoom()
                ge.lineStyle({
                    // width: this.penStyle.width,

                    width: this.penStyle.width! / scaleNumber,
                    cap: LINE_CAP.ROUND,
                    texture: this.textureBackground
                })
                ge.moveTo(startPoint.x, startPoint.y)
                ge.lineTo(curPoint.x, curPoint.y)
                // @ts-ignore
                ge.key = '__line'
                this.rootContainer.addChild(ge)

                const geb = ge.clone()
                geb.tint = 0x000000
                this.containerResult.addChild(geb)
                this.historyList.push({
                    type: HandleType.Erase,
                    idx: this.currentIndex,
                    a: ge,
                    b: geb
                })
                this.handleCallback(HandleType.Erase)
            }
            this.handlingPoint = copyPoint(globalPos)
        }
    }
    /** 最后绘制完成生成蒙版图片的容器 */
    private containerResult: Container = new Container()

    /** 绘制预览图 */
    public reviewShowStage(type: 'base64' | 'img') {
        if (type === 'base64') {
            return this.renderer.extract.base64(this.containerResult)
        }
        return this.renderer.extract.image(this.containerResult)
    }
    /** 成品图 */
    public saveImage() {
        return this.renderer.extract.base64(this.rootContainer)
    }
    /** 历史记录下标的操作 */
    private incrementIndex() {
        // 当前下标跟最大下标应当保持一致，当他们不一致时，代表进行过撤销操作，此时再绘制将原本隐藏的操作删除掉
        if (this.currentIndex !== this.maxIndex) {
            for (let idx = this.maxIndex; idx > this.currentIndex; idx--) {
                const index = this.historyList.findIndex((el) => el.idx === idx)
                const child = this.historyList.splice(index)
                child.forEach((el) => {
                    el.a && this.rootContainer.removeChild(el.a)
                })
            }
            this.maxIndex = this.currentIndex
        }
        this.currentIndex++
        this.maxIndex++
        this.updateHistory()
    }
    private prevIdx = 0
    updateImage(url: string | HTMLImageElement) {
        // 从算法获取结果后的操作，设置mask，新增历史记录
        this.incrementIndex()

        this.historyList.forEach((el) => {
            el.a && (el.a.visible = false)
            el.b && (el.b.visible = false)
        })
        this.historyList.push({
            type: this.handleType,
            image: url,
            idx: this.currentIndex,
            prevIdx: this.prevIdx
        })
        this.prevIdx = this.currentIndex
        this.setImageUrl(url)
        this.handleCallback()
    }
    private pointerDownHandler(event: FederatedPointerEvent) {
        const globalPos = event.global
        this.rootContainerOriginalPos = copyPoint(this.rootContainer.position)
        this.mouseDownPoint = copyPoint(globalPos)
        this.handlingPoint = copyPoint(globalPos)

        this.incrementIndex()
        const curPoint = this.rootContainer.localTransform.clone().applyInverse(globalPos)

        const range = this.getHandleRange()
        if (!range.contains(curPoint.x, curPoint.y)) {
            // 不在可操作范围内
            this.touchBlank = false
            return
        }

        if ([HandleType.Auto, HandleType.Remove, HandleType.Retrain].includes(this.handleType)) {
            if (!this.spaceKey) {
                // 需要算法介入，获取点击位置
                this.clickCallback(this.handleType, curPoint)
                return
            }
        }
        this.touchBlank = true
    }
    private clickCallback: ClickCallbackType = () => { }
    bindClickCallback(cb: ClickCallbackType) {
        this.clickCallback = cb
    }

    /** 重做 */
    redo() {
        if (this.currentIndex === this.maxIndex) {
            console.warn('没有下一步了')
            return
        }

        // 重做应该先加
        this.currentIndex++
        // this.historyList.forEach((el) => {
        //   if (el.idx === this.currentIndex) {
        //     el.a && (el.a.visible = true)
        //     el.b && (el.b.visible = true)
        //   }
        // })
        this.historyList.forEach((el) => {
            if (el.idx === this.currentIndex) {
                if ([HandleType.Auto, HandleType.Remove, HandleType.Retrain].includes(el.type)) {
                    // 当涉及算法，更改mask的历史记录前进
                    if (typeof el.prevIdx === 'number') {
                        this.setImageUrl(el.image!)
                        this.historyList.forEach((it) => {
                            it.a && (it.a.visible = false)
                            it.b && (it.b.visible = false)
                        })
                    }
                } else {
                    el.a && (el.a.visible = true)
                    el.b && (el.b.visible = true)
                }
            }
        })
        this.handleCallback()

        this.updateHistory()
    }
    /** 撤销操作 */
    undo() {
        if (this.currentIndex === 0) {
            console.warn('没有上一步了')
            return
        }
        this.historyList.forEach((el) => {
            if (el.idx === this.currentIndex) {
                if ([HandleType.Auto, HandleType.Remove, HandleType.Retrain].includes(el.type)) {
                    // 当涉及算法，更改mask的历史记录后退
                    if (typeof el.prevIdx === 'number') {
                        this.setImageUrl(el.image!)
                        for (let i = this.currentIndex; i > el.prevIdx; i--) {
                            this.historyList.forEach((it) => {
                                if (it.idx === i) {
                                    it.a && (it.a.visible = true)
                                    it.b && (it.b.visible = true)
                                }
                            })
                        }
                    }
                } else {
                    el.a && (el.a.visible = false)
                    el.b && (el.b.visible = false)
                }
            }
        })
        this.currentIndex--
        this.handleCallback()

        this.updateHistory()
    }

    /** 获取缩放值 */
    private getZoom(): number {
        // stage是宽高等比例缩放的，所以取x或者取y是一样的
        return this.rootContainer.scale.x
    }
    /** 缩放 */
    private applyZoom(oldZoom: number, newZoom: number, pointerGlobalPos: Point) {
        const oldStageMatrix = this.rootContainer.localTransform.clone()
        const oldStagePos = oldStageMatrix.applyInverse(pointerGlobalPos)
        const dx = oldStagePos.x * oldZoom - oldStagePos.x * newZoom
        const dy = oldStagePos.y * oldZoom - oldStagePos.y * newZoom

        this.rootContainer.setTransform(
            this.rootContainer.position.x + dx,
            this.rootContainer.position.y + dy,
            newZoom,
            newZoom,
            0,
            0,
            0,
            0,
            0
        )
        this.rootContainer.updateTransform()
    }
    stageResize(w: number, h: number) {
        this.renderer.resize(w, h)
        if (!this.viewClientRect) {
            this.ticker.addOnce(() => {
                setTimeout(() => {
                    this.onLoad?.()
                }, 300)
            })
        }
        this.stage.hitArea = new Rectangle(0, 0, w, h)
        this.viewClientRect = (this.view as HTMLCanvasElement).getBoundingClientRect()
    }

    private backgroundImagePath: string = ''
    private textureBackground: any = undefined
    /** 添加图片
     * @param url 算法抠图的结果，应该是一个黑白色的蒙版
     */
    async setImageUrl(url: string | HTMLImageElement, isNew: boolean = false) {

        const spriteDungeon = this.backgroundSprite

        const texture = await Assets.load(url)
        const sprite = Sprite.from(texture) // 必须使用texture,否则后面设置filter不生效

        // @ts-ignore
        sprite.key = '__mask_preview'

        if (this.stageType === 'preview') {
            // @ts-ignore
            const m = this.rootContainer.children.find((el) => el.key === '__mask_preview')
            if (m) this.rootContainer.removeChild(m)

            spriteDungeon.mask = sprite
            this.rootContainer.addChild(sprite)

        } else {
            {
                const fill = Sprite.from(url)
                fill.width = texture.width
                fill.height = texture.height
                // @ts-ignore
                fill.key = '__fill_background'
                this.containerResult.addChild(fill)
            }
            const maskFill = new Graphics()
            maskFill.beginFill(0x000000, 1)
            maskFill.drawRect(0, 0, texture.width, texture.height)
            maskFill.endFill()

            const container = new Container()
            container.addChild(maskFill, sprite)
            // 操作
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
            container.filters = [filter, f2, f3]
            const t2 = this.renderer.generateTexture(container)
            const mask = Sprite.from(t2)
            // @ts-ignore
            mask.key = '__mask__sprite'
            // @ts-ignore
            const m = this.rootContainer.children.find((el) => el.key === '__mask__sprite')
            if (m) {
                this.rootContainer.removeChild(m)
            }
            spriteDungeon.mask = mask
            this.rootContainer.addChild(mask)
        }
    }

    onStageLoad(onLoad: () => void) {
        this.onLoad = onLoad
    }

    /** 滚轮缩放 */
    private scaleHandle(event: FederatedWheelEvent) {
        const globalPos = new Point(event.global.x, event.global.y)
        const delta = event.deltaY
        this.scaleHandler(delta, globalPos)
        this.handleCallback(HandleType.Scale, delta, globalPos)
    }
    scaleHandler(delta: number, globalPos: Point) {
        const oldZoom = this.getZoom()
        let newZoom = oldZoom * 0.999 ** delta
        if (newZoom > this.maxZoom) newZoom = this.maxZoom
        if (newZoom < this.minZoom) newZoom = this.minZoom
        this.applyZoom(oldZoom, newZoom, globalPos)
    }
    /** 点击按钮缩放操作 */
    public scale(handleType: 'in' | 'out' = 'in') {
        const globalPos = new Point(0, 0)
        this.scaleHandler(handleType === 'out' ? 100 : -100, globalPos)
    }

    public async changeColor(passageImage: string) {
        const texture = await Assets.load(passageImage)
        const passage = Sprite.from(texture) // 必须使用texture,否则后面设置filter不生效
        const filter = new ColorReplaceFilter()
        filter.originalColor = 0x000000
        filter.newColor = 0xff33ff

        const f2 = new ColorReplaceFilter()
        f2.originalColor = 0xffffff
        f2.newColor = 0x000000

        const f3 = new ColorReplaceFilter()
        f3.originalColor = 0xff33ff
        f3.newColor = 0xffffff
        passage.filters = [filter, f2, f3]
        return this.renderer.extract.image(passage)
    }
}

class Matting {
    private previewStage: Preview
    private handleStage: PreviewStage | undefined = undefined
    constructor(
        args: Partial<IApplicationOptions>,
        options: { originalImage: string; passageImage: string },
        handleCanvas?: HTMLCanvasElement
    ) {

        const previewStage = new Preview(
            {
                ...args
            },
            {
                // type: 'preview',
                originalImage: options.originalImage
            },
            async () => {
                // const img = await previewStage.changeColor(options.passageImage)
                previewStage.setImageUrl(options.passageImage)
            }
        )
        if (handleCanvas) {
            // 有则代表既有操作也有预览
            const handleStage = new PreviewStage(
                {
                    ...args,
                    view: handleCanvas
                },
                {
                    type: 'handle',
                    originalImage: options.originalImage
                },
                async () => {
                    const img = await handleStage.changeColor(options.passageImage)
                    handleStage.setImageUrl(img)
                }
            )
            handleStage.bindSyncHandle(
                async (handleType: HandleType = HandleType.Draw, arg1?: number, arg2?: number | Point) => {
                    if (handleType === HandleType.Move) {
                        previewStage.setContainerPosition(arg1 || 0, (arg2 as number) || 0)
                    } else if (handleType === HandleType.Scale) {
                        previewStage.scaleHandler(arg1 || 100, (arg2 as Point) || { x: 0, y: 0 })
                    } else {
                        const img = await handleStage.reviewShowStage('img')
                        previewStage.setImageUrl(img)
                    }
                }
            )

            previewStage.bindSyncHandle(
                async (handleType: HandleType = HandleType.Draw, arg1?: number, arg2?: number | Point) => {
                    if (handleType === HandleType.Move) {
                        handleStage.setContainerPosition(arg1 || 0, (arg2 as number) || 0)
                    } else if (handleType === HandleType.Scale) {
                        handleStage.scaleHandler(arg1 || 100, (arg2 as Point) || { x: 0, y: 0 })
                    }
                }
            )

            this.handleStage = handleStage
        }

        this.previewStage = previewStage
    }
    get hasHistory() {
        return this.handleStage?.hasHistory || { prev: false, next: false }
    }
    bindUpdateHistory(cb: () => void) {
        this.handleStage?.bindUpdateHistory(cb)
    }
    undo() {
        this.handleStage?.undo()
    }
    redo() {
        this.handleStage?.redo()
    }
    setHandleType(type: HandleType) {
        this.handleStage?.setHandleType(type)
    }
    setPenSize(size: number) {
        this.handleStage?.setPenSize(size)
    }
    setPenHardness(size: number) {
        this.handleStage?.setPenHardness(size)
    }
    bindClickCallback(cb: ClickCallbackType) {
        this.handleStage?.bindClickCallback(cb)
    }
    updatePassage(url: string | HTMLImageElement) {
        this.handleStage?.updateImage(url)
    }

    updatePreview(url: string | HTMLImageElement) {
        this.previewStage.updateImage(url)
    }
    async getPassage() {
        if (this.handleStage) {
            const imgData = await this.handleStage.reviewShowStage('base64')
            return base64ToBlob(imgData as string)
        } else {
            throw new TypeError('预览画布，不支持导出蒙版')
        }
    }

    async getPassageForImg() {
        if (this.handleStage) {
            return this.handleStage.reviewShowStage('img')
        } else {
            throw new TypeError('预览画布，不支持导出蒙版')
        }
    }

    async saveImage() {
        const imgData = await this.previewStage.saveImage()
        return base64ToBlob(imgData)
    }
    destroyed() {
        this.handleStage?.destroy()
        this.previewStage?.destroy()
    }
}

function useTestPreview() {
    const view = document.createElement('canvas')
    // document.body.appendChild(view)
    view.setAttribute('style', 'box-shadow: 5px 5px 5px #f5f5f5;float: left')

    const view2 = document.createElement('canvas')
    // document.body.appendChild(view)
    view2.setAttribute('style', 'box-shadow: 5px 5px 5px #f5f5f5;float: left; margin-left: 10px')

    const d1 = document.createElement('div')
    d1.appendChild(view)
    d1.appendChild(view2)

    const view3 = document.createElement('canvas')
    // document.body.appendChild(view)
    view3.setAttribute('style',
        'margin-top: 10px')
    d1.appendChild(view3)


    document.body.appendChild(d1)

    const d2 = document.createElement('div')
    d2.classList.add('preview')
    document.body.appendChild(d2)
    // console.log(window.devicePixelRatio)
    const matting = new Matting({
        width: 800,
        height: 600,
        backgroundAlpha: 1,
        antialias: true,
        resolution: 1,
        view: view as HTMLCanvasElement,
    }, {
        // originalImage: '../images/m22.png',
        originalImage: '../images/m22.png',
        // passageImage: '../images/m11.jpg'
        // originalImage: '../images/dungeon.png',
        // passageImage: '../images/mb.png'
        passageImage: '../images/1027mask.jpg'
    }, view2)
    // const matting = {}
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
        matting.setHandleType(HandleType.Draw)
    })
    button2.addEventListener("click", () => {
        matting.setHandleType(HandleType.Erase)
    })
    button3.addEventListener('click', () => {
        matting.setPenSize(33)
    })
    button4.addEventListener('click', () => {
        matting.undo()
    })
    button5.addEventListener('click', () => {
        // matting.redo()
        matting.saveImage()
    })
    div.appendChild(button)
    div.appendChild(button2)
    div.appendChild(button3)
    div.appendChild(button4)
    div.appendChild(button5)
    div.setAttribute('style', 'width:300px;display:flex;justify-content: space-between')
    document.body.appendChild(div)
}
useTestPreview()