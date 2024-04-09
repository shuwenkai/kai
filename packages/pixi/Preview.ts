import { Application, Point, Container, IApplicationOptions, Rectangle, FederatedWheelEvent, Assets, Sprite, FederatedPointerEvent } from "pixi.js"
import { ColorReplaceFilter } from "./filters/ColorReplace"
function copyPoint(point: Point) {
    const { x, y } = point
    return new Point(x, y)
}
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


/**
 *  设置mask时，白色的会被留下，黑色的会被移除
 * 对于精灵蒙版，使用 alpha 和红色通道。黑色蒙版与透明蒙版相同。
 *  */
export class Preview extends Application {
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

    /** 背景图路径 */
    private backgroundImagePath: string = ''
    private textureBackground: any = undefined
    constructor(
        args: Partial<IApplicationOptions>,
        options: { originalImage: string } = {
            originalImage: '../images/dungeon.png'
        },
        cb: () => void = () => { }
    ) {
        super(args)
        this.stage.eventMode = 'static'
        this.rootContainer.eventMode = 'static'

        // this.stage.cursor = 'grab'
        // this.rootContainer.cursor = 'grab'
        this.stage.addChild(this.rootContainer)
        this.backgroundImagePath = options.originalImage as string
        this.stageType = 'preview'
        this.initBackground().then(() => {
            cb && cb()
        })
        this.stageResize(args.width || 800, args.height || 600)
        this.bindEvents()
    }
    /** 绑定事件 */
    private bindEvents() {
        this.stage.on('wheel', this.scaleHandle, this)
        this.stage.on('pointerdown', this.pointerDownHandler, this)
        this.stage.on('pointermove', this.pointerMoveHandler, this)
        this.stage.on('pointerup', this.pointerUpHandler, this)
        this.stage.on('pointerupoutside', this.pointerUpHandler, this)
    }
    private handleCallback: handleCallbackType = async () => { }

    private pointerDownHandler(event: FederatedPointerEvent) {
        const globalPos = event.global
        this.rootContainerOriginalPos = copyPoint(this.rootContainer.position)
        this.mouseDownPoint = copyPoint(globalPos)
        this.touchBlank = true
    }

    private pointerMoveHandler(event: FederatedPointerEvent) {
        const globalPos = event.global
        if (this.touchBlank) {

            // 拖拽画布
            const dx = globalPos.x - this.mouseDownPoint.x
            const dy = globalPos.y - this.mouseDownPoint.y
            this.setContainerPosition(
                this.rootContainerOriginalPos.x + dx,
                this.rootContainerOriginalPos.y + dy
            )
            this.handleCallback(
                HandleType.Move,
                this.rootContainerOriginalPos.x + dx,
                this.rootContainerOriginalPos.y + dy
            )
        }
    }
    private pointerUpHandler(event: FederatedPointerEvent) {
        this.touchBlank = false
    }
    private backgroundSprite = new Sprite()
    /** 初始化背景 */
    private async initBackground() {
        // this.backgroundImagePath = '../images/dungeon.png'
        this.textureBackground = await Assets.load(this.backgroundImagePath)
        const spriteDungeon = Sprite.from(this.textureBackground)
        this.rootContainer.addChild(spriteDungeon)
        this.backgroundSprite = spriteDungeon
    }
    private stageResize(w: number, h: number) {
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
    /** 滚轮缩放 */
    private scaleHandle(event: FederatedWheelEvent) {
        const globalPos = new Point(event.global.x, event.global.y)
        const delta = event.deltaY
        this.scaleHandler(delta, globalPos)
        this.handleCallback(HandleType.Scale, delta, globalPos)
    }
    /** 获取缩放值 */
    private getZoom(): number {
        // stage是宽高等比例缩放的，所以取x或者取y是一样的
        return this.rootContainer.scale.x
    }
    private previewMask = new Sprite()
    /** 设置mask */
    async setImageUrl(img: string | HTMLImageElement) {
        // debugger
        const spriteDungeon = this.backgroundSprite
        const texture = await this.changeColor(img as string)
        const sprite = Sprite.from(texture) // 必须使用texture,否则后面设置filter不生效
        this.previewMask = sprite

        if (this.previewMask) this.rootContainer.removeChild(this.previewMask)
        spriteDungeon.mask = this.previewMask
        this.rootContainer.addChild(this.previewMask)
    }
    /** 绑定同步操作函数
   * @param cb 同步时的操作，缩放，移动时会进行触发
   */
    bindSyncHandle(cb: handleCallbackType) {
        this.handleCallback = cb
    }
    /** 设置缩放,暴露出去，同步时会调用
     * @param delta 方向 -100， 100
     */
    scaleHandler(delta: number, globalPos: Point) {
        const oldZoom = this.getZoom()
        let newZoom = oldZoom * 0.999 ** delta
        if (newZoom > this.maxZoom) newZoom = this.maxZoom
        if (newZoom < this.minZoom) newZoom = this.minZoom
        this.applyZoom(oldZoom, newZoom, globalPos)
    }
    /** 设置container位置,暴露出去，同步时会调用 */
    setContainerPosition(x: number, y: number) {
        this.rootContainer.position.set(x, y)
    }
    async changeColor(passageImage: string) {
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
        return this.renderer.generateTexture(passage)
    }
    /** 成品图 */
    saveImage() {
        return this.renderer.extract.base64(this.rootContainer)
    }
}
