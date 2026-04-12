/* Shader 3 — Hypnotic radial tunnel
   Spiral arms + pulsing rings + rotating spokes converge toward centre. */

precision highp float;

uniform float iTime;
uniform vec2  iResolution;

void main() {
    // centre, aspect-corrected
    vec2 uv = (gl_FragCoord.xy * 2.0 - iResolution.xy)
              / min(iResolution.x, iResolution.y);
    float t = iTime;

    float angle  = atan(uv.y, uv.x);           // -π … +π
    float radius = length(uv);

    // rotating spiral arms
    float spiral = sin(angle * 5.0 - radius * 7.0  + t * 2.5);
    // pulsing concentric rings
    float rings  = sin(radius * 13.0 - t * 4.2);
    // radial spokes that slowly rotate
    float spokes = sin(angle * 9.0 + t * 1.3) * 0.55;

    float pattern = (spiral + rings + spokes) / 3.0;

    // 3-colour palette mix
    vec3 colA = vec3(0.75, 0.10, 1.00);   // violet
    vec3 colB = vec3(0.00, 0.95, 0.80);   // cyan-green
    vec3 colC = vec3(1.00, 0.40, 0.00);   // amber

    float p1 = 0.5 + 0.5 * sin(pattern * 3.14159 + t * 0.65);
    float p2 = 0.5 + 0.5 * cos(pattern * 2.71828 + t * 0.48 + 1.0);

    vec3 col = mix(mix(colA, colB, p1), colC, p2);

    // bright centre, dark edges (tunnel illusion)
    col *= 1.15 / (0.25 + radius * 0.85);
    col  = clamp(col, 0.0, 1.0);

    gl_FragColor = vec4(col, 1.0);
}
