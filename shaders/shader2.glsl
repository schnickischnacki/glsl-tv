// ── Shader 2 : Psychedelic Noise (domain-warped fBm) ────────────
// Two-level domain-warped fractal Brownian motion mapped to vivid
// purple/orange/teal gradients.
// Uniforms: iTime (float), iResolution (vec2), iMouse (vec2)

precision mediump float;
uniform float iTime;
uniform vec2  iResolution;
uniform vec2  iMouse;

// ── Hash & value noise ────────────────────────────────────────
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);              // smoothstep
  return mix(
    mix(hash(i),               hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

// ── Fractal Brownian Motion ───────────────────────────────────
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

  // First warp layer
  vec2 q = vec2(
    fbm(uv + t),
    fbm(uv + vec2(1.3, 0.0))
  );

  // Second warp layer
  vec2 r = vec2(
    fbm(uv + 4.0 * q + vec2(1.7, 9.2)  + 0.15 * t),
    fbm(uv + 4.0 * q + vec2(8.3, 2.8)  + 0.13 * t)
  );

  float f = fbm(uv + 4.0 * r);

  // Map to colour gradient
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
