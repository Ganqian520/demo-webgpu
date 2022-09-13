import { initWebGPU } from "@/common/util";
import * as dat from 'dat.gui'
import spriteWGSL from './sprite.wgsl?raw';
import updateSpritesWGSL from './updateSprites.wgsl?raw';

const { device, context, format, size } = await initWebGPU()

const renderPipeline = await device.createRenderPipelineAsync({
  layout: 'auto',
  vertex: {
    module: device.createShaderModule({ code: spriteWGSL }),
    entryPoint: 'vert_main',
    buffers: [
      //instanced particles buffer
      {
        arrayStride: 4*4,
        stepMode: 'instance',
        attributes: [{
          shaderLocation: 0, //位置
          offset: 0,
          format: 'float32x2'
        },{
          shaderLocation: 1, //速度
          offset: 2*4,
          format: 'float32x2'
        }]
      },
      // vertex buffer
      {
        arrayStride: 2*4,
        stepMode: 'vertex',
        attributes: [{
          shaderLocation: 2,
          offset: 0,
          format: 'float32x2'
        }]
      }
    ]
  },
  fragment: {
    module: device.createShaderModule({ code: spriteWGSL }),
    entryPoint: 'frag_main',
    targets: [{format}],
  },
  primitive: {
    topology: 'triangle-list'
  }
})

const comoutePipline = await device.createComputePipelineAsync({
  layout: 'auto',
  compute: {
    module: device.createShaderModule({code: updateSpritesWGSL}),
    entryPoint: 'main'
  }
})

const vertexBufferData = new Float32Array([
  -0.01, -0.02, 0.01,
  -0.02, 0.0, 0.02,
]);
const spriteVertexBuffer = device.createBuffer({
  size: vertexBufferData.byteLength,
  usage: GPUBufferUsage.VERTEX,
  mappedAtCreation: true,
})
new Float32Array(spriteVertexBuffer.getMappedRange()).set(vertexBufferData)
spriteVertexBuffer.unmap()

const simParams = {
  deltaT: 0.04,
  rule1Distance: 0.1,
  rule2Distance: 0.025,
  rule3Distance: 0.025,
  rule1Scale: 0.02,
  rule2Scale: 0.05,
  rule3Scale: 0.005,
};
const simParamBufferSize = 7*Float32Array.BYTES_PER_ELEMENT
const simParamBuffer = device.createBuffer({
  size: simParamBufferSize,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
})
function updateSimParams() {
  device.queue.writeBuffer(simParamBuffer,0,new Float32Array(Object.values(simParams)))
}
updateSimParams()
const gui = new dat.GUI()
Object.keys(simParams).forEach(key => {
  gui.add(simParams,key).onFinishChange(updateSimParams)
})

const numParticles = 1500
const initialParticleData = new Float32Array(numParticles*4)
for(let i=0;i<numParticles;i++){
  initialParticleData[4*i+0] = 2*(Math.random()-0.5)
  initialParticleData[4*i+1] = 2*(Math.random()-0.5)
  initialParticleData[4*i+2] = 2*(Math.random()-0.5) * 0.5
  initialParticleData[4*i+3] = 2*(Math.random()-0.5) * 0.5
}
const particleBuffers: GPUBuffer[] = new Array(2)
const particleBindGroups: GPUBindGroup[] = new Array(2)
for(let i=0;i<2;i++){
  particleBuffers[i] = device.createBuffer({
    size: initialParticleData.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE,
    mappedAtCreation: true,
  })
  new Float32Array(particleBuffers[i].getMappedRange()).set(initialParticleData)
  particleBuffers[i].unmap()
}
for(let i=0;i<2;i++){
  particleBindGroups[i] = device.createBindGroup({
    layout: comoutePipline.getBindGroupLayout(0),
    entries: [{
      binding: 0,
      resource: {
        buffer: simParamBuffer
      }
    },{
      binding: 1,
      resource: {
        buffer: particleBuffers[i],
        offset: 0,
        size: initialParticleData.byteLength,
      }
    },{
      binding:2,
      resource: {
        buffer: particleBuffers[(i+1)%2],
        offset: 0,
        size: initialParticleData.byteLength
      }
    }]
  })
}

let t = 0
frame()
function frame(){
  const commandEncoder = device.createCommandEncoder()
  {
    const passEncoder = commandEncoder.beginComputePass()
    passEncoder.setPipeline(comoutePipline)
    passEncoder.setBindGroup(0,particleBindGroups[t%2])
    passEncoder.dispatchWorkgroups(Math.ceil(numParticles/64))
    passEncoder.end()
  }
  {
    const passEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: context.getCurrentTexture().createView(), // Assigned later
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    })
    passEncoder.setPipeline(renderPipeline)
    passEncoder.setVertexBuffer(0,particleBuffers[(t+1)%2])
    passEncoder.setVertexBuffer(1,spriteVertexBuffer)
    passEncoder.draw(3,numParticles,0,0)
    passEncoder.end()
  }
  device.queue.submit([commandEncoder.finish()])

  t++
  requestAnimationFrame(frame)
}