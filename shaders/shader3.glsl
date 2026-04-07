// ── Shader 3 : Radial Hypnotic Spiral ───────────────────────────
// Layered rings × spokes × spiral pattern with mouse-reactive
// centre and a soft vignette bloom.
// Uniforms: iTime (float), iResolution (vec2), iMouse (vec2)

precision mediump float;
uniform float iTime;
uniform vec2  iResolution;
uniform vec2  iMouse;

#define PI  3.14159265359
#define TAU 6.28318530718

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * iResolution)
             / min(iResolution.x, iResolution.y);

  // mild mouse influence on spiral centre
  uv += (iMouse / iResolution - 0.5) * 0.15;

  float r = length(uv);
  float a = atan(uv.y, uv.x);
  float t = iTime;

  // Layered hypnotic pattern
  float rings  = sin(r  * 34.0 - t * 4.8);
  float spokes = sin(a  *  8.0 + t * 1.9);
  float spiral = sin(r  * 16.0 + a * 5.0 - t * 3.3);
  float pulse  = sin(r  *  6.0           - t * 2.0);   // outer pulse ring

  float p = rings * spokes * spiral + pulse * 0.25;

  // RGB channels phase-shifted by 120°
  vec3 col;
  col.r = 0.5 + 0.5 * sin(p * PI + t * 1.10);
  col.g = 0.5 + 0.5 * sin(p * PI + t * 1.10 + TAU / 3.0);
  col.b = 0.5 + 0.5 * sin(p * PI + t * 1.10 + TAU * 2.0 / 3.0);

  // Vignette (darken edges)
  col *= 1.0 - smoothstep(0.38, 0.80, r);

  // Central colour bloom
  col += vec3(0.10, 0.04, 0.20) * (1.0 - smoothstep(0.0, 0.30, r));

  gl_FragColor = vec4(col, 1.0);
}
