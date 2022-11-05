import { Camera } from "./Camera"
import { Mat4, Vec3 } from "./math"
import { Object3D } from "./Object3D"


enum Mouse {
    mouseLeft = 0
}

export abstract class Control {

    abstract init():void

    abstract destroy():void

    abstract update():void
}

/**
 * 矢量飞行控制
 * 移动时的“前方向“为视线”前方向“在世界xoz平面的投影
 */
export class Fly1Control extends Control {

    static keycodeMap = {
        'KeyW': 'forward',
        'KeyS': 'backward',
        'KeyA': 'left',
        'KeyD': 'right',
        'KeyR': 'up',
        'KeyF': 'down',
    }

    private moveStatus: {
        forward: boolean
        backward: boolean
        left: boolean
        right: boolean
        up: boolean
        down: boolean
    }

    private dom: HTMLElement
    private object: Object3D //被控制的物体
    private body: Object3D = new Object3D()

    constructor(object: Object3D, dom: HTMLElement) {
        super()
        this.object = object
        this.dom = dom
        this.moveStatus = {
            left: false,
            right: false,
            forward: false,
            backward: false,
            up: false,
            down: false,
        }
        this.body.translate(0,2,20)
        this.body.add(object)
    }
    init() {
        this.initMove()
        this.initRotate()
    }
    
    update() {
        if(Object.values(this.moveStatus).every(v => !v)) return
        let delta = 1 / 10
        let z = (this.moveStatus.forward ? -delta : 0) + (this.moveStatus.backward ? delta : 0)
        let x = (this.moveStatus.left ? -delta : 0) + (this.moveStatus.right ? delta : 0)
        let y = (this.moveStatus.up ? delta : 0) + (this.moveStatus.down ? -delta : 0)

        this.body.translate(x,y,z)
    }

    private initMove() {
        let that = this

        window.addEventListener('keydown', keyDown)
        window.addEventListener('keyup', keyUp)

        function keyDown(e: KeyboardEvent) {
            if (!Fly1Control.keycodeMap[e.code]) return
            that.moveStatus[Fly1Control.keycodeMap[e.code]] = true
        }
        function keyUp(e: KeyboardEvent) {
            if (!Fly1Control.keycodeMap[e.code]) return
            that.moveStatus[Fly1Control.keycodeMap[e.code]] = false
            
        }
    }

    private initRotate() {
        let that = this

        this.dom.addEventListener('mousedown', down)

        function down(e: MouseEvent) {
            if (e.button === Mouse.mouseLeft) {
                window.addEventListener('mousemove', move)
                window.addEventListener('mouseup', up)
            }

        }

        function move(e: MouseEvent) {
            let deltX = e.movementX / 1000
            let deltY = e.movementY / 1000
            that.body.rotateY(-deltX)
            that.object.rotateX(-deltY)
        }

        function up(e: MouseEvent) {
            if (e.button === Mouse.mouseLeft) {
                window.removeEventListener('mousemove', move)
                window.removeEventListener('mouseup', up)
            }
        }
    }

    destroy(): void {
        
    }

}

/**
 * 轨道控制器
 */
export class OrbitControl extends Control {

    private camera: Camera

    private center1: Object3D = new Object3D()
    private center2: Object3D = new Object3D()

    private dom: HTMLElement

    private r: number //轨道球半径

    constructor(camera: Camera,dom:HTMLElement) {
        super()
        this.camera = camera
        this.dom = dom
        this.r = camera.position.distanceTo(0,0,0)
        this.center2.add(camera)
        this.center1.add(this.center2)
        this.initRotate()
    }

    init() {
        this.initRotate()
    }

    private initRotate() {
        let that = this

        this.dom.addEventListener('mousedown', down)
        this.dom.addEventListener('wheel',wheel)

        function down(e: MouseEvent) {
            if (e.button === Mouse.mouseLeft) {
                window.addEventListener('mousemove', move)
                window.addEventListener('mouseup', up)
            }

        }

        function move(e: MouseEvent) {

            const deltX = e.movementX / 500
            const deltY = e.movementY / 500

            that.center1.rotateY(-deltX)
            that.center2.rotateX(-deltY)
            
        }

        function up(e: MouseEvent) {
            if (e.button === Mouse.mouseLeft) {
                window.removeEventListener('mousemove', move)
                window.removeEventListener('mouseup', up)
            }
        }

        function wheel(e:WheelEvent) {
            const deltaY = e.deltaY / 10
            that.camera.translate(0,0,deltaY)
        }
    }

    update(): void {
        
    }

    destroy(): void {
        
    }

}