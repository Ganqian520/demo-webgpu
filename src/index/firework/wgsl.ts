
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
  // struct Point {
  //   position: vec3<f32>,
  //   velocity: vec4<f32>,
  //   gravity: f32,
  //   birth: f32, //ms
  // }
  // struct Points {
  //   data: array<Point>,
  // }
  struct Point {
    posX: f32,
    posY: f32,
    posZ: f32,
    velX: f32,
    velY: f32,
    velZ: f32,
    velW: f32,
    gravity: f32,
    birthTime: f32, //ms
  }
  struct Params {
    currentTime: f32,
  }

  const size = u32(128);

  @group(0) @binding(0) var<uniform> params: Params;
  @group(0) @binding(1) var<storage, read_write> points: array<Point>;
  // @group(0) @binding(1) var<storage, read_write> points: array<array<f32,9>>;
  @group(0) @binding(2) var<storage, read_write> models: array<mat4x4<f32>>;
  @group(0) @binding(3) var<storage, read_write> mvps: array<mat4x4<f32>>;
  @group(0) @binding(4) var<uniform> projection: mat4x4<f32>;
  @group(0) @binding(5) var<storage, read_write> logs: array<f32>;
  @compute @workgroup_size(size)
  fn main(
    @builtin(global_invocation_id) globalInvocationID : vec3<u32>
  ) {
    var index: u32 = globalInvocationID.x;
    // if(index >= arrayLength(&points)) {
    //   return ;
    // }
    var debug = true;
    var a = logs[index];
    var currentTime = params.currentTime;
    var mvp = mvps[index];
    var point = points[index];
    var gravity = point.gravity;
    var birthTime = point.birthTime;
    
    point.posX += point.velX*point.velW;
    point.posY += point.velY*point.velW;
    point.posZ += point.velZ*point.velW;

    if(debug){
      logs[index*u32(9)+0] = point.posX;
    }
    points[index] = point;
    models[index][3] = vec4<f32>(point.posX,point.posY,point.posZ,1);
    mvps[index] = projection * models[index];

  }
`