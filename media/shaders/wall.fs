precision highp float;

varying vec2 v_texcoord; 
varying vec3 v_color;

uniform sampler2D u_texture;
uniform sampler2D u_detail_texture; 

void main(void) {
    vec4 detail_texture = texture2D(u_texture, vec2(v_texcoord.s * 32.0, v_texcoord.t * 32.0));
    vec4 base_texture = texture2D(u_detail_texture, vec2(v_texcoord.s, v_texcoord.t));

    gl_FragColor = vec4(
      v_color[0] * base_texture.x ,//* detail_texture.x),
      v_color[1] * base_texture.y ,//* detail_texture.y),
      v_color[2] * base_texture.z ,//* detail_texture.z),
      base_texture.w);

}
