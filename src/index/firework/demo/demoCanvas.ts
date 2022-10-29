import { Mat4, Vec3 } from '../lib/index'

let canvas: HTMLCanvasElement
let ctx: CanvasRenderingContext2D

canvas = document.createElement('canvas')
document.body.appendChild(canvas)
canvas.width = window.innerWidth
canvas.height = window.innerHeight
canvas.style.display = 'block'
ctx = canvas.getContext('2d')

const tm = new Mat4()

// const camRoatM = new Mat4().multiply(tm.makeRotationY(Math.PI * 0.5)) //相机旋转
const camRoatM = new Mat4()

let camM_ = new Mat4()
let modM_ = new Mat4()

let modM = getModelMatrix()
let viewM = getViewMatrix()
let proM = getProMatrix()
let canM = getCanMatrix()


const cubeModel = [
    [1, 1, 1, 1, 1, -1, -1, 1, -1, -1, 1, 1, 1, 1, 1], //依次相连形成顶部四条线,
    [1, -1, 1, 1, -1, -1, -1, -1, -1, -1, -1, 1, 1, -1, 1], //底部
    [1, 1, 1, 1, -1, 1], //中间
    [1, 1, -1, 1, -1, -1],
    [-1, 1, -1, -1, -1, -1],
    [-1, 1, 1, -1, -1, 1]
]

function frame() {

    ctx.clearRect(0,0,innerWidth,innerHeight)

    let mvpcM = getMvpcMatrix(canM, proM, viewM, modM)

    drawModel(cubeModel, mvpcM)

    // modM.multiply(tm.makeRotationY(0.01))
    // viewM.multiply(tm.makeRotationY(0.01))
    camRoatM.multiply(tm.makeRotationY(0.01))
    viewM = getViewMatrix()

    window.requestAnimationFrame(frame)
}

frame()

function getModelMatrix(){
    const modM = new Mat4()

    return modM
}

function getViewMatrix() {
    const viewM = new Mat4()
    const posCam = new Vec3(0, 0, 10) //相机位置
    // const camRoatM = new Mat4().multiply(tm.makeRotationY(Math.PI * 0.5)) //相机旋转
    const camTransM_ = new Mat4().multiply(tm.makeTranslation(-posCam.x, -posCam.y, -posCam.z))
    const camRoatM_ = camRoatM.clone().transpose()
    viewM.multiply(camRoatM_)
    viewM.multiply(camTransM_)
    return viewM
}

function getProMatrix() {
    const proM = new Mat4()
    const near = 1, far = 100, height = 10, width = canvas.width / canvas.height * height //定义可视范围
    const posM = new Mat4().multiply(tm.makeTranslation(0, 0, near))
    const scaM = new Mat4().multiply(tm.makeScale(2 / width, 2 / height, 1 / (far - near)))
    proM.multiply(scaM)
    proM.multiply(posM)
    return proM
}

function getCanMatrix() {
    const canM = new Mat4()
    const posM = new Mat4().multiply(tm.makeTranslation(1, -1, 0))
    const scaM = new Mat4().multiply(tm.makeScale(canvas.width / 2, canvas.height / 2, 1))
    canM.multiply(scaM)
    canM.multiply(posM)
    return canM
}

function getMvpcMatrix(canM:Mat4,proM:Mat4,viewM:Mat4,modM:Mat4) {
    let mvpcM = new Mat4()
    mvpcM.multiply(canM)
    mvpcM.multiply(proM)
    mvpcM.multiply(viewM)
    mvpcM.multiply(modM)
    return mvpcM
}

function drawModel(data_:Array<Array<number>>,mvpcM:Mat4){
    const data = JSON.parse(JSON.stringify(data_))
    data.forEach((v: number[]) => {
        for (let i = 0; i <= v.length - 3; i += 3) {
            let x = v[i], y = v[i + 1], z=v[i+2]
            let vec3 = new Vec3(x,y,z).applyMatrix(mvpcM)
            v[i] = vec3.x
            v[i+1] = -vec3.y
            v[i+2] = vec3.z
        }
    })
    data.forEach((v: number[]) => {
        for(let i=0;i<=v.length-6;i+=3){
            let x1 = v[i], y1=v[i+1],x2=v[i+3],y2=v[i+4]
            drawLine(x1,y1,x2,y2)
        }
    })
    // console.log(data[0][0]);
}


function drawLine(x1: number, y1: number, x2: number, y2: number) {
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
}

