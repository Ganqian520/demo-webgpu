export const vertWGSL = /* wgsl */`
  @group(0) @binding(0) var<uniform> mvpMatrix : mat4x4<f32>;
  @vertex
  fn main(@location(0) position : vec3<f32>) -> @builtin(position) vec4<f32> {
    return mvpMatrix*vec4<f32>(position, 1.0);
  }
`

export const fragWGSL = /* wgsl */`
  @group(0) @binding(1) var<storage> color : vec4<f32>;
  @fragment
  fn main() -> @location(0) vec4<f32> {
    return color;
  }
`

export const computeWGSL = /* wgsl */`
  struct Point {
    position: vec3<f32>,
    velocity: vec4<f32>,
    gravity: f32,
    birthTime: f32, //ms
  }
  const size = u32(1);
  @group(0) @binding(0) var<storage, read_write> color : vec4<f32>;
  @compute @workgroup_size(size)
  fn main(
    @builtin(global_invocation_id) globalInvocationID : vec3<u32>
  ) {
    var x = color.x;
    color.x = x;
  }
`