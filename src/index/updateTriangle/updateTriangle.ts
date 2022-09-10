import { initWebGPU } from "@/common/util";

const fragmentShder =  /* wgsl */`
  @group(0) @binding(0) var<uniform> color : vec4<f32>;
  @fragment
  fn main() -> @location(0) vec4<f32> {
    return color;
  }
`
const vertextShader = /* wgsl */`
  @vertex
  fn main(@location(0) position: vec3<f32>) -> @builtin(position) vec4<f32> {
      return vec4<f32>(position, 1.0);
  }
`
start()

async function start() {
  const { device, context, format } = await initWebGPU()
  const { pipeline, vertexObj, colorObj } = await initPipeline(device, format)
  draw(device, context, pipeline,vertexObj,colorObj)

  document.getElementById('domX').oninput =( e:any)=> {
    let value = e.target.valueAsNumber
    vertexObj.vertex[0] = 0+value
    vertexObj.vertex[3] = -0.5+value
    vertexObj.vertex[6] = 0.5+value
    device.queue.writeBuffer(vertexObj.vertexBuffer,0,vertexObj.vertex)
    draw(device, context, pipeline,vertexObj,colorObj)
  }
  document.getElementById('domColor').oninput = (e:any) => {
    const color = e.target.value
    let r = +('0x'+color.slice(1,3)) / 255
    let g = +('0x'+color.slice(3,5)) / 255
    let b = +('0x'+color.slice(5,7)) / 255
    device.queue.writeBuffer(colorObj.colorBuffer,0,new Float32Array([r,g,b,1]))
    draw(device, context, pipeline,vertexObj,colorObj)
  }
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
  device.queue.writeBuffer(vertexBuffer, 0 * 4, vertex)

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
        code: vertextShader
      }),
      entryPoint: 'main',
      buffers: [{
        arrayStride: 3 * 4, //拆分每3个数据作为一个顶点传入buffer
        attributes: [{  //每个拆分如何传递给buffer
          shaderLocation: 0,  //传递给@location(0)变量
          offset: 0,
          format: 'float32x3'
        }]
      }]
    },
    fragment: {
      module: device.createShaderModule({
        code: fragmentShder,
      }),
      entryPoint: 'main',
      targets: [{ format }]
    }
  })

  const group = device.createBindGroup({ //资源绑定，将buffer进行组合
    layout: pipeline.getBindGroupLayout(0), //
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
  passEncoder.setVertexBuffer(0,vertextObj.vertexBuffer)
  passEncoder.setBindGroup(0,colorObj.group)
  passEncoder.draw(3)
  passEncoder.end()
  device.queue.submit([commandEncoder.finish()])
}