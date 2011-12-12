#ifdef GL_ES
precision mediump float;
#endif

uniform vec4      overlay;
uniform sampler2D texture;
uniform vec2      resolution;

void main() {
  vec2 uv = gl_FragCoord.xy/resolution.xy;
  vec4 base_color = texture2D(texture, uv);

  gl_FragColor = overlay + base_color;
}
