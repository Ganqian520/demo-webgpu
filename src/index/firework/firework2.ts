import * as dat from 'dat.gui'

import { initWebGPU } from "@/common/util";
import { cubeData, cubeVertexCount } from "./mesh";
import { random, getProjectionMatrix, getModelViewMatrix } from "@/common/math";
import { vertWGSL, fragWGSL, computeWGSL, WGSL } from './wgsl';
import { Boom, FireWork } from './class';


const { device, context, format, size, canvas } = await initWebGPU()

let fireWork = new FireWork(device)


let eyeR = 700
let aspect = size.width / size.height
let eyePosition = { x: 0, y: 0, z: eyeR }
let angleX = 0
let angleY = 0
let fov = 0.33 * Math.PI
let far = Infinity
let near = 0.1
let upY = 1

let logBufferSize = 1000


const vertexBuffer = device.createBuffer({
    size: cubeData.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
})
const projectionBuffer = device.createBuffer({
    size: 4 * 4 * Float32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
})

const paramsBuffer = device.createBuffer({
    size: 1 * Float32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
})
const colorBuffer = device.createBuffer({
    size: 4 * 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
})

const logBuffer = device.createBuffer({
    size: logBufferSize,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
})
const readerBuffer = device.createBuffer({
    size: logBufferSize,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
})

let debug = !true

const projectionMatrix = getProjectionMatrix(aspect, fov, near, far, eyePosition)

device.queue.writeBuffer(vertexBuffer, 0, cubeData)
device.queue.writeBuffer(projectionBuffer, 0, projectionMatrix)
device.queue.writeBuffer(colorBuffer, 0, new Float32Array([0, 1, 1, 1]))



function start() {
    initGui()
    initMouseControl()
    frame()

}

async function frame() {
    fireWork.frame()
    draw()
    if (debug) {
        await new Promise(r => {
            setTimeout(() => {
                r('')
            }, 1000);
        })
    }
    requestAnimationFrame(frame)
}

async function draw() {
    const commandEncoder = device.createCommandEncoder()
    {
        const passEncoder = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: context.getCurrentTexture().createView(),
                clearValue: { r: 0, g: 0, b: 0, a: 1 },
                loadOp: 'clear',
                storeOp: 'store'
            }],
            depthStencilAttachment: {
                view: depthView,
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store'
            }
        })
        passEncoder.setPipeline(renderPipeline)
        passEncoder.setVertexBuffer(0, vertexBuffer)
        passEncoder.setBindGroup(0, createRenderGroup(fireWork.modelViewMatrixBuffer))
        passEncoder.draw(cubeVertexCount, fireWork.drawCount)
        passEncoder.end()
    }
    debug && commandEncoder.copyBufferToBuffer(logBuffer, 0, readerBuffer, 0, logBufferSize)
    device.queue.submit([commandEncoder.finish()])
    if (debug) {
        await readerBuffer.mapAsync(GPUMapMode.READ)
        let result = new Float32Array(readerBuffer.getMappedRange())
        // console.log(result.slice(0, 20));
        readerBuffer.unmap()
    }
}

function initMouseControl() {
    const mouseLeft = 0
    let isDown = false
    let isClick = true
    canvas.addEventListener('mousedown', down)
    canvas.addEventListener('wheel', wheel)

    function down(e: MouseEvent) {
        if (e.button === mouseLeft) {
            isDown = true
            window.addEventListener('mousemove', move)
            window.addEventListener('mouseup', up)
        }
    }
    function move(e: MouseEvent) {
        isClick = false
        angleX += e.movementX / 300 
        // angleY += e.movementY / 300
        if (angleY >= 0.5 * Math.PI) angleY = 0.5 * Math.PI
        if (angleY <= -0.5 * Math.PI) angleY = -0.5 * Math.PI
        eyePosition.y = eyeR * Math.sin(angleY)
        let temp = eyeR * Math.cos(angleY)
        eyePosition.x = -temp * Math.sin(angleX)
        eyePosition.z = temp * Math.cos(angleX)
        console.log(eyePosition);
        let projectionData = getProjectionMatrix(aspect, 0.33 * Math.PI, 0.1, 100000, eyePosition, upY)
        device.queue.writeBuffer(projectionBuffer, 0, projectionData)
        draw()
    }
    function up(e: MouseEvent) {
        if (e.button === mouseLeft) {
            //   isClick && Boom.add({x:random(-100,100),y:0,z:random(-100,100)})
            isDown = false
            isClick = true
            window.removeEventListener('mousemove', move)
            window.removeEventListener('mouseup', up)
        }
    }
    function wheel(e: WheelEvent) {
        eyeR += e.deltaY / 10
        if (eyeR < near) eyeR = near
        eyePosition.y = -eyeR * Math.sin(angleY)
        let temp = eyeR * Math.cos(angleY)
        eyePosition.x = temp * Math.sin(angleX)
        eyePosition.z = temp * Math.cos(angleX)
        let projectionData = getProjectionMatrix(aspect, 0.33 * Math.PI, 0.1, 1000, eyePosition)
        device.queue.writeBuffer(projectionBuffer, 0, projectionData)
        draw()
    }
}

function initGui() {
    let obj = {
        color: [0, 255, 255]
    }
    let gui = new dat.GUI()
    gui.addColor(obj, 'color').onChange(e => {
        device.queue.writeBuffer(colorBuffer, 0, new Float32Array([...e.map((v: number) => v / 255), 1]))
        draw()
    })
}

const renderPipeline = await device.createRenderPipelineAsync({
    layout: 'auto',
    vertex: {
        module: device.createShaderModule({ code: WGSL }),
        entryPoint: 'v_main',
        buffers: [{
            arrayStride: 3 * 4,
            attributes: [{
                shaderLocation: 0,
                offset: 0,
                format: 'float32x3'
            }]
        }]
    },
    fragment: {
        module: device.createShaderModule({ code: WGSL }),
        entryPoint: 'f_main',
        targets: [{ format }]
    },
    primitive: {
        topology: 'triangle-list',
        cullMode: 'back',
        frontFace: 'ccw'
    },
    depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth24plus'
    }
})

async function createRenderPipelineAsync() {
    return await device.createRenderPipelineAsync({
        layout: 'auto',
        vertex: {
            module: device.createShaderModule({ code: WGSL }),
            entryPoint: 'v_main',
            buffers: [{
                arrayStride: 3 * 4,
                attributes: [{
                    shaderLocation: 0,
                    offset: 0,
                    format: 'float32x3'
                }]
            }]
        },
        fragment: {
            module: device.createShaderModule({ code: WGSL }),
            entryPoint: 'f_main',
            targets: [{ format }]
        },
        primitive: {
            topology: 'triangle-list',
            cullMode: 'back',
            frontFace: 'ccw'
        },
        depthStencil: {
            depthWriteEnabled: true,
            depthCompare: 'less',
            format: 'depth24plus'
        }
    })
}

function createRenderGroup(buffer: GPUBuffer) {
    return device.createBindGroup({
        layout: renderPipeline.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: projectionBuffer
                }
            },
            {
                binding: 1,
                resource: {
                    buffer: colorBuffer
                }
            },
            {
                binding: 2,
                resource: {
                    buffer: buffer
                }
            }
        ]
    })
}

const depthView = device.createTexture({
    size,
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
    format: 'depth24plus',
}).createView()

start()
