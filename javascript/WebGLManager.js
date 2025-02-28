import { WaitingAnimation } from './WaitingAnimation.js';


export class WebGLManager {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.gl = this.canvas.getContext('webgl');
    if (!this.gl) {
      alert('WebGL not supported');
      return;
    }
    this.waitingAnimation = new WaitingAnimation(this.gl);
    this.bufferSize = 0;  // Buffer Size is now dynamic
    this.createShaders();
  }

  StartWaitingAnime() {
    this.waitingAnimation.Start();
  }

  StopWaitingAnime() {
    this.waitingAnimation.Stop();
  }

  // New Method: Create Buffers with Dynamic Size
  createBuffers(size) {
    this.bufferSize = size;
    if (this.bufferSize <= 0) {
      console.error('Buffer size must be greater than 0');
      return;
    }

    // Start Position Buffer
    this.startPositions = new Array(this.bufferSize * 2).fill(0);
    this.startPosBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.startPosBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.startPositions), this.gl.DYNAMIC_DRAW);

    // End Position Buffer
    this.endPositions = new Array(this.bufferSize * 2).fill(0);
    this.endPosBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.endPosBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.endPositions), this.gl.DYNAMIC_DRAW);

    // Current Position Buffer
    this.currentPositions = new Array(this.bufferSize * 2).fill(0);
    this.currentPosBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.currentPosBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.currentPositions), this.gl.DYNAMIC_DRAW);
  }

  // Method: Set Start Positions
  setStartPositions(positionsArray) {
    if (positionsArray.length !== this.bufferSize * 2) {
      console.error('Invalid Start Positions Array Length');
      return;
    }

    // Deep Copy to Prevent Corruption
    this.startPositions = [...positionsArray];
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.startPosBuffer);
    this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, new Float32Array(this.startPositions));
  }

  // Method: Set End Positions
  setEndPositions(positionsArray) {
    if (positionsArray.length !== this.bufferSize * 2) {
      console.error('Invalid End Positions Array Length');
      return;
    }

    // Deep Copy to Prevent Corruption
    this.endPositions = [...positionsArray];
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.endPosBuffer);
    this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, new Float32Array(this.endPositions));
  }

  createShaders() {
    const vertexShaderSource = `
      attribute vec2 a_startPos;
      attribute vec2 a_endPos;
      uniform float u_time;
      varying vec2 v_currentPos;

      void main() {
        v_currentPos = mix(a_startPos, a_endPos, u_time);
        gl_PointSize = 2.0;
        gl_Position = vec4(v_currentPos, 0.0, 1.0);
      }
    `;

    const fragmentShaderSource = `
      precision mediump float;
      void main() {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
      }
    `;

    const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);

    this.program = this.gl.createProgram();
    this.gl.attachShader(this.program, vertexShader);
    this.gl.attachShader(this.program, fragmentShader);
    this.gl.linkProgram(this.program);

    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      console.error('Program Link Error:', this.gl.getProgramInfoLog(this.program));
    }
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
}
