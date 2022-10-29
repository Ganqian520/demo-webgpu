import { Vec3 } from "./math";
import { ObjectGPU } from "./ObjectGPU";

export class Cube extends  ObjectGPU{

    constructor(params?:{
        position?:{x:number,y:number,z:number}
        rotation?: { x: number, y: number, z: number }
        scale?: { x: number, y: number, z: number }
    }) {
        super({
            paramsTransf: params,
        },)
        
    }
    
}