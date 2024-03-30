const shaderVertexSource = `#version 300 es
precision mediump float;

uniform vec2 uPosition;
uniform float uSize;

void main() {
    gl_Position = vec4(uPosition, 0.0, 1.0);
    gl_PointSize = uSize;
}
`

const shaderFragmentSource = `#version 300 es
precision mediump float;

uniform vec4 uColor[3];
uniform int uIndex;
out vec4 FragColor;
void main() {
    FragColor = uColor[uIndex];
}
`

const canvas = document.querySelector('#demo-canvas') as HTMLCanvasElement
const gl = canvas.getContext("webgl2")

const vertexShader = gl?.createShader(gl.VERTEX_SHADER) as WebGLShader
gl?.shaderSource(vertexShader, shaderVertexSource)
gl?.compileShader(vertexShader)

const fragmentShader = gl?.createShader(gl.FRAGMENT_SHADER) as WebGLShader
gl?.shaderSource(fragmentShader, shaderFragmentSource)
gl?.compileShader(fragmentShader)

const program = gl?.createProgram() as WebGLProgram
gl?.attachShader(program,vertexShader)
gl?.attachShader(program,fragmentShader)
gl?.linkProgram(program)

gl?.useProgram(program)

if(!gl?.getProgramParameter(program, gl.LINK_STATUS)){
    console.error(gl?.getShaderInfoLog(vertexShader))
    console.error(gl?.getShaderInfoLog(fragmentShader))
}




const uPositionLoc = gl?.getUniformLocation(program,'uPosition') as WebGLUniformLocation 
gl?.uniform2f(uPositionLoc,-0.5,0.5)

const uSizeLoc = gl?.getUniformLocation(program,'uSize') as WebGLUniformLocation 
gl?.uniform1f(uSizeLoc,100.0)

const uColorLoc = gl?.getUniformLocation(program,'uColor') as WebGLUniformLocation 
gl?.uniform4fv(uColorLoc,new Float32Array([
    1.0,0.0,0.0,1.0,
    0.0,1.0,0.0,1.0,
    0.0,0.0,1.0,1.0
]))

const uIndexLoc = gl?.getUniformLocation(program,'uIndex') as WebGLUniformLocation 
gl?.uniform1i(uIndexLoc,0)



gl?.drawArrays(gl.POINTS, 0, 1)


