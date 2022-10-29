import { ObjectGPU, Vec3, Vec4, Mat4 } from "../../lib/index";

const MAX_METEOR_NUM = 1000
const MAX_SPARK_NUM = 1000
const GRAVITY = -7

export class FireWork extends ObjectGPU {

    meteors: Meteor[] = [] //一个爆炸看作多个流星

    upMeteor: Meteor //上升的流星

    birth: number //生日

    pos: Vec3 //起点

    constructor(params: {
        meteorNum: number
        pos: Vec3
    }) {

        let { meteorNum, pos } = params
        super({ paramsGPU: { instanceNum: MAX_METEOR_NUM * MAX_SPARK_NUM } })
        this.pos = pos
        this.birth = +new Date()
        this.onRenderCb = this.frame
        for (let i = 0; i < meteorNum; i++) {
            const ranV = () => Math.random() * 2 - 1
            let vel = new Vec4(ranV(), ranV(), ranV(), 20)
            this.meteors.push(new Meteor({
                birth: this.birth,
                pos: this.pos.clone(),
                vel,
            }))
        }
    }

    frame() {
        let now = +new Date()
        let tps: Particle[] = []
        this.meteors.forEach(v => {
            tps.push(...v.frame(now))
        })
        this.modelMatsData = []
        tps.map(v => {
            let tm = Mat4.fromPosAndSize(v.pos, v.size)
            this.modelMatsData.push(...tm.elements)
        })
        this.instanceNum = tps.length
        this.dispatchEvent('updateInstanceMatrix')
    }

}

class Meteor {

    pos: Vec3
    vel: Vec4
    birth: number //生日
    sparks: Spark[] = [] //火星
    meteorHead: MeteorHead
    produceCount: number = 0 //计数 每多少帧添加一次火星
    produceCycle = 8

    constructor(params: {
        birth: number
        pos: Vec3
        vel: Vec4
    }) {
        let { birth, pos, vel } = params
        this.birth = birth
        this.pos = pos
        this.meteorHead = new MeteorHead({ vel, pos, birth })
    }

    frame(now: number): Particle[] {
        let tps: Particle[] = []
        let tp = this.meteorHead.frame(now)
        tps.push(tp)
        this.addSpark(now)
        this.sparks.forEach(v => {
            let tp = v.frame(now)
            tp && tps.push(tp)
        })
        return tps
    }

    addSpark(now: number) { //前期产生慢
        this.produceCount++
        if (this.produceCount == 8) {
            this.produceCount = 0
            const f = (num:number) => num+random(-1,1)
            this.sparks.push(new Spark({
                pos: new Vec3(f(this.pos.x),f(this.pos.y),f(this.pos.z)),
                birth: now
            }))
        }
    }
}

class Particle {
    pos: Vec3
    size: number
    constructor(params: {
        pos: Vec3
        size: number
    }) {
        const { pos, size } = params
        this.pos = pos
        this.size = size
    }
}

class Spark extends Particle {
    birth: number
    life: {
        stage1: 1000 //变小
    }
    constructor(p: {
        pos: Vec3
        birth: number
    }) {
        const { pos, birth } = p
        super({ pos, size: 0.1 })
        this.birth = birth
    }

    frame(now: number): Particle | null {
        this.size -= 0.001 
        if(this.size<=0){
            return null
        }
        return this
    }
}

class MeteorHead extends Particle {
    vel: Vec4
    birth: number
    life: {
        stage1: 5000, //壮年阶段
        stage2: 2000 //衰弱阶段，变小消失
    }
    gMoment = 1500 //前期忽略重力影响
    constructor(p: {
        pos: Vec3
        birth: number
        vel: Vec4
    }) {
        const { pos, vel, birth } = p
        super({ pos, size: 0.2 })
        this.vel = vel
        this.birth = birth
    }

    frame(now: number): Particle {
        this.calPos(now)
        return this
    }

    calPos(now: number) {
        const { vel, pos, birth, gMoment } = this
        let tms = now - birth
        let t = tms / 1000
        
        let unit = Math.sqrt(vel.w ** 2 / (vel.x ** 2 + vel.y ** 2 + vel.z ** 2))
        pos.x = unit * vel.x * t
        let y_ = unit * vel.y * t
        pos.y = tms>gMoment ? y_ + 0.5 * GRAVITY * ((tms-gMoment)/1000) ** 2 : y_
        pos.z = unit * vel.z * t
    }
}

export function random(min = 0, max = 1, isInt = false) {
    return isInt ? Math.floor(Math.random() * (max - min) + min) : Math.random() * (max - min) + min
}