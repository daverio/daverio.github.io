import { WaitingAnimation } from './WaitingAnimation.js';


export class WebGLManager {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.gl = this.canvas.getContext('webgl2');
    if (!this.gl) {
      alert('WebGL not supported');
      return;
    }
    this.resizeCanvas(false);
    // Listen for Window Resize
    this.dataSources = null;
    window.addEventListener('resize', () => this.resizeCanvas());
    this.waitingAnimation = new WaitingAnimation(this.gl);
    this.createPrograms();
  }

  StartWaitingAnime() {
    this.waitingAnimation.Start();
  }

  StopWaitingAnime() {
    this.waitingAnimation.Stop();
  }

  //Create Buffers from the data, all buffers have same size 
  // as they represent the list of white pixel which move around
  createBuffers(data) {
    this.dataSources = data;
    const numPixels = this.dataSources.meta.numPixels;
    if (numPixels <= 0) {
      console.error('Buffer size must be greater than 0');
      return;
    }

    this.buffers = {}
    //build the two GPU only temporary buffers
    this.buffers.start = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.buffers.start);
    this.gl.bufferData(this.gl.ARRAY_BUFFER,numPixels*2*Float32Array.BYTES_PER_ELEMENT,this.gl.DYNAMIC_COPY);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER,null);

    this.buffers.current = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.buffers.current);
    this.gl.bufferData(this.gl.ARRAY_BUFFER,numPixels*2*Float32Array.BYTES_PER_ELEMENT,this.gl.DYNAMIC_COPY);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER,null);

    //build the list of buffers that are in data
    Object.entries(data.frames).forEach(([key,frame])=> {
      if(key === 'start' || key === 'current') {
        const errorMessage = 'createBuffers(): imported source data cannot be called start or current.';
        console.error(errorMessage);
        throw new Error(errorMessage);
      }
      console.log('frame: ',frame);
      this.buffers[key] = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.buffers[key]);
      this.gl.bufferData(this.gl.ARRAY_BUFFER,new Float32Array(frame),this.gl.STATIC_DRAW);
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER,null);
    });

    //we can now update the current buffer to become the mainPicture
    // Copy Data from sourceBuffer → destinationBuffer

    this.currentBufferName = 'mainPicture';

    this.gl.bindBuffer(this.gl.COPY_READ_BUFFER, this.buffers[this.currentBufferName]);
    this.gl.bindBuffer(this.gl.COPY_WRITE_BUFFER, this.buffers.current);
    this.gl.copyBufferSubData(this.gl.COPY_READ_BUFFER, this.gl.COPY_WRITE_BUFFER, 0, 0, numPixels*2*Float32Array.BYTES_PER_ELEMENT);
    this.gl.bindBuffer(this.gl.COPY_READ_BUFFER, null);
    this.gl.bindBuffer(this.gl.COPY_WRITE_BUFFER, null);

    

  }

  //// Method: Set Start Positions
  //setStartPositions(results) {
  //  if (!results || !results.positions || !results.width || !results.height) {
  //    console.error('Invalid Results Object');
  //    return;
  //  }
  //
  //  //this.bufferSize = results.positions/2;
  //  // Extract Data from Results
  //  const { positions, width, height } = results;
  //  const canvasWidth = this.canvas.width;
  //  const canvasHeight = this.canvas.height;
  //  
  //
  //  // Calculate Scale Factor to Fit Height
  //  const scale = 2 * canvasHeight / height;
  //  console.log('image',width,height);
  //  console.log('cavas',canvasWidth,canvasHeight);
  //  console.log('image reciezed',width*scale,height*scale)
  //  const scaledWidth = width * scale;
  //  const offsetX = width * scale  / (2.0*canvasWidth);
//
  //  // Adjusted Positions Array
  //  const adjustedPositions = [];
//
  //  // Resize and Normalize Coordinates
  //  for (let i = 0; i < positions.length; i += 2) {
  //    positions[i] = positions[i] * scale / canvasWidth - offsetX;
  //    positions[i+1] = 1 - positions[i+1] * scale / canvasHeight;
  //  }
  //
  //  // Deep Copy to Prevent Corruption
  //  this.startPositions = [...positions];
  //  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.startPosBuffer);
  //  this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, new Float32Array(this.startPositions));
  //}
  
  createPrograms() {
    const vertexShaderPlotImageSource = `
    attribute vec2 a_data;
    uniform vec2 u_scale;
    uniform vec2 u_offset;
    void main() {
      vec2 points = (a_data * u_scale) + u_offset;
      gl_PointSize = 1.0;
      gl_Position = vec4(points, 0.0, 1.0);
    }
    `;

    const fragmentShaderPixelsSource = `
      precision mediump float;
      void main() {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
      }
    `;

    const vertexShaderPlotImage = this.createShader(this.gl.VERTEX_SHADER, vertexShaderPlotImageSource);
    const fragmentShaderPixels = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderPixelsSource);

    this.progPlotImage = this.gl.createProgram();
    this.gl.attachShader(this.progPlotImage, vertexShaderPlotImage);
    this.gl.attachShader(this.progPlotImage, fragmentShaderPixels);
    this.gl.linkProgram(this.progPlotImage);

    if (!this.gl.getProgramParameter(this.progPlotImage, this.gl.LINK_STATUS)) {
      console.error('Program Link Error:', this.gl.getProgramInfoLog(this.progPlotImage));
    }
  }

  drawCurrent() {
    //const { positions, width, height } = results;
    //const canvasWidth = this.canvas.width;
    //const canvasHeight = this.canvas.height;
    //
    //
    //// Calculate Scale Factor to Fit Height
    //const scale = 2 * canvasHeight / height;
    //console.log('image',width,height);
    //console.log('cavas',canvasWidth,canvasHeight);
    //console.log('image reciezed',width*scale,height*scale)
    //const scaledWidth = width * scale;
    ////const offsetX = width * scale  / (2.0*canvasWidth);
    //
    //// Adjusted Positions Array
    //const adjustedPositions = [];
    //
    //// Resize and Normalize Coordinates
    //for (let i = 0; i < positions.length; i += 2) {
    //  positions[i] = positions[i] * scale / canvasWidth - offsetX;
    //  positions[i+1] = 1 - positions[i+1] * scale / canvasHeight;
    //}
    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;
    const width = this.dataSources.meta.width;
    const height = this.dataSources.meta.height;

    console.log('source size: ',width,height);
    console.log('canvas size: ',canvasWidth,canvasHeight);

    const scaleX = 2.0 * canvasHeight / (height * canvasWidth);
    const scaleY = - 2.0 / height;
    const offsetX = - width * canvasHeight / (height * canvasWidth);
    const offsetY = 1.0;

    console.log(scaleX,scaleY,offsetX,offsetY);

    this.gl.useProgram(this.progPlotImage);
    console.log(this.dataSources.frames.mainPicture)
    console.log(this.buffers.mainPicture);

    const u_scaleLocation = this.gl.getUniformLocation(this.progPlotImage, 'u_scale');
    const u_offsetLocation = this.gl.getUniformLocation(this.progPlotImage, 'u_offset');
    console.log('u_scaleLocation', u_scaleLocation)
    console.log('u_scaleLocation', u_scaleLocation)

    this.gl.uniform2f(u_scaleLocation, scaleX, scaleY);
    this.gl.uniform2f(u_offsetLocation, offsetX, offsetY);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.current);
    const dataLocation = this.gl.getAttribLocation(this.progPlotImage, 'a_data');
    console.log('datalocation', dataLocation)
    this.gl.enableVertexAttribArray(dataLocation);
    this.gl.vertexAttribPointer(dataLocation, 2, this.gl.FLOAT, false, 0, 0);

    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    console.log('numPart: ',this.dataSources.meta.numPixels)
    this.gl.drawArrays(this.gl.POINTS, 0, this.dataSources.meta.numPixels);
  }

  //createShaders() {
  //  const vertexShaderSource = `
  //    attribute vec2 a_startPos;
  //    attribute vec2 a_endPos;
  //    uniform float u_time;
  //    uniform int u_drawMode;
  //    varying vec2 v_currentPos;
  //    
  //    void main() {
  //      if (u_drawMode == 0) {
  //        // Draw Start Positions
  //        v_currentPos = a_startPos;
  //      } else {
  //        // Draw Interpolated Positions (Animation)
  //        v_currentPos = mix(a_startPos, a_endPos, u_time);
  //      }
  //      gl_PointSize = 1.0;
  //      gl_Position = vec4(v_currentPos, 0.0, 1.0);
  //    }
  //  `;
//
  //  const fragmentShaderSource = `
  //    precision mediump float;
  //    void main() {
  //      gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
  //    }
  //  `;
//
  //  const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
  //  const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
//
  //  this.program = this.gl.createProgram();
  //  this.gl.attachShader(this.program, vertexShader);
  //  this.gl.attachShader(this.program, fragmentShader);
  //  this.gl.linkProgram(this.program);
//
  //  if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
  //    console.error('Program Link Error:', this.gl.getProgramInfoLog(this.program));
  //  }
  //}

  createShader(type, source) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader Compile Error:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  //drawStartBuffer() {
  //  if (this.startPositions.length === 0) {
  //    console.error('Start Positions Buffer is Empty');
  //    return;
  //  }
  //
  //  this.gl.useProgram(this.program);
  //
  //  // Set Draw Mode to 0 (Draw Start Positions)
  //  const drawModeLocation = this.gl.getUniformLocation(this.program, 'u_drawMode');
  //  this.gl.uniform1i(drawModeLocation, 0);
  //
  //  // Bind Start Position Buffer
  //  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.startPosBuffer);
  //  const startPosLocation = this.gl.getAttribLocation(this.program, 'a_startPos');
  //  this.gl.enableVertexAttribArray(startPosLocation);
  //  this.gl.vertexAttribPointer(startPosLocation, 2, this.gl.FLOAT, false, 0, 0);
  //
  //  // Clear Canvas and Draw Points
  //  this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  //  this.gl.drawArrays(this.gl.POINTS, 0, this.startPositions.length / 2);
  //}
  // Method: Resize Canvas and Update WebGL Viewport
  resizeCanvas(flag=true) {
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;

    // Check if the canvas is the same size as the window
    if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
      // Resize the canvas to match the window size
      this.canvas.width = displayWidth;
      this.canvas.height = displayHeight;
      console.log('resizing canvas:',this.canvas.width,this.canvas.height)

      // Update the WebGL viewport
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      if(flag){
        this.drawCurrent();
      }
    }
  }
}
