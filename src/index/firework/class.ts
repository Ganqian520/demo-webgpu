import { vec3, vec4 } from "gl-matrix";

import { random, getModelViewMatrix, getNow, getPositionByGravity } from "@/common/math"



export class FireWork {

  static MAX_SIZE = 100

  meteors: Meteor[] = [] //一个爆炸烟花看作多个流星
  pos: number[] //爆炸位置
  birth: number //出生时间
  life: number //存活时长

  drawCount: number
  modelViewMatrixBuffer: GPUBuffer
  device: GPUDevice

  constructor(device: GPUDevice, size = 20, pos = [-500,-500,-500], life = 10) {
    this.pos = pos
    this.birth = Date.now()
    this.device = device
    this.life = life
    this.modelViewMatrixBuffer = device.createBuffer({
      size: FireWork.MAX_SIZE * Meteor.MAX_SIZE * 16 * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE
    })
    for (let i = 0; i < size; i++) {
      let vel = [Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1] //流星方向
      // let vel = [1,0,0]
      if(i==0){
        vel = [1,0,0]
      }else if(i>=1 && i<=3){
        vel = [0,1,0]
      }else {
        vel = [0,0,1]
      }
      this.meteors.push(new Meteor(50, pos, vel, 1 / 10, this.birth))
    }

  }

  frame() {
    // console.time('frame')
    let now = Date.now()
    let modelViewMatrixData: number[] = []
    this.meteors.forEach(meteor => {
      meteor.frame(now)
      modelViewMatrixData.push(...meteor.modelViewMatrixData)
    })
    this.drawCount = modelViewMatrixData.length/16

    // console.timeEnd('frame')
    this.device.queue.writeBuffer(this.modelViewMatrixBuffer, 0, new Float32Array(modelViewMatrixData))
  }
}

class Meteor { //流星

  static MAX_SIZE = 1000
  static SPARK_DELTA = 1

  pos: number[]
  vel: number[] //初速度方向
  speed: number //初速度大小
  birth: number
  meteorHead: MeteorHead //流星头
  sparks: Spark[] = [] //残留火星
  sparkNum: number
  modelViewMatrixData: number[]
  sparkDelta: number = 5 //控制火星产生的间隔


  constructor(size = 500, pos: number[], vel: number[], speed: number, birth: number) {
    if(size>Meteor.MAX_SIZE-1){
      alert('流星粒子设定过多')
    }
    this.sparkNum = size
    this.pos = pos
    this.vel = vel
    this.birth = birth
    this.speed = speed
    this.meteorHead = new MeteorHead(pos)
  }

  frame(now: number) {
    let pos = this.meteorHead.pos
    // this.meteorHead.frame(getPositionByGravity(pos, now - this.birth, this.vel, this.speed))
    --this.sparkDelta
    if (this.sparks.length < this.sparkNum) {
      this.meteorHead.frame(getPositionByGravity(pos, now - this.birth, this.vel, this.speed))
    }
    if (this.sparkDelta == -1 && this.sparks.length < this.sparkNum) {
      let a = 2
      let spark = new Spark([pos[0] + random(-a, a), pos[1] + random(-a, a), pos[2] + random(-a, a)])
      this.sparks.push(spark)
      this.sparkDelta = Meteor.SPARK_DELTA
    }
    this.modelViewMatrixData = [...this.meteorHead.modelViewMatrixData]
    this.sparks.forEach(spark =>{
      this.modelViewMatrixData.push(...spark.modelViewMatrixData)
    })
  }

}

class Particle {

  pos: number[]
  modelViewMatrixData: number[]
  scale: number
  color: number[]

  constructor(particleParam: {
    pos?: number[]
    modelViewMatrixData?: number[]
    scale?: number
    color?: number[]
  }) {
    const { pos, scale, color } = particleParam
    this.pos = pos || [0, 0, 0]
    this.modelViewMatrixData = [
      scale, 0, 0, 0,
      0, scale, 0, 0,
      0, 0, scale, 0,
      pos[0], pos[1], pos[2], 1,
    ]
    this.scale = scale || 1
    this.color = color
  }

  frame(pos = [0, 0, 0], scale = 1) {
    this.pos = pos
    this.scale = scale
    if (scale != this.scale) {
      this.modelViewMatrixData[0] = scale
      this.modelViewMatrixData[5] = scale
      this.modelViewMatrixData[10] = scale
    }
    this.modelViewMatrixData[12] = pos[0]
    this.modelViewMatrixData[13] = pos[1]
    this.modelViewMatrixData[14] = pos[2]
  }

}

class MeteorHead extends Particle {
  constructor(pos:number[]) {
    super({ pos,scale: 1 })
  }
}


class Spark extends Particle {
  constructor(pos:number[]) {
    super({ pos,scale:0.2 })
  }
}



export class Boom {

  static device: GPUDevice

  static boomsBuffer: GPUBuffer
  static modelViewMatrixBuffer: GPUBuffer
  static mvpMatrixBuffer: GPUBuffer

  static booms: Boom[] = []

  static boomNum = 20 //最多存在烟花
  static meteorNum = 300 //一个烟花产生的流星个数
  static particlePropertyLen = 10 //一个粒子上的属性个数

  headsData: Float32Array;
  modelViewMatrixData: Float32Array

  birthTime: number;
  life: number
  position: Position

  constructor(position: Position = { x: 0, y: 0, z: 0 }, num = Boom.meteorNum) {
    this.position = position
    this.birthTime = getNow();
    this.life = 9_000
    this.headsData = new Float32Array(num * Boom.particlePropertyLen * Float32Array.BYTES_PER_ELEMENT)
    this.modelViewMatrixData = new Float32Array(num * 16 * Float32Array.BYTES_PER_ELEMENT)
    for (let i = 0; i < num; i++) {
      const obj = {
        position: Object.values(position),
        velocity: [random(-100, 100), random(-100, 100), random(-100, 100), 50],
        gravity: 3,
        birthTime: this.birthTime,
        life: this.life,
      }
      this.headsData.set(
        Object.values(obj).reduce((acc: any, cur: any) => {
          if (cur instanceof Array) {
            return [...acc, ...cur]
          } else {
            return [...acc, cur]
          }
        }, []) as number[],
        i * Boom.particlePropertyLen
      )
      this.modelViewMatrixData.set(getModelViewMatrix(position), i * 16)
    }
  }

  static add(position: Position = { x: 0, y: 0, z: 0 }, num = Boom.meteorNum) {
    let boom = new Boom(position, num)
    Boom.booms.push(boom)
    Boom.writeBuffer()
  }

  //判断是否有烟花已经结束
  static update() {
    let now = getNow()
    let isDelete = false
    for (let i = 0; i < Boom.booms.length; i++) {
      let boom = Boom.booms[i]
      if (boom.birthTime + boom.life <= now) {
        Boom.booms.splice(i, 1)
        i--
        isDelete = true
      }
    }
    isDelete && this.writeBuffer()
  }

  static writeBuffer() {
    const boomsData = Boom.booms.reduce((acc, cur) => [...acc, ...cur.headsData], [])
    const modelsData = Boom.booms.reduce((acc, cur) => [...acc, ...cur.modelViewMatrixData], [])
    Boom.device.queue.writeBuffer(Boom.boomsBuffer, 0, new Float32Array(boomsData))
    Boom.device.queue.writeBuffer(Boom.modelViewMatrixBuffer, 0, new Float32Array(modelsData))
  }

  static initBuffer(device: GPUDevice) {
    Boom.device = device
    Boom.boomsBuffer = Boom.device.createBuffer({
      size: Boom.boomNum * Boom.meteorNum * Boom.particlePropertyLen * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE
    })
    Boom.modelViewMatrixBuffer = Boom.device.createBuffer({
      size: Boom.boomNum * Boom.meteorNum * Boom.particlePropertyLen * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE
    })
    Boom.mvpMatrixBuffer = Boom.device.createBuffer({
      size: Boom.boomNum * Boom.meteorNum * 16 * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE
    })
  }
}



type Position = {
  x: number,
  y: number,
  z: number,
}