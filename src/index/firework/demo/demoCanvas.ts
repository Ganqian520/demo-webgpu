class Vec3 {

    x: number
    y: number
    z: number

    constructor(x?: number, y?: number, z?: number) {
        this.x = x ?? 0
        this.y = y ?? 0
        this.z = z ?? 0
    }

    applyMatrix(m: Mat4) {

        const x = this.x, y = this.y, z = this.z;
        const e = m.elements;

        let w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15]);
        w = 1

        this.x = (e[0] * x + e[4] * y + e[8] * z + e[12]) * w;
        this.y = (e[1] * x + e[5] * y + e[9] * z + e[13]) * w;
        this.z = (e[2] * x + e[6] * y + e[10] * z + e[14]) * w;

        return this;
    }

    log(msg = '') {
        const tf = (n: number) => Math.floor(n * 100) / 100
        console.log(msg, tf(this.x), tf(this.y), tf(this.z));
        return this
    }
}

export class Mat4 {

    elements: number[]

    constructor() {
        this.elements = [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ];
    }

    set(n11: number, n12: number, n13: number, n14: number, n21: number, n22: number, n23: number, n24: number, n31: number, n32: number, n33: number, n34: number, n41: number, n42: number, n43: number, n44: number) {

        const te = this.elements;

        te[0] = n11; te[4] = n12; te[8] = n13; te[12] = n14;
        te[1] = n21; te[5] = n22; te[9] = n23; te[13] = n24;
        te[2] = n31; te[6] = n32; te[10] = n33; te[14] = n34;
        te[3] = n41; te[7] = n42; te[11] = n43; te[15] = n44;

        return this;

    }

    log(msg = '') {
        const e = [...this.elements].map(v => Math.floor(v * 100) / 100)
        console.log(`${msg}===========`);
        for (let i = 0; i < 4; i++) {
            console.log(e[i], e[i + 4], e[i + 8], e[i + 12]);
        }
        return this
    }

    multiply(m: Mat4) {
        this.elements = Mat4.multiplyMatrices(this, m).elements
    }

    leftMultiply(m:Mat4) {
        this.elements = Mat4.multiplyMatrices(m,this).elements
    }

    clone() {
        let m = new Mat4()
        m.elements = [...this.elements]
        return m
    }



    static makeTranspose(m: Mat4) {

        const out = m.clone()
        const te = out.elements;
        let tmp: number;

        tmp = te[1]; te[1] = te[4]; te[4] = tmp;
        tmp = te[2]; te[2] = te[8]; te[8] = tmp;
        tmp = te[6]; te[6] = te[9]; te[9] = tmp;

        tmp = te[3]; te[3] = te[12]; te[12] = tmp;
        tmp = te[7]; te[7] = te[13]; te[13] = tmp;
        tmp = te[11]; te[11] = te[14]; te[14] = tmp;

        return out;
    }

    static multiplyMatrices(...arr: Mat4[]) {
        return arr.reduce((pre: Mat4, cur: Mat4) => {
            const tm = new Mat4()
            const ae = pre.elements;
            const be = cur.elements;
            const te = tm.elements;

            const a11 = ae[0], a12 = ae[4], a13 = ae[8], a14 = ae[12];
            const a21 = ae[1], a22 = ae[5], a23 = ae[9], a24 = ae[13];
            const a31 = ae[2], a32 = ae[6], a33 = ae[10], a34 = ae[14];
            const a41 = ae[3], a42 = ae[7], a43 = ae[11], a44 = ae[15];

            const b11 = be[0], b12 = be[4], b13 = be[8], b14 = be[12];
            const b21 = be[1], b22 = be[5], b23 = be[9], b24 = be[13];
            const b31 = be[2], b32 = be[6], b33 = be[10], b34 = be[14];
            const b41 = be[3], b42 = be[7], b43 = be[11], b44 = be[15];

            te[0] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
            te[4] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
            te[8] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
            te[12] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;

            te[1] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
            te[5] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
            te[9] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
            te[13] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;

            te[2] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
            te[6] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
            te[10] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
            te[14] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;

            te[3] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
            te[7] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
            te[11] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
            te[15] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;
            return tm
        })
    }

    static makeTranslation(x_: number | Vec3, y?: number, z?: number) {

        const out = new Mat4()

        let x: number

        if (x_ instanceof Vec3) {
            x = x_.x
            y = x_.y
            z = x_.z
        } else {
            x = x_
        }

        out.set(

            1, 0, 0, x,
            0, 1, 0, y,
            0, 0, 1, z,
            0, 0, 0, 1

        );

        return out;

    }

    static makeScale(x_: number | Vec3, y?: number, z?: number) {
        const out = new Mat4()

        let x: number

        if (x_ instanceof Vec3) {
            x = x_.x
            y = x_.y
            z = x_.z
        } else {
            x = x_
        }

        out.set(

            x, 0, 0, 0,
            0, y, 0, 0,
            0, 0, z, 0,
            0, 0, 0, 1

        );

        return out;

    }

    static makeRotationX(theta: number) {
        const out = new Mat4()

        const c = Math.cos(theta), s = Math.sin(theta);

        out.set(

            1, 0, 0, 0,
            0, c, - s, 0,
            0, s, c, 0,
            0, 0, 0, 1

        );

        return out;

    }

    static makeRotationY(theta: number) {

        const out = new Mat4()

        const c = Math.cos(theta), s = Math.sin(theta);

        out.set(

            c, 0, s, 0,
            0, 1, 0, 0,
            - s, 0, c, 0,
            0, 0, 0, 1

        );

        return out;

    }

    static makeRotationZ(theta: number) {
        const out = new Mat4()

        const c = Math.cos(theta), s = Math.sin(theta);

        out.set(

            c, - s, 0, 0,
            s, c, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1

        );

        return out;

    }

    static makeRotateInvert(m: Mat4) {
        return Mat4.makeTranspose(m)
    }

    static makeTrasitionInvert(m: Mat4) {
        const out = m.clone()
        out[12] = -out[12]
        out[13] = -out[13]
        out[14] = -out[14]
        return out
    }

    static makeScaleInvert(m: Mat4) {
        const out = m.clone()
        out[0] = 1 / out[0]
        out[5] = 1 / out[5]
        out[10] = 1 / out[10]
        return out
    }

}



let canvas: HTMLCanvasElement
let ctx: CanvasRenderingContext2D

canvas = document.createElement('canvas')
document.body.appendChild(canvas)
canvas.width = window.innerWidth
canvas.height = window.innerHeight
canvas.style.display = 'block'
ctx = canvas.getContext('2d')

const camRM = new Mat4()

const roaCam = new Vec3(0,0,0)
const posCam = new Vec3(0,0,10)

const roaMod = new Vec3(0,0,0)
const posMod = new Vec3(0,0,0)
const scaMod = new Vec3(1,1,1)

let modM:Mat4 
modM = getModelMatrix() //模型坐标 -> 世界坐标
let viewM = getViewMatrix() //世界坐标 -> 相机坐标
let proM = getProMatrix() //相机坐标 -> ndc坐标
let canM = getCanMatrix() //ndc坐标 -> canvas坐标

const cubeModel = [
    [1, 1, 1, 1, 1, -1, -1, 1, -1, -1, 1, 1, 1, 1, 1], //依次相连形成顶部四条线,
    [1, -1, 1, 1, -1, -1, -1, -1, -1, -1, -1, 1, 1, -1, 1], //底部
    [1, 1, 1, 1, -1, 1], //中间
    [1, 1, -1, 1, -1, -1],
    [-1, 1, -1, -1, -1, -1],
    [-1, 1, 1, -1, -1, 1]
]

const start = +new Date()
let modRY = 0

frame()

function frame() {

    window.requestAnimationFrame(frame)
    ctx.clearRect(0, 0, innerWidth, innerHeight)

    const now = +new Date()

    if(modRY<Math.PI/4){
        modRY += 0.01
        modM.leftMultiply(Mat4.makeRotationY(0.01))
    }else if(now-start<=4000){
        modM.leftMultiply(Mat4.makeTranslation(0.01,0.01,0))
    }
    viewM = getViewMatrix()

    let mvpcM = Mat4.multiplyMatrices(canM, proM, viewM, modM)
    drawModel(cubeModel, mvpcM)

}

function getModelMatrix() {
    modM ??= Mat4.multiplyMatrices(Mat4.makeTranslation(posMod), Mat4.makeScale(scaMod), Mat4.makeRotationY(roaMod.y))

    return modM
}

function getViewMatrix() {
    const camTransM_ = Mat4.makeTranslation(-posCam.x, -posCam.y, -posCam.z)
    const camRoatM_ = Mat4.makeTranspose(camRM)
    const viewM = Mat4.multiplyMatrices(camRoatM_, camTransM_)
    return viewM
}

function getProMatrix() {
    const near = 1, far = 100, height = 10, width = canvas.width / canvas.height * height
    const scaM = Mat4.makeScale(2 / width, 2 / height, 1 / (far - near))
    const persM = a(near,far)
    const proM = Mat4.multiplyMatrices(scaM,persM)
    return proM

    function a(n:number,f:number) {
        return new Mat4().set(
            n,0,0,0,
            0,n,0,0,
            0,0,n+f,-n*f,
            0,0,0,1
        )
    }
}

function getCanMatrix() {
    const posM = Mat4.makeTranslation(1, -1, 0)
    const scaM = Mat4.makeScale(canvas.width / 2, canvas.height / 2, 1)
    const canM = Mat4.multiplyMatrices(scaM, posM)
    return canM
}

function drawModel(data_: Array<Array<number>>, mvpcM: Mat4) {

    const data = JSON.parse(JSON.stringify(data_))

    data.forEach((v: number[]) => {
        for (let i = 0; i <= v.length - 3; i += 3) {
            let x = v[i], y = v[i + 1], z = v[i + 2]
            let vec3 = new Vec3(x, y, z).applyMatrix(mvpcM)
            v[i] = vec3.x
            v[i + 1] = -vec3.y
            v[i + 2] = vec3.z
        }
    })

    data.forEach((v: number[]) => {
        for (let i = 0; i <= v.length - 6; i += 3) {
            let x1 = v[i], y1 = v[i + 1], x2 = v[i + 3], y2 = v[i + 4]
            drawLine(x1, y1, x2, y2)
        }
    })

    function drawLine(x1: number, y1: number, x2: number, y2: number) {
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
    }

}