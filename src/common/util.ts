
export async function initWebGPU() {
  if (!navigator.gpu)
    throw new Error('Not Support WebGPU')
  const adapter = await navigator.gpu.requestAdapter({
    powerPreference: 'high-performance'
  })
  if (!adapter)
    throw new Error('No Adapter Found')
  const canvas = document.querySelector('canvas') as HTMLCanvasElement
  const device: GPUDevice = await adapter.requestDevice()
  const context: GPUCanvasContext = canvas.getContext('webgpu') as GPUCanvasContext
  const format: GPUTextureFormat = navigator.gpu.getPreferredCanvasFormat ? navigator.gpu.getPreferredCanvasFormat() : context.getPreferredFormat(adapter)
  const devicePixelRatio = window.devicePixelRatio || 1
  canvas.width = canvas.clientWidth * devicePixelRatio
  canvas.height = canvas.clientHeight * devicePixelRatio
  const size = { width: canvas.width, height: canvas.height }
  context.configure({
    device, format,
    alphaMode: 'opaque'
  })
  return { device, context, format, size }
}
