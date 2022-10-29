import { ObjectGPU } from "./ObjectGPU";


export class AxesHelper extends ObjectGPU {

    constructor(size=5){
        super({
            paramsTransf: {
                scale: {x:size,y:size,z:size}
            },
            paramsGPU: {
                model: {
                    data: [
                        0, 0, 0, 1, 0, 0,
                        1, 0, 0, 1, 0, 0,
                        0, 0, 0, 0, 1, 0,
                        0, 1, 0, 0, 1, 0,
                        0, 0, 0, 0, 0, 1,
                        0, 0, 1, 0, 0, 1,
                    ],
                    vertexCount: 6,
                    arrayStride: [3, 3]
                },
                topology: 'line-list',
                wgsl: {
                    value: /* wgsl */`
                        @group(0) @binding(0) var<uniform> vpMat: mat4x4<f32>;
                        @group(0) @binding(1) var<uniform> modelMat : mat4x4<f32>;

                        struct Output {
                            @builtin(position) Position : vec4<f32>,
                            @location(0) fragColor : vec4<f32>,
                            @location(1) fragPosition: vec4<f32>,
                        }

                        @vertex
                        fn v_main(
                            @location(0) position : vec4<f32>,
                            @location(1) color: vec4<f32>
                        ) -> Output {
                            var output: Output;
                            output.Position = vpMat * modelMat * position;
                            output.fragColor = color;
                            return output;
                        }

                        @fragment
                        fn f_main(
                            @location(0) fragColor: vec4<f32>,
                            @location(1) fragPosition: vec4<f32>,
                        ) -> @location(0) vec4<f32> {
                            return fragColor;
                        }
                    `
                }
            }
        })
    }
}