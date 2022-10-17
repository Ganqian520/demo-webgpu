import { Object3D } from "./Object3D";
import { ObjectGPU } from "./ObjectGPU";


export class Scene extends Object3D {

    objects: ObjectGPU[]

    constructor(params?:{

    }) {
        super()
        this.objects = []
    }

    add(object:ObjectGPU) {
        this.objects.push(object)
    }
}