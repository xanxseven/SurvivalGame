import { GL_ARRAY_BUFFER, GL_COLOR_BUFFER_BIT, GL_COMPILE_STATUS, GL_FLOAT, GL_FRAGMENT_SHADER, GL_STATIC_DRAW, GL_TRIANGLES, GL_VERTEX_SHADER } from "./glConstants";

const vertexShader = `#version 300 es
 
// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec4 a_position;
 
// all shaders have a main function
void main() {
 
  // gl_Position is a special variable a vertex shader
  // is responsible for setting
  gl_Position = a_position;
}`;

const fragShader = `#version 300 es
 
// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;
 
// we need to declare an output for the fragment shader
out vec4 outColor;
 
void main() {
  // Just set the output to a constant reddish-purple
  outColor = vec4(1, 0, 0.5, 1);
}`;

export class nRenderer {
  canvas: HTMLCanvasElement;
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  fragShader: WebGLShader;
  vertexShader: WebGLShader;
  vao: WebGLVertexArrayObject;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.gl = this.canvas.getContext("webgl2") as WebGL2RenderingContext;

    this.fragShader = this.createShader(fragShader, GL_FRAGMENT_SHADER)
    this.vertexShader = this.createShader(vertexShader, GL_VERTEX_SHADER);
    this.program = this.createProgram();

    const positionAttributeLocation = this.gl.getAttribLocation(this.program, "a_position");
    const positionBuffer = this.createBuffer(
      GL_ARRAY_BUFFER,
      new Float32Array([
        0, 0,
        0, 0.5,
        0.7, 0,
      ]),
      GL_STATIC_DRAW
    )

    this.vao = this.gl.createVertexArray() as WebGLVertexArrayObject;
    this.gl.bindVertexArray(this.vao);

    this.gl.enableVertexAttribArray(positionAttributeLocation)

    const size = 2;
    const type = GL_FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    this.gl.vertexAttribPointer(
      positionAttributeLocation, size, type, normalize, stride, offset);
  }

  render(){
    this.clear();
    this.gl.useProgram(this.program);
    this.gl.bindVertexArray(this.vao);

    const primmitiveType = GL_TRIANGLES;
    const offset = 0;
    const count = 3;
    this.gl.drawArrays(primmitiveType, offset, count);
  }

  createBuffer(type: number, src: any, usage: number) {
    const gl = this.gl;
    const buffer = gl.createBuffer() as WebGLBuffer;
    gl.bindBuffer(type, buffer);
    gl.bufferData(type, src, usage);
    return buffer;
  }

  resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  clearColor(r: number, g: number, b: number, a = 1){
    this.gl.clearColor(r, g, b, a);
  } 

  clear(){
    this.gl.clear(GL_COLOR_BUFFER_BIT);
  }

  createShader(source: string, type: number) {
    const gl = this.gl;
    const shader = gl.createShader(type) as WebGLShader;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    const success = gl.getShaderParameter(shader, GL_COMPILE_STATUS);
    if (success) return shader;

    throw "" + gl.getShaderInfoLog(shader);
  }

  createProgram() {
    const gl = this.gl;
    const program = gl.createProgram() as WebGLProgram;
    gl.attachShader(program, this.vertexShader);
    gl.attachShader(program, this.fragShader);
    gl.linkProgram(program);

    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) return program;

    throw '' + gl.getProgramInfoLog(program);
  }
}