import { initWebGPU } from "@/common/util";
import { cubeVertex, cubeVertexCount } from '@/common/geometry/cube'
import { getMvpMatrix } from '@/common/math'

start()

async function start() {
  const { device, context, format,size } = await initWebGPU()
  const pipelineObj = await initPipeline(device,format,size)

  const aspect = size.width/size.height
  const position = {x:0,y:0,z:-5}
  const scale = {x:1,y:1,z:1}
  const rotation = {x:0,y:0,z:0}
  frame()
  function frame() {
    const now = Date.now() / 1000
    rotation.x = Math.sin(now)
    rotation.y = Math.cos(now)
    const mvpMatrix = getMvpMatrix(aspect,position,rotation,scale)
    device.queue.writeBuffer(pipelineObj.mvpBuffer,0,mvpMatrix.buffer)
    draw(device,context,pipelineObj)
    window.requestAnimationFrame(frame)
  }
}

async function initPipeline(device:GPUDevice,format:GPUTextureFormat,size: {width:number,height:number}) {
  const pipeline = await device.createRenderPipelineAsync({
    label: 'Basic Pipeline',
    layout: 'auto',
    vertex: {
      module: device.createShaderModule({
        code: vertextShader,

      }),
      entryPoint: 'main',
      buffers: [{
        arrayStride: (3+2)*4,
        attributes: [
          {
            shaderLocation: 0,
            offset: 0,
            format: 'float32x3'
          },
          {
            shaderLocation: 1,
            offset: 3*4,
            format:'float32x2',
          }
        ]
      }]
    },
    fragment: {
      module: device.createShaderModule({
        code: fragmentShder
      }),
      entryPoint: 'main',
      targets: [{format}]
    },
    primitive: {
      topology: 'triangle-list',
      cullMode: 'back', //背面剔除
      frontFace: 'ccw'
    },
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: 'less', //深度剔除
      format: 'depth24plus',
    }
  })

  const depthTexture = device.createTexture({
    size,format: 'depth24plus',usage: GPUTextureUsage.RENDER_ATTACHMENT
  })
  const depthView = depthTexture.createView()

  const vertexBuffer = device.createBuffer({
    label: 'GPUBuffer store vertex',
    size: cubeVertex.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
  })
  device.queue.writeBuffer(vertexBuffer,0,cubeVertex)

  const mvpBuffer = device.createBuffer({
    label: "GPUBuffer store 4x4 matrix",
    size: 4*4*4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  })
  const uniformGroup = device.createBindGroup({
    label: 'Uniform Group with matrix',
    layout: pipeline.getBindGroupLayout(0),
    entries: [{
      binding: 0,
      resource: {
        buffer: mvpBuffer,
      }
    }]
  })

  return {pipeline,vertexBuffer,mvpBuffer,uniformGroup,depthTexture,depthView}
}

function draw(
  device: GPUDevice,
  context: GPUCanvasContext,
  pipelineObj: {
    pipeline: GPURenderPipeline,
    vertexBuffer: GPUBuffer,
    mvpBuffer: GPUBuffer,
    uniformGroup: GPUBindGroup,
    depthView: GPUTextureView,
  }
) {
  const commandEncoder = device.createCommandEncoder()
  const passEncoder = commandEncoder.beginRenderPass({
    colorAttachments: [{
      view: context.getCurrentTexture().createView(),
      clearValue: {r:0,g:0,b:0,a:1.0},
      loadOp: 'clear',
      storeOp: 'store'
    }],
    depthStencilAttachment: {
      view: pipelineObj.depthView,
      depthClearValue: 1.0,
      depthLoadOp: 'clear',
      depthStoreOp: 'store'
    }
  })
  passEncoder.setPipeline(pipelineObj.pipeline)
  passEncoder.setVertexBuffer(0,pipelineObj.vertexBuffer)
  passEncoder.setBindGroup(0,pipelineObj.uniformGroup)
  passEncoder.draw(cubeVertexCount)
  passEncoder.end()
  device.queue.submit([commandEncoder.finish()])
}

const vertextShader = /* wgsl */`
  @binding(0) @group(0) var<uniform> mvpMatrix : mat4x4<f32>;

  struct VertexOutput {
      @builtin(position) position : vec4<f32>,
      @location(0) fragUV : vec2<f32>,
      @location(1) fragPosition: vec4<f32>
  };

  @vertex
  fn main(
      @location(0) position : vec4<f32>,
      @location(1) uv : vec2<f32>
  ) -> VertexOutput {
      var output : VertexOutput;
      var a = mvpMatrix;
      output.position = position;
      output.fragUV = uv;
      output.fragPosition = 0.5 * (position + vec4<f32>(1.0, 1.0, 1.0, 1.0));
      return output;
  }
`
const fragmentShder = /* wgsl */`
  @fragment
  fn main(
      @location(0) fragUV: vec2<f32>,
      @location(1) fragPosition: vec4<f32>
  ) -> @location(0) vec4<f32> {
    return fragPosition;
  }
`
