import * as dat from 'dat.gui'

import { initWebGPU } from "@/common/util";
import { cubeData, cubeVertexCount } from "./mesh";
import { random, getProjectionMatrix, getModelViewMatrix } from "@/common/math";
import { vertWGSL, fragWGSL, computeWGSL } from './wgsl';
import { Boom } from './class';

const { device, context, format, size, canvas } = await initWebGPU()
Boom.initBuffer(device)


let eyeR = 1000
let aspect = size.width / size.height
let eyePosition = { x: 0, y: 0, z: eyeR }
let angle = 0
let fov = 0.33 * Math.PI
let far = 1000_000_000_000
let near = 0.1


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
  size: Boom.meteorNum,
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
})
const readerBuffer = device.createBuffer({
  size: Boom.meteorNum,
  usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
})

let debug = !true

const projectionMatrix = getProjectionMatrix(aspect, fov, near, far, eyePosition)

device.queue.writeBuffer(vertexBuffer, 0, cubeData)
device.queue.writeBuffer(projectionBuffer, 0, projectionMatrix)
device.queue.writeBuffer(colorBuffer, 0, new Float32Array([0, 1, 1, 1]))

Boom.add()

function start() {
  initGui()
  initMouseControl()
  frame()

}

async function frame() {
  device.queue.writeBuffer(paramsBuffer, 0, new Float32Array([Date.now() % 1000000]))
  Boom.update()
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
    const passEncoder = commandEncoder.beginComputePass()
    passEncoder.setPipeline(computePipeline)
    passEncoder.setBindGroup(0, computeGroup)
    passEncoder.dispatchWorkgroups(Math.ceil(Boom.booms.length * Boom.meteorNum / 128)) //组数
    passEncoder.end()
  }
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
    passEncoder.setBindGroup(0, renderGroup)
    passEncoder.draw(cubeVertexCount, Boom.booms.length * Boom.meteorNum)
    passEncoder.end()
  }
  debug && commandEncoder.copyBufferToBuffer(logBuffer, 0, readerBuffer, 0, Boom.meteorNum)
  device.queue.submit([commandEncoder.finish()])
  if (debug) {
    await readerBuffer.mapAsync(GPUMapMode.READ)
    let result = new Float32Array(readerBuffer.getMappedRange())
    console.log(result.slice(0,20));
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
    angle += e.movementX / 10
    eyePosition.z = Math.sin(angle) * eyeR
    eyePosition.x = Math.cos(angle) * eyeR
    let projectionData = getProjectionMatrix(aspect, 0.33 * Math.PI, 0.1, 100000, eyePosition)
    device.queue.writeBuffer(projectionBuffer, 0, projectionData)
    draw()
  }
  function up(e: MouseEvent) {
    if (e.button === mouseLeft) {
      isClick && Boom.add({x:random(-100,100),y:0,z:random(-100,100)})
      isDown = false
      isClick = true
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
  }
  function wheel(e: WheelEvent) {
    eyeR += e.deltaY / 10
    if (eyeR < 0) eyeR = 0
    eyePosition.z = Math.sin(angle) * eyeR
    eyePosition.x = Math.cos(angle) * eyeR
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
    module: device.createShaderModule({ code: vertWGSL }),
    entryPoint: 'main',
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
    module: device.createShaderModule({ code: fragWGSL }),
    entryPoint: 'main',
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

const computePipeline = await device.createComputePipelineAsync({
  layout: 'auto',
  compute: {
    module: device.createShaderModule({ code: computeWGSL }),
    entryPoint: 'main'
  }
})

const renderGroup = device.createBindGroup({
  layout: renderPipeline.getBindGroupLayout(0),
  entries: [{
    binding: 0,
    resource: {
      buffer: Boom.mvpMatrixBuffer
    }
  }, {
    binding: 1,
    resource: {
      buffer: colorBuffer
    }
  }]
})

const computeGroup = device.createBindGroup({
  layout: computePipeline.getBindGroupLayout(0),
  entries: [{
    binding: 0,
    resource: {
      buffer: paramsBuffer
    }
  }, {
    binding: 1,
    resource: {
      buffer: Boom.boomsBuffer,
    }
  }, {
    binding: 2,
    resource: {
      buffer: Boom.modelViewMatrixBuffer
    },
  }, {
    binding: 3,
    resource: {
      buffer: Boom.mvpMatrixBuffer
    },
  }, {
    binding: 4,
    resource: {
      buffer: projectionBuffer
    }
  }, {
    binding: 5,
    resource: {
      buffer: logBuffer,
    }
  }
  ]
})
const depthView = device.createTexture({
  size,
  usage: GPUTextureUsage.RENDER_ATTACHMENT,
  format: 'depth24plus',
}).createView()

start()
