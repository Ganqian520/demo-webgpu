import { Camera } from "./Camera"
import { Mat4, Vec3 } from "./math"
import { Object3D } from "./Object3D"


enum Mouse {
    mouseLeft = 0
}

const tm = new Mat4()

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
    private eyeMatrix: Mat4 //控制选择的矩阵
    private bodyMatrix: Mat4 //控制移动的矩阵

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
        this.eyeMatrix = new Mat4()
        this.bodyMatrix =  new Mat4()
        
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

        this.object.translateSelf(x,y,z)
        // this.bodyMatrix.multiply(tm.makeTranslation(x, y, z))
        // this.object.worldMatrix.multiply(this.bodyMatrix)
        // this.object.worldMatrix = tm.multiplyMatrices(this.bodyMatrix,this.object.worldMatrix)
        // console.log(this.object.worldMatrix.elements);
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
            that.object.rotateY(-deltX)
            that.object.rotateX(-deltY)
            // that.eyeMatrix.multiply(tm.makeRotationY(-deltX))
            // that.eyeMatrix.multiply(tm.makeRotationX(-deltY))
            // that.object.worldMatrix.multiply(that.eyeMatrix)
            // that.object.worldMatrix = tm.multiplyMatrices(that.eyeMatrix, that.object.worldMatrix)
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

    private dom: HTMLElement

    private deltX: number
    private deltY: number

    private r: number //轨道球半径

    constructor(camera: Camera,dom:HTMLElement) {
        super()
        this.camera = camera
        this.dom = dom
        this.r = camera.position.distanceTo(0,0,0)
        this.initRotate()
    }

    init() {
        this.initRotate()
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

            let { deltX, deltY,camera,r } = that 

            deltX = e.movementX / 100000
            deltY = e.movementY / 100000

            let right = 0.5*Math.PI

            if(deltY>=right) deltY = right
            if(deltY<=-right) deltY = -right

            camera.position.y = r*Math.sin(deltY)

            let temp = r*Math.cos(deltY)

            camera.position.x = -temp*Math.sin(deltX)
            camera.position.z = temp*Math.cos(deltX)

            camera.initWorldMatrix()
            console.log(camera.worldMatrix.elements);
            camera.worldMatrix.lookAt(camera.position)
            console.log(camera.worldMatrix.elements);
            
            that.camera.dispatchEvent('updateWorldMatrix')
        }

        function up(e: MouseEvent) {
            if (e.button === Mouse.mouseLeft) {
                window.removeEventListener('mousemove', move)
                window.removeEventListener('mouseup', up)
            }
        }
    }

    update(): void {
        
    }

    destroy(): void {
        
    }

}