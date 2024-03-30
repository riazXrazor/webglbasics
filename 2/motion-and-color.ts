const SPWAN_RATE = 0.08,
 MIN_SHAPE_TIME = 0.25,
 MAX_SHAPE_TIME = 6,
 MIN_SHAPE_SPEED = 125,
 MAX_SHAPE_SPEED = 350,
 MIN_SHAPE_SIZE = 2,
 MAX_SHAPE_SIZE = 50,
 MAX_SHAPE_COUNT = 250,
 CIRCLE_SEGEMENTS = 30

function showErrors(errMsg: string){
    const ele = document.getElementById("error-box")
    const p = document.createElement("p")
    p.innerText = errMsg
    if(ele)
    ele.appendChild(p)
    console.log(errMsg)
}

const triangleVertices = new Float32Array([
/*
 0  *  0
 0  0  0
 *  0  *
*/
    // top
    0,1,
    //bottom left
    -1,-1,
    // botom right
    1,-1
])

const SquareVert = new Float32Array([
/*
 *  0  *
 0  0  0
 *  0  *
*/
    -1,1,-1,-1,1,-1,
    -1,1,1,-1,1,1,
])



const rgbTraiangleColors = new Uint8Array([
    255,0,0,
    0,255,0,
    0,0,255
])
const fireyTraiangleColors = new Uint8Array([
    229,47,15,
    246,206,29,
    233,154,26
])

const indigoGradientSquareColors = new Uint8Array([
    // Top: "Tropical Indigo" - A799FF
    167, 153, 255,
    // Bottom: "Eminence" - 583E7A
    88, 62, 122,
    88, 62, 122,
    167, 153, 255,
    88, 62, 122,
    167, 153, 255
  ]);
  const graySquareColors = new Uint8Array([
    45, 45, 45,
    45, 45, 45,
    45, 45, 45,
    45, 45, 45,
    45, 45, 45,
    45, 45, 45
  ]);

  const circleInterleavedVert = buildCircleVertices()
  

const vertexShaderSourceCode = `#version 300 es
    #pragma vscode_glsllint_stage: vert

    precision mediump float;

    in vec2 vertexPosition;
    in vec3 vertexColor;

    out vec3 fragmentColor;

    uniform vec2 canvasSize;
    uniform vec2 shapeLocation;
    uniform float shapeSize;

    void main(){
        fragmentColor = vertexColor;

        vec2 finalVertexPosition = vertexPosition * shapeSize + shapeLocation;
        vec2 clipPosition = finalVertexPosition/canvasSize * 2.0 - 1.0;

        gl_Position = vec4(clipPosition, 0.0, 1.0);
    }
    `

    const fragmentShaderSourceCode = `#version 300 es
    precision mediump float;

    in vec3 fragmentColor;
    out vec4 outputColor;

    void main(){
        outputColor = vec4(fragmentColor, 1.0);
    }
    `

class MovingShape {
    constructor(
        public pos: [number, number],
        public vel: [number, number],
        public size: number,
        public timeremaining: number,
        public vao: WebGLVertexArrayObject,
        public verts: number
    ){}

    isAlive(){ return this.timeremaining > 0  }

    update(dt: number){
        this.pos[0] += this.vel[0] * dt;
        this.pos[1] += this.vel[1] * dt;

        this.timeremaining -= dt
    }
}

/**
 * Generates a random number between the specified minimum and maximum values (inclusive).
 *
 * @param {number} min - The minimum value for the random number.
 * @param {number} max - The maximum value for the random number.
 * @return {number} The randomly generated number.
 */
function getRandomNumber(min: number,max: number){
    return Math.random() * (max- min) + min;
}

/**
 * Builds an array of vertices representing a circle.
 *
 * @return {Float32Array} The array of circle vertices.
 */
function buildCircleVertices() {
  const circleVertices = [];

  for (let segmentIndex = 0; segmentIndex < CIRCLE_SEGEMENTS; segmentIndex++) {
    const angle1 = segmentIndex * (2 * Math.PI) / CIRCLE_SEGEMENTS;
    const angle2 = (segmentIndex + 1) * (2 * Math.PI) / CIRCLE_SEGEMENTS;

    const point1 = [Math.cos(angle1), Math.sin(angle1)];
    const point2 = [Math.cos(angle2), Math.sin(angle2)];

    const centerVertex = [0, 0];
    const coloredVertex = [0.678, 0.851, 0.957];
    const coloredVertex2 = [0.251, 0.353, 0.856];

    circleVertices.push(...centerVertex, ...coloredVertex);
    circleVertices.push(...point1, ...coloredVertex2);
    circleVertices.push(...point2, ...coloredVertex2);
  }

  return new Float32Array(circleVertices);
}

function movementAndColor(){

    const canvas: HTMLCanvasElement = document.getElementById("demo-canvas") as HTMLCanvasElement
    if(!canvas){
        showErrors("No canvas found!")
        return;
    }


    const gl = canvas.getContext("webgl2")
    if(!gl){
        showErrors("webgl2 not supported !")
        return;
    }



    const triangleGeoBuffer = createBuffer(gl,triangleVertices) as WebGLBuffer
    const squereGeoBuffer = createBuffer(gl,SquareVert) as WebGLBuffer
    const rgbTraiangleColorsBuffer = createBuffer(gl,rgbTraiangleColors) as WebGLBuffer
    const fireyTraiangleColorsBuffer = createBuffer(gl,fireyTraiangleColors) as WebGLBuffer

    const indigoGradientSquareColorsBuffer = createBuffer(gl,indigoGradientSquareColors) as WebGLBuffer
    const graySquareColorsBuffer = createBuffer(gl,graySquareColors) as WebGLBuffer

    const circleInterleavedBuffer = createBuffer(gl,circleInterleavedVert) as WebGLBuffer

    

    const vertexShader = compileShader(gl,vertexShaderSourceCode,true)
    const fragmentShader = compileShader(gl,fragmentShaderSourceCode,false)

    if(!vertexShader || !fragmentShader){
        showErrors("shaders not found");
        return;
    }
 
    const myprogram = createProgramAndLink(gl, vertexShader, fragmentShader)

    if(!myprogram){
        showErrors("program not found");
        return;
    }

    const vertexPositionAttribLocation = getLocation(gl, myprogram, 'vertexPosition','A') as number
    const vertexColorAttribLocation = getLocation(gl, myprogram, 'vertexColor','A') as number

    const shapeLocationUnform = getLocation(gl, myprogram, 'shapeLocation','U') as WebGLUniformLocation
    const canvasSizeUnform = getLocation(gl, myprogram, 'canvasSize','U') as WebGLUniformLocation
    const shapeSizeUnform = getLocation(gl, myprogram, 'shapeSize','U') as WebGLUniformLocation

    const rgbTriangleVao = createTwoBufferVao(gl, 
        triangleGeoBuffer, rgbTraiangleColorsBuffer,
        vertexPositionAttribLocation, vertexColorAttribLocation
    ) as WebGLVertexArrayObject 

    const fireyTriangleVao = createTwoBufferVao(gl, 
        triangleGeoBuffer, fireyTraiangleColorsBuffer,
        vertexPositionAttribLocation, vertexColorAttribLocation
    ) as WebGLVertexArrayObject 

    const indigoGradientSquareVao =  createTwoBufferVao(gl, 
        squereGeoBuffer, indigoGradientSquareColorsBuffer,
        vertexPositionAttribLocation, vertexColorAttribLocation
    ) as WebGLVertexArrayObject 

    const graySquareVao =  createTwoBufferVao(gl, 
        squereGeoBuffer, graySquareColorsBuffer,
        vertexPositionAttribLocation, vertexColorAttribLocation
    ) as WebGLVertexArrayObject 

    const circleVao =  createInterleavedBufferVao(gl, 
        circleInterleavedBuffer,
        vertexPositionAttribLocation, vertexColorAttribLocation
    ) as WebGLVertexArrayObject 

    const geometryList = [
        {vao: rgbTriangleVao, verts: 3},
        {vao: fireyTriangleVao, verts: 3},
        {vao: indigoGradientSquareVao, verts: 6},
        {vao: graySquareVao, verts: 6},
        {vao: circleVao, verts: CIRCLE_SEGEMENTS * 3},
    ]

    let shapes: MovingShape[] = []
    let timeToNextSpawn = SPWAN_RATE;

    let lastFrameTime = performance.now();
    const frame = () => {
        const thisFrameTime = performance.now();
        const dt = (thisFrameTime - lastFrameTime)/1000
        lastFrameTime = thisFrameTime

        timeToNextSpawn -= dt
        while (timeToNextSpawn < 0) {
            timeToNextSpawn += SPWAN_RATE
            const pos: [number, number] = [canvas.width/2, canvas.height/2];

            const movAng = getRandomNumber(0, 2 * Math.PI);
            const movSpeed = getRandomNumber(MIN_SHAPE_SPEED,MAX_SHAPE_SPEED);
            
            const vel: [number, number] = [
               Math.sin(movAng) * movSpeed,
               Math.cos(movAng) * movSpeed
            ]

            const siz = getRandomNumber(MIN_SHAPE_SIZE, MAX_SHAPE_SIZE)
            
            const time = getRandomNumber(MIN_SHAPE_TIME, MAX_SHAPE_TIME)
            
            const geometryIndex = Math.floor(getRandomNumber(0, geometryList.length))
            const geometry = geometryList[geometryIndex]

            const shape = new MovingShape(pos, vel, siz, time, geometry.vao, geometry.verts)

            shapes.push(shape)
        }

        for (let i = 0; i < shapes.length; i++) {
            shapes[i].update(dt)
        }
        
        shapes = shapes.filter(s => s.isAlive()).slice(0, MAX_SHAPE_COUNT)

        canvas.width = canvas.clientWidth
        canvas.height = canvas.clientHeight
    
        gl.clearColor(0.08, 0.08, 0.08, 1.0)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    
        gl.viewport(0,0, canvas.width, canvas.height)
    
    
        gl.useProgram(myprogram)
    
        gl.uniform2f(canvasSizeUnform, canvas.width, canvas.height)
    

        for (let i = 0; i < shapes.length; i++) {
            const s = shapes[i]
            gl.uniform1f(shapeSizeUnform, s.size)
            gl.uniform2f(shapeLocationUnform, s.pos[0], s.pos[1])
            gl.bindVertexArray(s.vao)
            gl.drawArrays(gl.TRIANGLES, 0, s.verts)
        }

    

        requestAnimationFrame(frame)
    }

    requestAnimationFrame(frame)

}



/**
 * Creates a buffer in the WebGL context with the provided buffer array.
 *
 * @param {WebGL2RenderingContext} gl - The WebGL context to create the buffer in.
 * @param {ArrayBuffer} bufferArray - The array buffer data to be stored in the buffer.
 * @return {WebGLBuffer} The created buffer in the WebGL context.
 */ 
function createBuffer(gl: WebGL2RenderingContext, bufferArray: ArrayBuffer){
    const triangleGeoBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleGeoBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, bufferArray, gl.STATIC_DRAW)

    return triangleGeoBuffer;
}

/**
 * Creates a Vertex Array Object (VAO) with the provided WebGL context, position buffer, color buffer, position attribute location, and color attribute location.
 *
 * @param {WebGL2RenderingContext} gl - The WebGL context to work with.
 * @param {WebGLBuffer} posBuffer - The buffer containing position data.
 * @param {WebGLBuffer} colorBuffer - The buffer containing color data.
 * @param {number} posAL - The position attribute location.
 * @param {number} colAL - The color attribute location.
 * @return {WebGLVertexArrayObject | undefined} The created VAO or undefined if creation fails.
 */
function createTwoBufferVao(
    gl: WebGL2RenderingContext,
    posBuffer: WebGLBuffer,
    colorBuffer: WebGLBuffer,
    posAL: number,
    colAL: number
    ){
    const vao = gl.createVertexArray();
    if(!vao){
        showErrors("cant create vao");
        return;
    }

    gl.bindVertexArray(vao)
    gl.enableVertexAttribArray(posAL)
    gl.enableVertexAttribArray(colAL)
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer)
    gl.vertexAttribPointer(
        posAL,2,gl.FLOAT,false,0,0
    )

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.vertexAttribPointer(
        colAL,
        3,
        gl.UNSIGNED_BYTE,
        true,
        0,
        0
    )

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null)

    return vao;
}


/**
 * Creates and returns a VAO with the given interleaved buffer and attribute locations.
 *
 * @param {WebGL2RenderingContext} gl - The WebGL rendering context.
 * @param {WebGLBuffer} interleavedBuffer - The interleaved buffer to bind to the VAO.
 * @param {number} posAL - The attribute location for the position attribute.
 * @param {number} colAL - The attribute location for the color attribute.
 * @return {WebGLVertexArrayObject | null} The created VAO, or null if creation failed.
 */
function createInterleavedBufferVao(
    gl: WebGL2RenderingContext,
    interleavedBuffer: WebGLBuffer,
    posAL: number,
    colAL: number
    ){
    const vao = gl.createVertexArray();
    if(!vao){
        showErrors("cant create vao");
        return;
    }

    gl.bindVertexArray(vao)
    gl.enableVertexAttribArray(posAL)
    gl.enableVertexAttribArray(colAL)
    gl.bindBuffer(gl.ARRAY_BUFFER, interleavedBuffer)
    // (x,y,r,g,b)
    gl.vertexAttribPointer(
        posAL,2,gl.FLOAT,false,
        5 * Float32Array.BYTES_PER_ELEMENT,0
    )

    gl.vertexAttribPointer(
        colAL,3,gl.UNSIGNED_BYTE,true,
        5 * Float32Array.BYTES_PER_ELEMENT,
        2 * Float32Array.BYTES_PER_ELEMENT
    )

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null)

    return vao;
}


/**
 * Compiles a shader for WebGL rendering context.
 *
 * @param {WebGL2RenderingContext} gl - The WebGL rendering context.
 * @param {string} shaderSourceCode - The source code of the shader to compile.
 * @param {boolean} isVertexShader - Flag indicating whether the shader is a vertex shader.
 * @return {WebGLShader} The compiled shader object.
 */
function compileShader(gl: WebGL2RenderingContext,shaderSourceCode: string, isVertexShader: boolean){
    const shader = gl.createShader(isVertexShader ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER)
    if(!shader){
        showErrors(`can't create shader error`)
        return;
    }
    gl.shaderSource(shader, shaderSourceCode)
    gl.compileShader(shader)
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){
        const err = gl.getShaderInfoLog(shader)
        showErrors(`${isVertexShader ? `VERTEX_SHADER` : `FRAGMENT_SHADER`} compile error: ${err}`)
        return;
    }

    return shader
}

/**
 * Creates a WebGL program and links it to the given vertex and fragment shaders.
 *
 * @param {WebGL2RenderingContext} gl - The WebGL rendering context.
 * @param {WebGLShader} vshader - The vertex shader.
 * @param {WebGLShader} fshader - The fragment shader.
 * @return {WebGLProgram | undefined} The created program, or undefined if an error occurred.
 */
function createProgramAndLink(gl: WebGL2RenderingContext, vshader: WebGLShader,fshader: WebGLShader){
    const program = gl.createProgram()
    if(!program){
        showErrors(`can't create program error`)
        return;
    }
    gl.attachShader(program, vshader)
    gl.attachShader(program, fshader)
    gl.linkProgram(program)

    if(!gl.getProgramParameter(program,gl.LINK_STATUS)){
        const err = gl.getProgramInfoLog(program)
        showErrors(`create program error: ${err}`)
        return;
    }

    return program;
}


/**
 * Retrieves the location of a specific attribute or uniform in a WebGL program.
 *
 * @param {WebGL2RenderingContext} gl - The WebGL rendering context.
 * @param {WebGLProgram} program - The WebGL program to query.
 * @param {string} paramName - The name of the attribute or uniform to locate.
 * @param {'A' | 'U'} type - The type of the parameter ('A' for attribute or 'U' for uniform).
 * @return {number | WebGLUniformLocation | null} The location of the attribute or uniform, or null if an error occurred.
 */
function getLocation(gl: WebGL2RenderingContext, program: WebGLProgram, paramName: string, type: 'A' | 'U'){
    let loc: number | WebGLUniformLocation | null  = null
    if(type == 'A'){
         loc = gl.getAttribLocation(program, paramName) as number
         if((loc as number) < 0){
            showErrors(`get getAttribLocation location error: ${paramName}`)
            return
        }
    }
    else if(type == 'U'){
         loc = gl.getUniformLocation(program, paramName) as WebGLUniformLocation
         if(!loc){
            showErrors(`get getUniformLocation location error: ${paramName}`)
            return
        }
    }
    

    return loc;
}

try{
    movementAndColor();
}catch(e){
    showErrors((e as Error).message) 
}