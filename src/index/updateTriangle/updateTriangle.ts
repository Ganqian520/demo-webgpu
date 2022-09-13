import { initWebGPU } from "@/common/util";
import * as dat from 'dat.gui'

start()

async function start() {
  const { device, context, format } = await initWebGPU()
  const { pipeline, vertexObj, colorObj } = await initPipeline(device, format)
  draw(device, context, pipeline,vertexObj,colorObj)

  const guiObj= {
    color: [255,0,0],
    x:0
  }
  const gui = new dat.GUI()
  gui.add(guiObj,'x',-0.5,0.5,0.01).onChange(value=>{
    vertexObj.vertex[0] = 0+value
    vertexObj.vertex[3] = -0.5+value
    vertexObj.vertex[6] = 0.5+value
    device.queue.writeBuffer(vertexObj.vertexBuffer,0,vertexObj.vertex)
    draw(device, context, pipeline,vertexObj,colorObj)
  })
  gui.addColor(guiObj,'color').onChange(e=>{
    device.queue.writeBuffer(colorObj.colorBuffer,0,new Float32Array([e[0]/255,e[1]/255,e[2]/255,1]))
    draw(device, context, pipeline,vertexObj,colorObj)
  })
}

async function initPipeline(device: GPUDevice, format: GPUTextureFormat) {
  const vertex = new Float32Array([
    0, 0.5, 0,
    -0.5, -0.5, 0,
    0.5, -0.5, 0
  ])
  const vertexBuffer = device.createBuffer({ //在gpu中开辟内存
    size: vertex.byteLength,//9*4，一个32位浮点数占4字节
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  })
  device.queue.writeBuffer(vertexBuffer, 0, vertex)

  const color = new Float32Array([1,0,0,1])
  const colorBuffer = device.createBuffer({
    size: color.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST, //两种通用buffer:uniform/storege
  })
  device.queue.writeBuffer(colorBuffer,0,color) 

  const pipeline = await device.createRenderPipelineAsync({
    layout: 'auto',
    vertex: {
      module: device.createShaderModule({
        code: /* wgsl */`
          @vertex
          fn main(@location(0) position: vec3<f32>) -> @builtin(position) vec4<f32> {
              return vec4<f32>(position, 1.0);
          }
        `
      }),
      entryPoint: 'main',
      buffers: [{
        arrayStride: 3 * 4, //一次处理一个顶点，按每3个数据即12个字节分割buffer
        attributes: [{  //每个拆分如何传递给buffer
          shaderLocation: 0,  //对应shader的@location(0)参数
          offset: 0,
          format: 'float32x3'
        }]
      }]
    },
    fragment: {
      module: device.createShaderModule({
        code: /* wgsl */`
          @group(0) @binding(0) var<uniform> color : vec4<f32>;
          @fragment
          fn main() -> @location(0) vec4<f32> {
            return color;
          }
        `,
      }),
      entryPoint: 'main',
      targets: [{ format }]
    }
  })

  const group = device.createBindGroup({ //资源绑定，将buffer进行组合
    layout: pipeline.getBindGroupLayout(0), 
    entries: [{
      binding: 0,
      resource: {
        buffer: colorBuffer
      }
    }]
  })

  const vertexObj = { vertex, vertexBuffer, vertexCount: 3 }
  const colorObj = { color, colorBuffer, group}
  return { pipeline, vertexObj, colorObj }
}

function draw(device: GPUDevice, context: GPUCanvasContext, pipeline: GPURenderPipeline,vertextObj:any,colorObj:any) {
  const commandEncoder = device.createCommandEncoder()
  const passEncoder = commandEncoder.beginRenderPass({
    colorAttachments: [{
      view: context.getCurrentTexture().createView(),
      clearValue: { r: 0, g: 0, b: 0, a: 0 },
      loadOp: 'clear',
      storeOp: 'store',
    }]
  })
  passEncoder.setPipeline(pipeline)
  passEncoder.setVertexBuffer(0,vertextObj.vertexBuffer) //0代表pipeline=>vertext->buffers内的序号
  passEncoder.setBindGroup(0,colorObj.group)
  passEncoder.draw(3) //传入顶点数量，一个顶点开一个线程并行计算
  passEncoder.end()
  device.queue.submit([commandEncoder.finish()])
}
