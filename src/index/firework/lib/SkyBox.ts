import { ObjectGPU } from "./ObjectGPU";
import { Renderer } from "./Renderer";

export class SkyBox extends ObjectGPU {

    constructor(params?: {
        size?: number,
        imgs?: string[]
    }) {
        let { size, imgs } = params || {}
        size ??= 10000
        super({
            paramsTransf: { scale: { x: size, y: size, z: size } },
            paramsGPU: {isReady:false,cullmode: 'front'}
        })

        initCubemapTextureAsync().then((texture: GPUTexture) => {
            let sampler = Renderer.device.createSampler({
                magFilter: 'linear',
                minFilter: 'linear'
            })
            this.bindingBuffers = [sampler, texture.createView({ dimension: 'cube', })]
            this.wgsl = {
                value: /* wgsl */`
                        @group(0) @binding(0) var<uniform> vpMat: mat4x4<f32>;
                        @group(0) @binding(1) var<uniform> modelMat : mat4x4<f32>;
                        @group(0) @binding(2) var mySampler: sampler;
                        @group(0) @binding(3) var myTexture: texture_cube<f32>;

                        struct VertexOutput {
                            @builtin(position) Position : vec4<f32>,
                            @location(0) fragUV : vec2<f32>,
                            @location(1) fragPosition: vec4<f32>,
                        }

                        @vertex
                        fn v_main(
                            @location(0) position : vec4<f32>,
                            @location(1) uv: vec2<f32>
                        ) -> VertexOutput {
                            var output: VertexOutput;
                            output.Position = vpMat * modelMat * position;
                            output.fragUV = uv;
                            // output.fragPosition = 0.5 * (position + vec4<f32>(1.0, 1.0, 1.0, 1.0));
                            output.fragPosition = position;
                            return output;
                        }

                        @fragment
                        fn f_main(
                            @location(0) fragUV: vec2<f32>,
                            @location(1) fragPosition: vec4<f32>
                        ) -> @location(0) vec4<f32> {
                            var cubemapVec = fragPosition.xyz - vec3<f32>(0.5, 0.5, 0.5);
                            // return textureSample(myTexture, mySampler, cubemapVec);
                            return textureSample(myTexture, mySampler, fragPosition.xyz);
                        }
                    `,
            }
            this.isReady = true
            this.init()
        })
        async function initCubemapTextureAsync() {
            let promises = imgs.map((src: string) => {
                let img = document.createElement('img');
                img.src = src;
                return img.decode().then(() => window.createImageBitmap(img))
            })
            let imageBitmaps = await Promise.all(promises)
            let cubemapTexture = Renderer.device.createTexture({
                dimension: '2d',
                size: [imageBitmaps[0].width, imageBitmaps[0].height, 6],
                format: 'rgba8unorm',
                usage:
                    GPUTextureUsage.TEXTURE_BINDING |
                    GPUTextureUsage.COPY_DST |
                    GPUTextureUsage.RENDER_ATTACHMENT,
            });

            for (let i = 0; i < imageBitmaps.length; i++) {
                const imageBitmap = imageBitmaps[i];
                Renderer.device.queue.copyExternalImageToTexture(
                    { source: imageBitmap },
                    { texture: cubemapTexture, origin: [0, 0, i] },
                    [imageBitmap.width, imageBitmap.height]
                );
            }

            return cubemapTexture
        }
    }
}