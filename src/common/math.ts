import { mat4, quat, vec3, vec4 } from 'gl-matrix'


export function getPositionByGravity(positionInit: number[], time: number, vel: number[], speed: number, gravity = 10/1000_000) {
  gravity = 0
  let position = []
  let unit = Math.sqrt(speed ** 2 / (vel[0] ** 2 + vel[1] ** 2 + vel[2] ** 2))
  position[0] = unit * vel[0] * time
  position[1] = unit * vel[1] * time - 0.5 * gravity * time ** 2
  position[2] = unit * vel[2] * time
  return position
}

export function random(min = 0, max = 1, isInt = true) {
  return isInt ? Math.floor(Math.random() * (max - min) + min) : Math.random() * (max - min) + min
}

export function getNow() {
  return Date.now() % 1000000
}

// return mvp matrix from given aspect, position, rotation, scale
function getMvpMatrix(
  aspect: number,
  position: { x: number, y: number, z: number },
  rotation: { x: number, y: number, z: number },
  scale: { x: number, y: number, z: number }
) {
  // get modelView Matrix
  const modelViewMatrix = getModelViewMatrix(position, rotation, scale)
  // get projection Matrix
  const projectionMatrix = getProjectionMatrix(aspect)
  // get mvp matrix
  const mvpMatrix = mat4.create()
  mat4.multiply(mvpMatrix, projectionMatrix, modelViewMatrix)

  // return matrix as Float32Array
  return mvpMatrix as Float32Array
}

// return modelView matrix from given position, rotation, scale
function getModelViewMatrix(
  position = { x: 0, y: 0, z: 0 },
  rotation = { x: 0, y: 0, z: 0 },
  scale = { x: 1, y: 1, z: 1 }
) {
  // get modelView Matrix
  const modelViewMatrix = mat4.create()
  // translate position
  mat4.translate(modelViewMatrix, modelViewMatrix, vec3.fromValues(position.x, position.y, position.z))
  // rotate
  mat4.rotateX(modelViewMatrix, modelViewMatrix, rotation.x)
  mat4.rotateY(modelViewMatrix, modelViewMatrix, rotation.y)
  mat4.rotateZ(modelViewMatrix, modelViewMatrix, rotation.z)
  // scale
  // mat4.scale(modelViewMatrix, modelViewMatrix, vec3.fromValues(scale.x, scale.y, scale.z))

  // return matrix as Float32Array
  // console.log('m',modelViewMatrix);
  return modelViewMatrix as Float32Array
}

const center = vec3.fromValues(0, 0, 0)
const up = vec3.fromValues(0, 1, 0)

function getProjectionMatrix(
  aspect: number,
  fov: number = 60 / 180 * Math.PI,
  near: number = 0.1,
  far: number = 100.0,
  position = { x: 0, y: 0, z: 0 },
  rotation?: any
) {
  // create cameraview
  const cameraView = mat4.create()
  const eye = vec3.fromValues(position.x, position.y, position.z)
  mat4.translate(cameraView, cameraView, eye)
  if (rotation) {
    // mat4.rotateY(cameraView, cameraView, rotation.y)
  }
  mat4.lookAt(cameraView, eye, center, up)
  // get a perspective Matrix
  // console.log('v',cameraView);
  const projectionMatrix = mat4.create()
  mat4.perspective(projectionMatrix, fov, aspect, near, far)
  // console.log('p', projectionMatrix);
  mat4.multiply(projectionMatrix, projectionMatrix, cameraView)
  // return matrix as Float32Array
  return projectionMatrix as Float32Array
}

export { getMvpMatrix, getModelViewMatrix, getProjectionMatrix }
