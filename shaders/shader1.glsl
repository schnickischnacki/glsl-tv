// ── Shader 1 : Trippy Colour Waves ──────────────────────────────
// Animated sin/cos colour field with mouse parallax.
// Uniforms: iTime (float), iResolution (vec2), iMouse (vec2)

precision mediump float;
uniform float iTime;
uniform vec2  iResolution;
uniform vec2  iMouse;

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution;
  uv -= 0.5;
  uv.x *= iResolution.x / iResolution.y;

  // subtle mouse parallax
  vec2 m = (iMouse / iResolution - 0.5) * 0.25;
  uv += m;

  float t   = iTime;
  vec3  col = vec3(0.0);

  for (float i = 1.0; i <= 7.0; i++) {
    float f = i * 2.9;
    col.r += 0.5 + 0.5 * sin( uv.x * f              + t * i * 0.38);
    col.g += 0.5 + 0.5 * sin( uv.y * f * 1.15        + t * i * 0.29 + 2.094);
    col.b += 0.5 + 0.5 * cos( length(uv) * f * 1.3   - t * i * 0.47 + 4.189);
  }
  col /= 7.0;

  // punchy gamma
  col = pow(col, vec3(0.82));

  gl_FragColor = vec4(col, 1.0);
}
