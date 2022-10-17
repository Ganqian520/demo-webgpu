import { Object3D } from "./Object3D";
import { Renderer } from "./Renderer";
import { cubeModel } from "./model";
import { Vec3 } from "./math";

export class ObjectGPU extends Object3D {

    isInstance: boolean
    instanceCount: number

    model: {
        data: number[],
        vertexCount: number,
    }

    vertexBuffer: GPUBuffer

    instanceModelsMatBuffer: GPUBuffer

    modelMatBuffer: GPUBuffer

    renderPL: GPURenderPipeline

    wgsl: {
        value: string,
        vertEntry?: string,
        fragEntry?: string,
    }

    bindGroup: GPUBindGroup

    bindingBuffers: Array<GPUBuffer | GPUSampler | GPUTextureView>

    constructor(params?: {
        paramsGPU?: {
            instanceCount?: number
            modelData?: Float32Array
            wgsl?: {
                value: string,
                vertEntry?: string,
                fragEntry?: string,
            },
            bindingBuffers?: GPUBuffer[]
        },
        paramsTransf?: {
            position?: { x: number, y: number, z: number }
            rotation?: { x: number, y: number, z: number }
            scale?: { x: number, y: number, z: number }
        }
    }) {
        const { paramsTransf, paramsGPU } = params
        super(paramsTransf)
        const { instanceCount, modelData, wgsl, bindingBuffers } = paramsGPU || {}
        this.bindingBuffers = bindingBuffers
        this.wgsl = wgsl
        this.instanceCount = instanceCount
        this.isInstance = typeof instanceCount === "number"
        this.model = cubeModel
        this.init()
        this.addEventListener('updateWorldMatrix', () => {
            this.isInstance || Renderer.device.queue.writeBuffer(this.modelMatBuffer, 0, new Float32Array(this.worldMatrix.elements))
        })
    }

    init() {
        this.initWGSL()
        this.initBuffer()
        this.initRenderPipeLine()
        this.initBindGroup()
        this.updateWorldMatrix()
    }

    frame(passEncoder: GPURenderPassEncoder) {
        passEncoder.setPipeline(this.renderPL)
        passEncoder.setVertexBuffer(0, this.vertexBuffer)
        passEncoder.setBindGroup(0, this.bindGroup)
        passEncoder.draw(this.model.vertexCount, this.instanceCount || 1)
    }

    private initRenderPipeLine(params?: {

    }) {
        this.renderPL = Renderer.device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: Renderer.device.createShaderModule({ code: this.wgsl.value }),
                entryPoint: this.wgsl.vertEntry,
                buffers: [{
                    arrayStride: (3 + 2) * Float32Array.BYTES_PER_ELEMENT,
                    attributes: [{
                        shaderLocation: 0,
                        offset: 0,
                        format: 'float32x3'
                    }, {
                        shaderLocation: 1,
                        offset: 3 * Float32Array.BYTES_PER_ELEMENT,
                        format: 'float32x2'
                    }]
                }]
            },
            fragment: {
                module: Renderer.device.createShaderModule({ code: this.wgsl.value }),
                entryPoint: this.wgsl.fragEntry,
                targets: [{ format: Renderer.format }]
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

    private initWGSL() {

        this.wgsl ??= {
            vertEntry: 'v_main',
            fragEntry: 'f_main',
            value: /* wgsl */`
                @group(0) @binding(0) var<uniform> vpMat: mat4x4<f32>;
                @group(0) @binding(1) ${this.isInstance ? 'var<storage,read> modelMats : array<mat4x4<f32>>' : 'var<uniform> modelMat : mat4x4<f32>'};

                struct Output {
                    @builtin(position) Position : vec4<f32>,
                    @location(0) fragUV : vec2<f32>,
                    @location(1) fragPosition: vec4<f32>,
                }

                @vertex
                fn v_main(
                    @builtin(instance_index) instanceIndex : u32,
                    @location(0) position : vec4<f32>,
                    @location(1) uv: vec2<f32>
                ) -> Output {
                    var output: Output;
                    output.Position = vpMat * ${this.isInstance ? 'modelMats[instanceIndex]' : 'modelMat'} * position;
                    output.fragUV = uv;
                    output.fragPosition = 0.5 * (position + vec4<f32>(1.0, 1.0, 1.0, 1.0));
                    return output;
                }

                @fragment
                fn f_main(
                    @location(0) fragUV: vec2<f32>,
                    @location(1) fragPosition: vec4<f32>
                ) -> @location(0) vec4<f32> {
                    return vec4<f32>(0,0,1,1);
                }
            `
        }

        this.wgsl.fragEntry ??= 'f_main'
        this.wgsl.vertEntry ??= 'v_main'
    }

    private initBindGroup() {
        const bindings = [{
            binding: 0,
            resource: {
                buffer: Renderer.vpMatBuffer
            }
        } as GPUBindGroupEntry, {
            binding: 1,
            resource: {
                buffer: this.isInstance ? this.instanceModelsMatBuffer : this.modelMatBuffer,
            }
        } as GPUBindGroupEntry]
        this.bindingBuffers?.forEach((buffer, i) => {
            let resource = buffer instanceof GPUBuffer
                ? {
                    buffer: buffer
                }
                : buffer
            bindings.push({
                binding: i + 2,
                resource,
            } as GPUBindGroupEntry)
        })
        this.bindGroup = Renderer.device.createBindGroup({
            layout: this.renderPL.getBindGroupLayout(0),
            entries: bindings,
        })
    }

    private initBuffer() {
        this.vertexBuffer = Renderer.device.createBuffer({
            size: this.model.data.length * Float32Array.BYTES_PER_ELEMENT,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
        })
        Renderer.device.queue.writeBuffer(this.vertexBuffer, 0, new Float32Array(this.model.data))
        if (this.isInstance) {
            this.instanceModelsMatBuffer = Renderer.device.createBuffer({
                size: this.instanceCount * 16 * Float32Array.BYTES_PER_ELEMENT,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
            })
        } else {
            this.modelMatBuffer = Renderer.device.createBuffer({
                size: 16 * Float32Array.BYTES_PER_ELEMENT,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
            })
        }
    }
}