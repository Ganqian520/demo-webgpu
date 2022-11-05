import { Control } from "./Control";
import { Object3D } from "./Object3D";
import { ObjectGPU } from "./ObjectGPU";


export class Scene extends Object3D {


    control: Control

    constructor(params?:{

    }) {
        super()
    }

    attachControl(control:Control) {
        this.control?.destroy()
        this.control = control
        this.control.init()
    }

}