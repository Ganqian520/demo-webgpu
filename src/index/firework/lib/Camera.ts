import { Mat4, Vec3 } from "./math";
import { Object3D } from "./Object3D";
import { Renderer } from "./Renderer";

const tm = new Mat4()
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
    }) {
        let { fov, near, far, position } = params || {}
        fov ??= Math.PI * 0.2
        near ??= 0.1
        far ??= 10000
        position ??= {x:0,y:0,z:0}
        super({ position })
        this.fov = fov
        this.near = near
        this.far = far
        this.aspect = Renderer.size.w / Renderer.size.h
        Renderer.vpMatBuffer = Renderer.device.createBuffer({
            size: 16 * Float32Array.BYTES_PER_ELEMENT,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        })
        this.pMat = new Mat4()
        this.addEventListener('updateWorldMatrix',()=>this.updateVpMat())
        this.updateVpMat(true)
    }

    updateVpMat(pChange = false) {
        console.log('updateVpMat');
        if (pChange) {
            this.pMat = tm.makePerspective(this.fov, this.aspect, this.near, this.far)
            // this.pMat = tm.makeOrthProMatrix(Renderer.size.h,Renderer.size.w/Renderer.size.h,1,1000)
        }
        // const vMat = this.getViewMat()
        // this.vpMat = new Mat4().multiplyMatrices(vMat,this.pMat)

        this.vpMat = new Mat4()
        this.vpMat = Mat4.multiplyMatrices(this.pMat,this.worldMatrix)

        Renderer.device.queue.writeBuffer(Renderer.vpMatBuffer, 0, new Float32Array(this.vpMat.elements))
    }

    getViewMat() {
        const pos = this.worldMatrix.getPosition()
        const out = new Mat4()
        out.multiply(tm.makeTranslation(-pos.x, -pos.y, -pos.z))
        return out
    }

}