import { Mat4, Vec3 } from "./math";
import { EventDispatcher } from "./EventDispatcher";
import { ObjectGPU } from "./ObjectGPU";


export class Object3D extends EventDispatcher {

    position: Vec3 = new Vec3(0,0,0)

    rotation: Vec3 = new Vec3(0,0,0)

    scale: Vec3 =  new Vec3(1,1,1)

    localMatrix: Mat4 = new Mat4()

    worldMatrix: Mat4 = new Mat4()

    isBufferNeedChange = false

    parent: Object3D

    children: Object3D[] = []

    constructor(params?: {
        position?: { x: number, y: number, z: number }
        rotation?: { x: number, y: number, z: number }
        scale?: { x: number, y: number, z: number }
    }) {
        super()
        this.setFromTRS(params)
        
    }

    setFromTRS(params?: {
        position?: { x: number, y: number, z: number }
        rotation?: { x: number, y: number, z: number }
        scale?: { x: number, y: number, z: number }
    }) {
        const { position, rotation, scale } = params || {}
        if (position) this.position = new Vec3(position.x, position.y, position.z)
        if (rotation) this.rotation = new Vec3(rotation.x, rotation.y, rotation.z)
        if (scale) this.scale = new Vec3(scale.x, scale.y, scale.z)
        this.localMatrix = Mat4.multiplyMatrices(
            Mat4.makeTranslation(this.position),
            Mat4.makeRotationX(this.rotation.x),
            Mat4.makeRotationY(this.rotation.y),
            Mat4.makeRotationZ(this.rotation.z),
            Mat4.makeScale(this.scale),
        )
        this.updateWorldMatrix()
        
    }

    translate(x: number, y: number, z: number) {
        this.localMatrix.multiply(Mat4.makeTranslation(x, y, z))
        this.updateWorldMatrix()
    }

    setPosition(x: number, y: number, z: number) {
        this.position = new Vec3(x, y, z)
    }

    rotateX(angle: number) {

        this.localMatrix.multiply(Mat4.makeRotationX(angle))
        this.updateWorldMatrix()
    }

    rotateY(angle: number) {

        // this.rotation.y += angle
        this.localMatrix.multiply(Mat4.makeRotationY(angle))
        this.updateWorldMatrix()
    }

    rotateZ(angle: number) {

        this.localMatrix.multiply(Mat4.makeRotationZ(angle))
        this.updateWorldMatrix()

    }

    add(obj:Object3D) {
        obj.parent = this
        this.children.push(obj)
    }

    updateWorldMatrix() {
        if(this.parent) {
            this.worldMatrix = Mat4.multiplyMatrices(this.parent.worldMatrix,this.localMatrix)
        }else{
            this.worldMatrix = this.localMatrix
        }
        this.children.length && this.children.forEach((obj: Object3D) => {
            obj.updateWorldMatrix()
        })
        this.isBufferNeedChange = true
    }

}