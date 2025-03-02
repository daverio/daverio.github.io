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

    //we need a way to know on which page we are currently
    // and if we are in transition
    // and if the area to be clicked should be 'on' or not
  }

  StartWaitingAnime() {
    this.waitingAnimation.Start();
  }

  StopWaitingAnime() {
    this.waitingAnimation.Stop();
  }

  //Create Buffers from the data, all buffers have same size 
  // as they represent the list of white pixel which move around
  createBuffers(data,startBuffer) {
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
      console.log(key)
      console.log('frame: ',frame);
      this.buffers[key] = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.buffers[key]);
      this.gl.bufferData(this.gl.ARRAY_BUFFER,new Float32Array(frame),this.gl.STATIC_DRAW);
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER,null);
    });

    //we can now update the current buffer to become the mainPicture
    // Copy Data from sourceBuffer → destinationBuffer

    this.gl.bindBuffer(this.gl.COPY_READ_BUFFER, this.buffers[startBuffer]);
    this.gl.bindBuffer(this.gl.COPY_WRITE_BUFFER, this.buffers.current);
    this.gl.copyBufferSubData(this.gl.COPY_READ_BUFFER, this.gl.COPY_WRITE_BUFFER, 0, 0, numPixels*2*Float32Array.BYTES_PER_ELEMENT);
    this.gl.bindBuffer(this.gl.COPY_READ_BUFFER, null);
    this.gl.bindBuffer(this.gl.COPY_WRITE_BUFFER, null);

  }

  createPrograms() {
    const vertexShaderPlotImageSource = `#version 300 es
    in vec2 a_data;
    uniform vec2 u_scale;
    uniform vec2 u_offset;
    void main() {
      vec2 points = (a_data * u_scale) + u_offset;
      gl_PointSize = 1.0;
      gl_Position = vec4(points, 0.0, 1.0);
    }
    `;

    const vertexShaderAnimeSource = `#version 300 es
    in vec2 a_dataStart;
    in vec2 a_dataTarget;
    uniform vec2 u_scale;
    uniform vec2 u_offset;
    uniform float u_mixFactor;
    out vec2 v_output;

    void main() {
      vec2 mixedPos = mix(a_dataStart, a_dataTarget, u_mixFactor);
      v_output = mixedPos;
      vec2 transformedPos = mixedPos * u_scale + u_offset;
      gl_PointSize = 1.0;
      gl_Position = vec4(transformedPos, 0.0, 1.0);
    }
    `;

    const fragmentShaderPixelsSource = `#version 300 es
      precision mediump float;
      out vec4 fragColor;

      void main() {
        fragColor = vec4(1.0, 1.0, 1.0, 1.0);
      }
    `;

    const vertexShaderPlotImage = this.createShader(this.gl.VERTEX_SHADER, vertexShaderPlotImageSource);
    const vertexShaderAnime = this.createShader(this.gl.VERTEX_SHADER, vertexShaderAnimeSource);
    const fragmentShaderPixels = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderPixelsSource);

    this.progPlotImage = this.gl.createProgram();
    this.gl.attachShader(this.progPlotImage, vertexShaderPlotImage);
    this.gl.attachShader(this.progPlotImage, fragmentShaderPixels);
    this.gl.linkProgram(this.progPlotImage);
    if (!this.gl.getProgramParameter(this.progPlotImage, this.gl.LINK_STATUS)) {
      console.error('Program Link Error:', this.gl.getProgramInfoLog(this.progPlotImage));
    }

    this.progAnime = this.gl.createProgram();
    this.gl.attachShader(this.progAnime, vertexShaderAnime);
    this.gl.attachShader(this.progAnime, fragmentShaderPixels);
    this.gl.transformFeedbackVaryings(this.progAnime, ["v_output"], this.gl.SEPARATE_ATTRIBS);
    this.gl.linkProgram(this.progAnime);
    if (!this.gl.getProgramParameter(this.progAnime, this.gl.LINK_STATUS)) {
      console.error('Program Link Error:', this.gl.getProgramInfoLog(this.progAnime));
    }
  }




  computeCoordTransform() {
    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;
    const width = this.dataSources.meta.width;
    const height = this.dataSources.meta.height;
    const scaleX = 2.0 * canvasHeight / (height * canvasWidth);
    const scaleY = - 2.0 / height;
    const offsetX = - width * canvasHeight / (height * canvasWidth);
    const offsetY = 1.0;
    return {
      scaleX: scaleX,
      scaleY: scaleY,
      offsetX: offsetX,
      offsetY: offsetY
    }
  }

  drawCurrent() {
    this.gl.useProgram(this.progPlotImage);
    
    const transform = this.computeCoordTransform();
    const u_scaleLocation = this.gl.getUniformLocation(this.progPlotImage, 'u_scale');
    const u_offsetLocation = this.gl.getUniformLocation(this.progPlotImage, 'u_offset');
    this.gl.uniform2f(u_scaleLocation, transform.scaleX, transform.scaleY);
    this.gl.uniform2f(u_offsetLocation, transform.offsetX, transform.offsetY);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.current);
    const dataLocation = this.gl.getAttribLocation(this.progPlotImage, 'a_data');
    console.log('datalocation', dataLocation)
    this.gl.enableVertexAttribArray(dataLocation);
    this.gl.vertexAttribPointer(dataLocation, 2, this.gl.FLOAT, false, 0, 0);

    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    console.log('numPart: ',this.dataSources.meta.numPixels)
    this.gl.drawArrays(this.gl.POINTS, 0, this.dataSources.meta.numPixels);
  }

  startAnime(duration,targetBuffer){
    this.isAnimating = true;
    
    //copy the current buffer to the start buffer
    this.gl.bindBuffer(this.gl.COPY_READ_BUFFER, this.buffers.current);
    this.gl.bindBuffer(this.gl.COPY_WRITE_BUFFER, this.buffers.start);
    this.gl.copyBufferSubData(this.gl.COPY_READ_BUFFER, this.gl.COPY_WRITE_BUFFER, 0, 0, this.dataSources.meta.numPixels*2*Float32Array.BYTES_PER_ELEMENT);
    this.gl.bindBuffer(this.gl.COPY_READ_BUFFER, null);
    this.gl.bindBuffer(this.gl.COPY_WRITE_BUFFER, null);

    const startTime = performance.now();
    
    const draw = () => {
      if (!this.isAnimating) return;
      const elapsed = (performance.now() - startTime) / 1000;
      //if(elapsed > duration) return;
      
      this.gl.useProgram(this.progAnime);
      
      const t = Math.min(Math.abs(1 - Math.pow(1 - (elapsed / duration), 3)),1);
      const transform = this.computeCoordTransform();
      const u_mixFactorLoc = this.gl.getUniformLocation(this.progAnime, "u_mixFactor");
      const u_scaleLocation = this.gl.getUniformLocation(this.progAnime, 'u_scale');
      const u_offsetLocation = this.gl.getUniformLocation(this.progAnime, 'u_offset');
      this.gl.uniform1f(u_mixFactorLoc,t);
      this.gl.uniform2f(u_scaleLocation, transform.scaleX, transform.scaleY);
      this.gl.uniform2f(u_offsetLocation, transform.offsetX, transform.offsetY);
      
      
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.start);
      const locationStart = this.gl.getAttribLocation(this.progAnime, "a_dataStart");
      this.gl.enableVertexAttribArray(locationStart);
      this.gl.vertexAttribPointer(locationStart, 2, this.gl.FLOAT, false, 0, 0);
      
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers[targetBuffer]);
      const locationTarget = this.gl.getAttribLocation(this.progAnime, "a_dataTarget");
      this.gl.enableVertexAttribArray(locationTarget);
      this.gl.vertexAttribPointer(locationTarget, 2, this.gl.FLOAT, false, 0, 0);
      
      this.gl.bindBufferBase(this.gl.TRANSFORM_FEEDBACK_BUFFER, 0, this.buffers.current);
      //const locationOutput = this.gl.getAttribLocation(this.progAnime, "v_output");
      //this.gl.enableVertexAttribArray(locationOutput);
      //this.gl.vertexAttribPointer(locationOutput, 2, this.gl.FLOAT, false, 0, 0);

      this.gl.beginTransformFeedback(this.gl.POINTS);
      this.gl.drawArrays(this.gl.POINTS, 0, this.dataSources.meta.numPixels);
      this.gl.endTransformFeedback();

      this.gl.bindBufferBase(this.gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);

      //this.drawCurrent();

      requestAnimationFrame(draw);
    }
  
    draw();
  }

  stopAnime(){
    this.isAnimating = false;
  }

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
