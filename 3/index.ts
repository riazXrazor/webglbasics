const shaderVertexSource = `#version 300 es
precision mediump float;

in vec2 aPosition;
in float aPointSize;
in vec3 aColor;

out vec3 vColor;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
    gl_PointSize = aPointSize;
    vColor = aColor;
}
`

const shaderFragmentSource = `#version 300 es
precision mediump float;

out vec4 FragColor;
in vec3 vColor;

void main() {
    FragColor = vec4(vColor, 1.0);
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
    console.error('vertexShader',gl?.getShaderInfoLog(vertexShader))
    console.error('fragmentShader',gl?.getShaderInfoLog(fragmentShader))
}


const bufferData = new Float32Array([
    0,0.80,    50.0,      1.0,0.0,0.0,
    -0.80,-0.80,   50.0,       0.0,1.0,0.0,
    0.80,-0.80,   50.0,      0.0,0.0,1.0
]);

const aPositionLoc = gl?.getAttribLocation(program,'aPosition') as number 
const aPointSizeLoc = gl?.getAttribLocation(program,'aPointSize') as  number
const aColorLoc = gl?.getAttribLocation(program,'aColor') as  number

gl?.enableVertexAttribArray(aPointSizeLoc)  
gl?.enableVertexAttribArray(aPositionLoc)
gl?.enableVertexAttribArray(aColorLoc)

const buffer = gl?.createBuffer() as WebGLBuffer
gl?.bindBuffer(gl.ARRAY_BUFFER,buffer)
gl?.bufferData(gl.ARRAY_BUFFER,bufferData,gl.STATIC_DRAW)


gl?.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, 6 * Float32Array.BYTES_PER_ELEMENT, 0)
gl?.vertexAttribPointer(aPointSizeLoc, 1, gl.FLOAT, false, 6 * Float32Array.BYTES_PER_ELEMENT, 2 * Float32Array.BYTES_PER_ELEMENT)
gl?.vertexAttribPointer(aColorLoc, 3, gl.FLOAT, false, 6 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT)


gl?.drawArrays(gl.TRIANGLES, 0, 3)