/* =================================================================
   Hello World – WebGL Retro TV  |  main.js
   ================================================================= */

'use strict';

// ─────────────────────────────────────────────────────────────────
// GLSL Sources (inline so the page works without a server via CORS)
// ─────────────────────────────────────────────────────────────────

const VERT_SRC = /* glsl */`
  attribute vec2 a_pos;
  void main() {
    gl_Position = vec4(a_pos, 0.0, 1.0);
  }
`;

/* ── Shader 0 : Trippy colour waves (sin/cos based) ───────────── */
const FRAG_0 = /* glsl */`
  precision mediump float;
  uniform float iTime;
  uniform vec2  iResolution;
  uniform vec2  iMouse;

  void main() {
    vec2 uv = gl_FragCoord.xy / iResolution;
    uv -= 0.5;
    uv.x *= iResolution.x / iResolution.y;

    /* subtle mouse parallax */
    vec2 m = (iMouse / iResolution - 0.5) * 0.25;
    uv += m;

    float t  = iTime;
    vec3  col = vec3(0.0);

    for (float i = 1.0; i <= 7.0; i++) {
      float f = i * 2.9;
      col.r += 0.5 + 0.5 * sin( uv.x * f              + t * i * 0.38);
      col.g += 0.5 + 0.5 * sin( uv.y * f * 1.15        + t * i * 0.29 + 2.094);
      col.b += 0.5 + 0.5 * cos( length(uv) * f * 1.3   - t * i * 0.47 + 4.189);
    }
    col /= 7.0;

    /* punchy gamma */
    col = pow(col, vec3(0.82));

    gl_FragColor = vec4(col, 1.0);
  }
`;

/* ── Shader 1 : Psychedelic noise (domain-warped fBm) ─────────── */
const FRAG_1 = /* glsl */`
  precision mediump float;
  uniform float iTime;
  uniform vec2  iResolution;
  uniform vec2  iMouse;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i),              hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 6; i++) {
      v += a * vnoise(p);
      p  = p * 2.13 + vec2(1.7, 9.2);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / iResolution;
    float t  = iTime * 0.22;

    /* two-level domain warp */
    vec2 q = vec2(
      fbm(uv + t),
      fbm(uv + vec2(1.3, 0.0))
    );
    vec2 r = vec2(
      fbm(uv + 4.0 * q + vec2(1.7, 9.2)  + 0.15 * t),
      fbm(uv + 4.0 * q + vec2(8.3, 2.8)  + 0.13 * t)
    );
    float f = fbm(uv + 4.0 * r);

    /* colour gradient */
    vec3 col = mix(
      mix(vec3(0.08, 0.00, 0.42), vec3(0.85, 0.10, 0.75),
          clamp(f * f * 4.0, 0.0, 1.0)),
      mix(vec3(1.00, 0.60, 0.05), vec3(0.05, 0.85, 0.90),
          clamp(length(q), 0.0, 1.0)),
      clamp(f * 2.5, 0.0, 1.0)
    );

    col = pow(col, vec3(0.82));
    gl_FragColor = vec4(col, 1.0);
  }
`;

/* ── Shader 2 : Radial hypnotic spiral ────────────────────────── */
const FRAG_2 = /* glsl */`
  precision mediump float;
  uniform float iTime;
  uniform vec2  iResolution;
  uniform vec2  iMouse;

  #define PI  3.14159265359
  #define TAU 6.28318530718

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * iResolution)
               / min(iResolution.x, iResolution.y);

    /* mild mouse influence on spiral centre */
    uv += (iMouse / iResolution - 0.5) * 0.15;

    float r = length(uv);
    float a = atan(uv.y, uv.x);
    float t = iTime;

    /* layered hypnotic pattern */
    float rings  = sin(r  * 34.0 - t * 4.8);
    float spokes = sin(a  *  8.0 + t * 1.9);
    float spiral = sin(r  * 16.0 + a * 5.0 - t * 3.3);
    float pulse  = sin(r  *  6.0           - t * 2.0); /* outer pulse */

    float p = rings * spokes * spiral + pulse * 0.25;

    /* RGB phase-shifted */
    vec3 col;
    col.r = 0.5 + 0.5 * sin(p * PI + t * 1.10);
    col.g = 0.5 + 0.5 * sin(p * PI + t * 1.10 + TAU / 3.0);
    col.b = 0.5 + 0.5 * sin(p * PI + t * 1.10 + TAU * 2.0 / 3.0);

    /* vignette */
    col *= 1.0 - smoothstep(0.38, 0.80, r);

    /* central colour bloom */
    col += vec3(0.10, 0.04, 0.20) * (1.0 - smoothstep(0.0, 0.30, r));

    gl_FragColor = vec4(col, 1.0);
  }
`;

// ─────────────────────────────────────────────────────────────────
// WebGL bootstrap
// ─────────────────────────────────────────────────────────────────

const canvas = document.getElementById('gl');
const gl = canvas.getContext('webgl') ||
           canvas.getContext('experimental-webgl');

if (!gl) {
  document.querySelector('.tv-screen').textContent = 'WebGL not supported 😢';
}

/* ── Compile helpers ─── */
function compileShader(type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const err = gl.getShaderInfoLog(s);
    gl.deleteShader(s);
    throw new Error('Shader compile error:\n' + err);
  }
  return s;
}

function linkProgram(vertSrc, fragSrc) {
  const prog = gl.createProgram();
  gl.attachShader(prog, compileShader(gl.VERTEX_SHADER,   vertSrc));
  gl.attachShader(prog, compileShader(gl.FRAGMENT_SHADER, fragSrc));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error('Program link error:\n' + gl.getProgramInfoLog(prog));
  }
  return prog;
}

/* ── Build all 3 programs + cache uniform locations ─── */
const FRAG_SRCS = [FRAG_0, FRAG_1, FRAG_2];

const programs = FRAG_SRCS.map(frag => {
  const prog = linkProgram(VERT_SRC, frag);
  return {
    prog,
    u_iTime:       gl.getUniformLocation(prog, 'iTime'),
    u_iResolution: gl.getUniformLocation(prog, 'iResolution'),
    u_iMouse:      gl.getUniformLocation(prog, 'iMouse'),
    a_pos:         gl.getAttribLocation (prog, 'a_pos'),
  };
});

/* ── Full-screen quad buffer ─── */
const quadBuf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
gl.bufferData(gl.ARRAY_BUFFER,
  new Float32Array([-1, -1,  1, -1,  -1,  1,  1,  1]),
  gl.STATIC_DRAW);

/* ── Canvas / DPR resize ─── */
const DPR = window.devicePixelRatio || 1;

function resizeCanvas() {
  const w = Math.round(canvas.clientWidth  * DPR);
  const h = Math.round(canvas.clientHeight * DPR);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width  = w;
    canvas.height = h;
  }
  gl.viewport(0, 0, canvas.width, canvas.height);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ─────────────────────────────────────────────────────────────────
// Render loop
// ─────────────────────────────────────────────────────────────────

let activeShader = 0;
const t0 = performance.now();

let mouseX = 0, mouseY = 0;
document.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });

function render() {
  resizeCanvas();

  const { prog, u_iTime, u_iResolution, u_iMouse, a_pos } = programs[activeShader];

  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
  gl.enableVertexAttribArray(a_pos);
  gl.vertexAttribPointer(a_pos, 2, gl.FLOAT, false, 0, 0);

  const t = (performance.now() - t0) / 1000;
  gl.uniform1f(u_iTime, t);
  gl.uniform2f(u_iResolution, canvas.width, canvas.height);
  gl.uniform2f(u_iMouse, mouseX * DPR, mouseY * DPR);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  requestAnimationFrame(render);
}
requestAnimationFrame(render);

// ─────────────────────────────────────────────────────────────────
// Button shader switching
// ─────────────────────────────────────────────────────────────────

document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeShader = Number(btn.dataset.shader);
  });
});

// ─────────────────────────────────────────────────────────────────
// Title hover – stretchy "e" marquee
// ─────────────────────────────────────────────────────────────────

(function () {
  const wrap  = document.querySelector('.title-wrap');
  const title = document.getElementById('title');

  let growTimer  = null;
  let scrollRaf  = null;
  let eCount     = 0;
  let xOff       = 0;          // current left position (px)
  let isHovering = false;

  function buildText() {
    return 'H' + 'e'.repeat(Math.max(eCount, 1)) + 'llo World';
  }

  /* Scrolls text to the RIGHT; loops when it exits the right edge */
  function scrollStep() {
    xOff += 2.8;                               // flow rightward

    const tw = title.scrollWidth;              // text pixel width
    const ww = wrap.clientWidth;              // container width

    /* Once the trailing edge of the text has passed the right side,
       jump the text back so its leading edge starts just off the left */
    if (xOff - (ww / 2 - tw / 2) > tw + ww * 0.2) {
      // reset to just off the left edge
      xOff = -(tw + ww * 0.2) + (ww / 2 - tw / 2);
    }

    title.style.left      = xOff + 'px';
    title.style.transform = 'none';

    if (isHovering) scrollRaf = requestAnimationFrame(scrollStep);
  }

  wrap.addEventListener('mouseenter', () => {
    isHovering = true;
    eCount = 0;

    /* start from centred position */
    xOff = (wrap.clientWidth / 2) - (title.offsetWidth / 2);

    /* grow the "e"s */
    growTimer = setInterval(() => {
      eCount += 5;
      title.textContent = buildText();
    }, 72);

    scrollRaf = requestAnimationFrame(scrollStep);
  });

  wrap.addEventListener('mouseleave', () => {
    isHovering = false;
    clearInterval(growTimer);
    cancelAnimationFrame(scrollRaf);
    growTimer = scrollRaf = null;
    eCount = 0;

    /* snap back to centre */
    title.textContent     = 'Hello World';
    title.style.left      = '50%';
    title.style.transform = 'translateX(-50%)';
  });
})();
