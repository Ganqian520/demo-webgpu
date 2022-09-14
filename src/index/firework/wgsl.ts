
export const vertWGSL = /* wgsl */`
  @group(0) @binding(0) var<storage,read> mvps : array<mat4x4<f32>>;
  @vertex
  fn main(
    @builtin(instance_index) index : u32,
    @location(0) position : vec3<f32>
  ) -> @builtin(position) vec4<f32> {
    return mvps[index] * vec4<f32>(position, 1.0);
  }
`

export const fragWGSL = /* wgsl */`
  @group(0) @binding(1) var<uniform> color : vec4<f32>;
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

  struct Params {
    currentTime: f32,
  }

  const size = u32(1);

  @group(0) @binding(0) var<uniform> params: Params;
  @group(0) @binding(1) var<storage, read_write> points: array<Point>;
  @group(0) @binding(2) var<storage, read_write> models: array<mat4x4<f32>>;
  @group(0) @binding(3) var<storage, read_write> mvps: array<mat4x4<f32>>;
  @group(0) @binding(4) var<uniform> projection: mat4x4<f32>;
  @group(0) @binding(5) var<storage, read_write> logs: array<f32>;
  @compute @workgroup_size(size)
  fn main(
    @builtin(global_invocation_id) globalInvocationID : vec3<u32>
  ) {
    var index = globalInvocationID.x;
    var a = logs[index];
    var currentTime = params.currentTime;
    var point = points[index];
    var mvp = mvps[index];
    var gravity = point.gravity;
    var birthTime = point.birthTime;
    var velocity = point.velocity;
    var position = models[index][3];
    // position.x += velocity.x * velocity.w;
    // position.y += velocity.y * velocity.w;
    // position.z += velocity.z * velocity.w;
    // var d = 1.0;
    // position.x = velocity.x * d;
    logs[0] = velocity.x;
    logs[1] = velocity.y;
    logs[2] = velocity.z;
    logs[3] = velocity.w;
    logs[4] = 666;
    // position.y += velocity.y * d;
    // position.z += velocity.z * d;
    // models[index][3] = position;
    mvps[index] = projection * models[index];
  }
`