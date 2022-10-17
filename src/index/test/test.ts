import * as dat from 'dat.gui'

import { initWebGPU } from "@/common/util";
import { random, getProjectionMatrix, getModelViewMatrix } from "@/common/math";

function frame() {

    const commandEncoder = device.createCommandEncoder()

    const colorAttachments: Iterable<GPURenderPassColorAttachment> = [{
        view: context.getCurrentTexture().createView(),
        clearValue: { r: 0, g: 0, b: 0, a: 1.0 },
        loadOp: 'clear',
        storeOp: 'store'
    }]

    const passEncoder = commandEncoder.beginRenderPass({ colorAttachments })
    passEncoder.setPipeline(pipeline1)
    passEncoder.setVertexBuffer(0, buffer1)
    passEncoder.draw(3)
    passEncoder.end()

    device.queue.submit([commandEncoder.finish()])

    requestAnimationFrame(frame)
}

const { device, context, format, size, canvas } = await initWebGPU()

const buffer1Size = 1000 * Float32Array.BYTES_PER_ELEMENT
const buffer1 = device.createBuffer({
    size: buffer1Size,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.VERTEX
})

const data = new Float32Array([
    0, 1, 0,
    -1, -1, 0,
    1, -1, 0
])

device.queue.writeBuffer(buffer1, 0, data)

const shaderWgsl = /* wgsl */`
    @vertex
    fn v_main(
        @builtin(vertex_index) index: u32,
        @location(0) position: vec3<f32>,
    ) -> @builtin(position) vec4<f32> {
        // return vec4<f32>(position, 1);
        var arr = array<vec3<f32>, 3>(
            vec3<f32>(0.0, 1, -1),
            vec3<f32>(-1, -1, 1),
            vec3<f32>(1, -1, 1)
        );
        return vec4<f32>(arr[index],1);
    } 

    @fragment
    fn f_main(
        @builtin(position) position: vec4<f32>
    ) -> @location(0) vec4<f32> {
        // return vec4<f32>(1.0, 0.0, 0.0, 1.0);
        return position;
    }
`

const pipeline1 = await device.createRenderPipelineAsync({
    layout: 'auto',
    vertex: {
        module: device.createShaderModule({
            code: shaderWgsl
        }),
        entryPoint: 'v_main',
        buffers: [
            {
                arrayStride: 3 * Float32Array.BYTES_PER_ELEMENT,
                attributes: [
                    {
                        shaderLocation: 0,
                        offset: 0,
                        format: 'float32x3'
                    }
                ]
            }
        ]
    },
    fragment: {
        module: device.createShaderModule({
            code: shaderWgsl,
        }),
        entryPoint: 'f_main',
        targets: [{ format }]
    },
    // primitive: {
    //     topology: 'triangle-list',
    //     cullMode: 'back', //背面剔除
    //     frontFace: 'ccw'
    // },
    // depthStencil: {
    //     depthWriteEnabled: true,
    //     depthCompare: 'less', //深度剔除
    //     format: 'depth24plus',
    // }
})

const depthTexture = device.createTexture({
    size, format: 'depth24plus', usage: GPUTextureUsage.RENDER_ATTACHMENT
})
const depthView = depthTexture.createView()
const depthStencilAttachment: GPURenderPassDepthStencilAttachment = {
    view: depthView,
    depthClearValue: 1.0,
    depthLoadOp: 'clear',
    depthStoreOp: 'store'
}

frame()
