import { Mat4, Vec3 } from "./math";
import { Object3D } from "./Object3D";
import { Renderer } from "./Renderer";

let a = 0

export class Camera extends Object3D {

    vpMat: Mat4

    pMat: Mat4

    fov: number
    aspect: number
    near: number
    far: number

    constructor(params?: {
        fov?: number,
        near?: number,
        far?: number,
        position?: { x: number, y: number, z: number }
        rotation?: { x: number, y: number, z: number }
    }) {
        let { fov, near, far, position ,rotation} = params || {}
        fov ??= Math.PI * 0.2
        near ??= 0.1
        far ??= 10000
        position ??= {x:0,y:0,z:0}
        super({ position,rotation })
        this.fov = fov
        this.near = near
        this.far = far
        this.aspect = Renderer.size.w / Renderer.size.h
        this.pMat = Mat4.makePerspective(this.fov, this.aspect, this.near, this.far)
        // this.pMat = Mat4.makeOrthProMatrix(Renderer.size.h,Renderer.size.w/Renderer.size.h,this.near,this.far)
        Renderer.vpMatBuffer = Renderer.device.createBuffer({
            size: 16 * Float32Array.BYTES_PER_ELEMENT,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        })
        this.updateVpMat()
    }

    updateVpMat(pChange = false) {

        // const vMat = this.getViewMat()
        // this.vpMat = new Mat4().multiplyMatrices(vMat,this.pMat)

        this.vpMat = Mat4.multiplyMatrices(this.pMat, Mat4.makeInvert(this.worldMatrix))
        Mat4.makeInvert(this.worldMatrix).log('v矩阵')
        this.pMat.log('p矩阵')

        Renderer.device.queue.writeBuffer(Renderer.vpMatBuffer, 0, new Float32Array(this.vpMat.elements))
        this.vpMat.log('vp矩阵写入buffer')
        this.isBufferNeedChange = false
    }

    getViewMat() {
        const pos = this.worldMatrix.getPosition()
        const out = new Mat4()
        out.multiply(Mat4.makeTranslation(-pos.x, -pos.y, -pos.z))
        return out
    }

}