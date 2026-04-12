import './style.css';
import shader0Src from './shaders/shader1.glsl?raw';
import shader1Src from './shaders/shader2.glsl?raw';
import shader2Src from './shaders/shader3.glsl?raw';

// ── WebGL helpers ─────────────────────────────────────────────────────────────

const VS = `
  attribute vec2 a_pos;
  void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

function compileShader(gl, src, type) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error('Shader error:', gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

function buildProgram(gl, fsSrc) {
  const vs = compileShader(gl, VS, gl.VERTEX_SHADER);
  const fs = compileShader(gl, fsSrc, gl.FRAGMENT_SHADER);
  if (!vs || !fs) return null;

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('Link error:', gl.getProgramInfoLog(prog));
    return null;
  }
  return prog;
}

// ── Renderer ──────────────────────────────────────────────────────────────────

class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) throw new Error('WebGL not supported');
    this.gl = gl;

    // full-screen quad (triangle strip)
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    this.quadBuf = buf;

    this.programs = [];
    this.activeIdx = 0;
    this.epoch = performance.now();

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  loadShaders(sources) {
    this.programs = sources.map(src => buildProgram(this.gl, src));
  }

  switchTo(idx) {
    this.activeIdx = idx;
    this.epoch = performance.now(); // reset iTime so each shader starts fresh
  }

  resize() {
    const dpr  = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width  = Math.round(rect.width  * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  draw() {
    const { gl } = this;
    const prog = this.programs[this.activeIdx];
    if (!prog) return;

    gl.useProgram(prog);

    const posLoc = gl.getAttribLocation(prog, 'a_pos');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuf);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    gl.uniform1f(
      gl.getUniformLocation(prog, 'iTime'),
      (performance.now() - this.epoch) / 1000
    );
    gl.uniform2f(
      gl.getUniformLocation(prog, 'iResolution'),
      gl.drawingBufferWidth,
      gl.drawingBufferHeight
    );

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  start() {
    const loop = () => { this.draw(); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }
}

// ── Title hover ───────────────────────────────────────────────────────────────

function setupTitle() {
  const el = document.getElementById('title');
  let timer = null;
  let eCount = 1;
  const MAX_E = 24;

  const grow = () => {
    if (eCount < MAX_E) {
      eCount++;
      el.textContent = 'H' + 'e'.repeat(eCount) + 'llo World';
    }
    timer = setTimeout(grow, 32);
  };

  el.addEventListener('mouseenter', () => {
    el.classList.add('stretching');
    grow();
  });

  el.addEventListener('mouseleave', () => {
    clearTimeout(timer);
    el.classList.remove('stretching');
    eCount = 1;
    el.textContent = 'Hello World';
  });
}

// ── Boot ──────────────────────────────────────────────────────────────────────

const canvas   = document.getElementById('glCanvas');
const renderer = new Renderer(canvas);
renderer.loadShaders([shader0Src, shader1Src, shader2Src]);
renderer.start();

document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const idx = parseInt(btn.dataset.shader, 10);
    document.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // brief fade-out → swap → fade-in
    canvas.style.opacity = '0';
    setTimeout(() => {
      renderer.switchTo(idx);
      canvas.style.opacity = '1';
    }, 160);
  });
});

setupTitle();
