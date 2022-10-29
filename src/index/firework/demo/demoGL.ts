import {Mat4} from '../lib/math'

let canvas: HTMLCanvasElement
let gl: WebGLRenderingContext

canvas = document.createElement('canvas')
document.body.appendChild(canvas)
canvas.width = window.innerWidth
canvas.height = window.innerHeight
canvas.style.display = 'block'

gl = canvas.getContext("webgl");

const vsSource = `
    attribute vec4 aVertexPosition;

    // uniform mat4 uModelViewMatrix;
    // uniform mat4 uProjectionMatrix;

    void main() {
    // gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      gl_Position =  aVertexPosition;
    }
  `;

const fsSource = `
    void main() {
      gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    }
  `;

const vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, vsSource);
gl.compileShader(vertexShader);

const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, fsSource);
gl.compileShader(fragmentShader);

const shaderProgram = gl.createProgram();
gl.attachShader(shaderProgram, vertexShader);
gl.attachShader(shaderProgram, fragmentShader);

gl.linkProgram(shaderProgram);

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

const positions = [
    0,0,-1,
    0.5,-0.5,2,
    -0.5,-0.5,0,
];

gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(positions),gl.STATIC_DRAW);


gl.vertexAttribPointer(
    gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
    3,
    gl.FLOAT,
    false,
    0,
    0
);
gl.enableVertexAttribArray(gl.getAttribLocation(shaderProgram, 'aVertexPosition'));


gl.uniformMatrix4fv(
    gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
    false,
    new Float32Array(new Mat4().elements)
);
gl.uniformMatrix4fv(
    gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
    false,
    new Float32Array(new Mat4().elements)
);


gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.clearDepth(1.0);
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
gl.enable(gl.DEPTH_TEST);
gl.depthFunc(gl.LEQUAL);
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

gl.useProgram(shaderProgram);
gl.drawArrays(gl.LINE_LOOP,0,3);
