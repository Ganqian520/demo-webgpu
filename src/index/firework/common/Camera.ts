import { Mat4, Vec3 } from "./math";
import { Object3D } from "./Object3D";
import { Renderer } from "./Renderer";

const tm = new Mat4()

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
        fov ??= Math.PI * 0.2 //fov越小图形越大？90度没了？
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
        // this.addEventListener('updateWorldMatrix',()=>this.updateVpMat(true))
        this.updateVpMat(true)
    }

    updateVpMat(pChange: boolean) {
        if (pChange) {
            this.pMat = tm.makePerspective(this.fov, this.aspect, this.near, this.far)
        }
        console.log('p', this.pMat.elements);
        console.log('v', this.worldMatrix.elements);
        this.vpMat = new Mat4()
        this.vpMat = tm.multiplyMatrices(this.pMat, this.worldMatrix)
        Renderer.device.queue.writeBuffer(Renderer.vpMatBuffer, 0, new Float32Array(this.vpMat.elements))
    }
}