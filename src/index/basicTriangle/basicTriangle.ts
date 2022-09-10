import triangleVert from './vert.wgsl?raw'
import redFrag from './frag.wgsl?raw'
import { initWebGPU } from '@/common/util'

async function initPipeline(device: GPUDevice, format: GPUTextureFormat): Promise<GPURenderPipeline> {
  const vertextShader: GPUShaderModule = device.createShaderModule({ //将输入字符串编译为gpu认识的可执行函数
    code: triangleVert
  })
  const fragmentShder: GPUShaderModule = device.createShaderModule({
    code: redFrag
  })
  const pipline: GPURenderPipeline = await device.createRenderPipelineAsync({
    layout: 'auto',
    vertex: {
      module: vertextShader,
      entryPoint: 'main'
    },
    primitive: {
      topology: 'triangle-list' // try point-list, line-list, line-strip, triangle-strip?
    },
    fragment: {
      module: fragmentShder,
      entryPoint: 'main',
      targets: [
        {
          format: format
        }
      ]
    }
  })
  return pipline
}
function draw(device: GPUDevice, context: GPUCanvasContext, pipeline: GPURenderPipeline) {
  const commandEncoder: GPUCommandEncoder = device.createCommandEncoder()
  const view: GPUTextureView = context.getCurrentTexture().createView()
  const passEncoder: GPURenderPassEncoder = commandEncoder.beginRenderPass({
    colorAttachments: [
      {
        view: view,
        clearValue: { r: 0, g: 0, b: 0, a: 1.0 },
        loadOp: 'clear', // clear/load
        storeOp: 'store' // store/discard
      }
    ]
  })
  passEncoder.setPipeline(pipeline)
  passEncoder.draw(3)
  passEncoder.end()
  const buffer: GPUCommandBuffer = commandEncoder.finish()
  device.queue.submit([buffer])
}

async function run() {
  const { device, context, format } = await initWebGPU()
  const pipeline = await initPipeline(device, format)

  draw(device, context, pipeline)

  // window.addEventListener('resize', () => {
  //   canvas.width = canvas.clientWidth * devicePixelRatio
  //   canvas.height = canvas.clientHeight * devicePixelRatio
  //   draw(device, context, pipeline)
  // })
}

run()