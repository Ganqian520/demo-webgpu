import { Mat4, Vec3 } from "./math";
import { EventDispatcher } from "./EventDispatcher";

const tm = new Mat4()
const tv = new Vec3()

export class Object3D extends EventDispatcher {

    position: Vec3

    rotation: Vec3

    scale: Vec3

    matrix: Mat4

    worldMatrix: Mat4 //物体m矩阵

    parent: Object3D

    children: Object3D[] = []

    constructor(params?: {
        position?: { x: number, y: number, z: number }
        rotation?: { x: number, y: number, z: number }
        scale?: { x: number, y: number, z: number }
    }) {
        super()
        const { position, rotation, scale } = params || {}
        this.position = position ? new Vec3(position.x, position.y, position.z) : new Vec3(0, 0, 0)
        this.rotation = rotation ? new Vec3(rotation.x, rotation.y, rotation.z) : new Vec3(0, 0, 0)
        this.scale = scale ? new Vec3(scale.x, scale.y, scale.z) : new Vec3(1, 1, 1)
        this.initWorldMatrix()

    }

    initWorldMatrix() {       
        this.worldMatrix = new Mat4()
        this.worldMatrix.multiply(tm.makeTranslation(this.position))
        this.worldMatrix.multiply(tm.makeRotationX(this.rotation.x))
        this.worldMatrix.multiply(tm.makeRotationY(this.rotation.y))
        this.worldMatrix.multiply(tm.makeRotationZ(this.rotation.z))
        this.worldMatrix.multiply(tm.makeScale(this.scale))
        this.dispatchEvent('updateWorldMatrix')
    }

    translateSelf(x: number, y: number, z: number) {
        this.worldMatrix.multiply(tm.makeTranslation(x, y, z))
        this.dispatchEvent('updateWorldMatrix')
    }

    setPosition(x: number, y: number, z: number) {
        this.position = new Vec3(x, y, z)
    }

    rotateX(angle: number) {

        this.worldMatrix.multiply(tm.makeRotationX(angle))
        this.dispatchEvent('updateWorldMatrix')
    }

    rotateY(angle: number) {

        // this.rotation.y += angle
        this.worldMatrix.multiply(tm.makeRotationY(angle))
        this.dispatchEvent('updateWorldMatrix')
    }

    rotateZ(angle: number) {

        this.worldMatrix.multiply(tm.makeRotationZ(angle))
        this.dispatchEvent('updateWorldMatrix')

    }

    add(obj:Object3D) {
        this.children.push(obj)
    }

}