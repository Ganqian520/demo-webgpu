import * as dat from 'dat.gui'

import { initWebGPU } from "@/common/util";
import { cubeData, cubeVertexCount } from "./mesh";
import { getMvpMatrix,random } from "@/common/math";
import { vertWGSL, fragWGSL, computeWGSL } from './wgsl';

const { device, context, format, size, canvas } = await initWebGPU()

const num = 10

const renderPipeline = device.createRenderPipeline({
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

const vertexBuffer = device.createBuffer({
  size: cubeData.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
})
device.queue.writeBuffer(vertexBuffer, 0, cubeData)

const mvpBuffer = device.createBuffer({
  size: 4 * 4 * 4,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
})

const paramsBuffer = device.createBuffer({
  size: 1 * Float32Array.BYTES_PER_ELEMENT,
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
})

const colorBuffer = device.createBuffer({
  size: 4 * 4,
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
})
device.queue.writeBuffer(colorBuffer, 0, new Float32Array([1, 0, 0, 1]))

const particlesBuffer = device.createBuffer({
  size: 9 * num * Float32Array.BYTES_PER_ELEMENT,
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
})
const particlesData = new Float32Array(num*9)
for(let i=0;i<num;i++){
  const obj ={
    position: [0,0,-10],
    velocity: [random(-100,100),random(-100,100),random(-100,100),0.001],
    gravity: 10,
    birthTime: Date.now()
  }
  particlesData.set( 
    Object.values(obj).reduce((acc:any,cur:any)=>{
      if(cur instanceof Array){
        return [...acc,...cur]
      }else {
        return [...acc,cur]
      }
    },[]) as  number[],
    i*9
  )
}
device.queue.writeBuffer(particlesBuffer,0,particlesData)

const renderGroup = device.createBindGroup({
  layout: renderPipeline.getBindGroupLayout(0),
  entries: [{
    binding: 0,
    resource: {
      buffer: mvpBuffer
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
  },
  {
    binding: 1,
    resource : {
      buffer: particlesBuffer
    }
  }
]
})

const depthView = device.createTexture({
  size,
  usage: GPUTextureUsage.RENDER_ATTACHMENT,
  format: 'depth24plus',
}).createView()

let aspect = size.width / size.height
let position = { x: 0, y: 0, z: -5 }
let rotation = { x: 0, y: 0, z: 0 }
let scale = { x: 1, y: 1, z: 1 }

start()
function start() {
  initGui()
  initMouseControl()
  frame()
}

function frame() {
  device.queue.writeBuffer(paramsBuffer,0,new Float32Array([Date.now()]))
  let mvpMatrix = getMvpMatrix(aspect, position, rotation, scale)
  device.queue.writeBuffer(mvpBuffer, 0, mvpMatrix.buffer)
  draw()
  requestAnimationFrame(frame)
}

function draw() {
  const commandEncoder = device.createCommandEncoder()
  {
    const passEncoder = commandEncoder.beginComputePass()
    passEncoder.setPipeline(computePipeline)
    passEncoder.setBindGroup(0, computeGroup)
    passEncoder.dispatchWorkgroups(Math.ceil(num*cubeVertexCount/128))
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
    passEncoder.draw(cubeVertexCount,num)
    passEncoder.end()
  }
  device.queue.submit([commandEncoder.finish()])
}

function initMouseControl() {
  const mouseLeft = 0
  let isDown = false
  canvas.addEventListener('mousedown', down)

  function down(e: MouseEvent) {
    if (e.button === mouseLeft) {
      isDown = true
      window.addEventListener('mousemove', move)
      window.addEventListener('mouseup', up)
    }
  }
  function move(e: MouseEvent) {
    rotation.y += e.movementX/100
    let mvpMatrix = getMvpMatrix(aspect, position, rotation, scale)
    device.queue.writeBuffer(mvpBuffer, 0, mvpMatrix.buffer)
    draw()
  }
  function up(e: MouseEvent) {
    if (e.button === mouseLeft) {
      isDown = false
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
  }
  function wheel(e:MouseEvent) {
    
  }
}

function initGui() {
  let obj = {
    color: [1, 0, 0]
  }
  let gui = new dat.GUI()
  gui.addColor(obj, 'color').onChange(e => {
    device.queue.writeBuffer(colorBuffer, 0, new Float32Array([...e.map((v: number) => v / 255), 1]))
    draw()
  })
}
