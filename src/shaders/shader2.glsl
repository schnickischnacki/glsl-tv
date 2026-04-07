/* Shader 2 — Domain-warped FBM noise (psychedelic texture)
   Ported / inspired by Inigo Quilez's domain-warping technique. */

precision highp float;

uniform float iTime;
uniform vec2  iResolution;

// ── noise primitives ─────────────────────────────────────────────────────────

float hash(vec2 p) {
    p  = fract(p * vec2(127.1, 311.7));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);           // smoothstep

    return mix(
        mix(hash(i),               hash(i + vec2(1.0, 0.0)), f.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
        f.y
    );
}

float fbm(vec2 p) {
    float val = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 6; i++) {
        val += amp * valueNoise(p);
        p   *= 2.0;
        amp *= 0.5;
    }
    return val;
}

// ── main ─────────────────────────────────────────────────────────────────────

void main() {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    float t  = iTime * 0.22;

    // two levels of domain warping
    vec2 q = vec2(
        fbm(uv            + t),
        fbm(uv + vec2(5.2, 1.3) + t * 0.85)
    );
    vec2 r = vec2(
        fbm(uv + 4.0 * q + vec2(1.7,  9.2) + t * 0.3),
        fbm(uv + 4.0 * q + vec2(8.3,  2.8) + t * 0.4)
    );

    float f = fbm(uv + 4.0 * r);

    vec3 purple = vec3(0.12, 0.02, 0.35);
    vec3 pink   = vec3(0.95, 0.15, 0.80);
    vec3 cyan   = vec3(0.00, 0.90, 0.75);
    vec3 orange = vec3(1.00, 0.45, 0.00);

    vec3 col = mix(purple, pink,   clamp(f * 2.0,        0.0, 1.0));
    col      = mix(col,    cyan,   clamp(f * f * 3.5,    0.0, 1.0));
    col      = mix(col,    orange, clamp(length(q) * 0.9, 0.0, 1.0));

    gl_FragColor = vec4(col, 1.0);
}
