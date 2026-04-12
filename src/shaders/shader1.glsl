/* Shader 1 — Plasma / trippy colour waves
   Classic palette-cycle plasma using layered sine waves. */

precision highp float;

uniform float iTime;
uniform vec2  iResolution;

void main() {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    float t  = iTime * 0.55;

    float px = uv.x * 8.0;
    float py = uv.y * 8.0;

    // four overlapping wave sources
    float v  = sin(px + t);
    v += sin(py + t * 1.15);
    v += sin(px * 0.6 + py * 0.6 + t * 0.8);
    v += sin(sqrt((px - 4.0) * (px - 4.0) + (py - 4.0) * (py - 4.0)) + t);
    v /= 4.0;

    // map to RGB using 120° phase-shifted palette
    float r = 0.5 + 0.5 * sin(v * 3.14159 + t);
    float g = 0.5 + 0.5 * sin(v * 3.14159 + t + 2.094);
    float b = 0.5 + 0.5 * sin(v * 3.14159 + t + 4.189);

    gl_FragColor = vec4(r, g, b, 1.0);
}
