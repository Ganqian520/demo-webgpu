import { random } from "@/common/math";

export class Boom {
  birthTime: number;
  lifeTime: number
  headsData: Float32Array;
  position: Position
  
  constructor(num = 100,position:Position = {x:0,y:0,z:0}){
    this.position = position
    this.birthTime = Date.now()%1000000;
    this.lifeTime = 5_000
    this.headsData = new Float32Array(num*Float32Array.BYTES_PER_ELEMENT)
    for (let i = 0; i < num; i++) {
      const position = { x: 0, y: 0, z: 0 }
      const obj = {
        position: Object.values(position),
        velocity: [random(-100, 100), random(-100, 100), random(-100, 100), 50],
        gravity: 3,
        birthTime: this.birthTime,
      }
      this.headsData.set(
        Object.values(obj).reduce((acc: any, cur: any) => {
          if (cur instanceof Array) {
            return [...acc, ...cur]
          } else {
            return [...acc, cur]
          }
        }, []) as number[],
        i * (3 + 4 + 1 + 1)
      )
    }
  }
}


type Position = {
  x:number,
  y:number,
  z:number,
}