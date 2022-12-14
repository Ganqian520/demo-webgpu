import * as dat from 'dat.gui'

import { initWebGPU } from "@/common/util";
import { cubeData, cubeVertexCount } from "./mesh";
import { random, getProjectionMatrix, getModelViewMatrix } from "@/common/math";
import { vertWGSL, fragWGSL, computeWGSL, WGSL } from './wgsl';
import { Boom, FireWork } from './class';
import { Player } from './Player';


const { device, context, format, size, canvas } = await initWebGPU()

const player = new Player(device,canvas,size.width/size.height)

let fireWork = new FireWork(device)

let logBufferSize = 1000


const vertexBuffer = device.createBuffer({
    size: cubeData.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
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

const projectionMatrix = player.projectionMat4.elements

device.queue.writeBuffer(vertexBuffer, 0, cubeData)
device.queue.writeBuffer(colorBuffer, 0, new Float32Array([0, 1, 1, 1]))



function start() {
    initGui()
    frame()

}

async function frame() {
    fireWork.frame()
    player.frame()
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
                    buffer: player.projectionBuffer
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
