export class WaitingAnimation {
    constructor(gl) {
      this.gl = gl;
      this.angle = 0;
      this.isAnimating = false;
      this.program = null;
      this.buffer = null;
  
      this.createShaders();
      this.createBuffers();
    }
  
    createShaders() {
      const vertexShaderSource = `
        attribute vec2 a_position;
        uniform float u_angle;
  
        void main() {
          float cosAngle = cos(u_angle);
          float sinAngle = sin(u_angle);
  
          vec2 rotatedPosition = vec2(
            a_position.x * cosAngle - a_position.y * sinAngle,
            a_position.x * sinAngle + a_position.y * cosAngle
          );
  
          gl_PointSize = 8.0;
          gl_Position = vec4(rotatedPosition, 0.0, 1.0);
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
  
    createBuffers() {
      // Quarter Circle Positions
      const radius = 0.2;
      const numDots = 5;
      const positions = [];
      for (let i = 0; i < numDots; i++) {
        const angle = (i / (numDots - 1)) * (Math.PI / 2);
        positions.push(Math.cos(angle) * radius, Math.sin(angle) * radius);
      }
  
      // Create Buffer
      this.buffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
    }
  
    Start() {
      this.isAnimating = true;
      const startTime = performance.now();
  
      const draw = () => {
        if (!this.isAnimating) return;
  
        const elapsed = (performance.now() - startTime) / 1000;
        this.angle = elapsed * Math.PI * 2;  // 1 rotation per second
  
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.useProgram(this.program);
  
        // Pass Rotation Angle
        const angleLocation = this.gl.getUniformLocation(this.program, 'u_angle');
        this.gl.uniform1f(angleLocation, this.angle);
  
        // Bind Buffer and Draw
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
        const positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
  
        this.gl.drawArrays(this.gl.POINTS, 0, 5);
  
        requestAnimationFrame(draw);
      };
  
      draw();
    }
  
    Stop() {
      this.isAnimating = false;
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);  // Clear the canvas
    }
  }
  