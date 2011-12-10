precision highp float;

varying vec2 v_texcoord; 
uniform sampler2D u_texture;

void main(void) {
    vec4 base_texture = texture2D(u_texture, vec2(v_texcoord.s, v_texcoord.t));

    gl_FragColor = vec4(
      base_texture.x,
      base_texture.y,
      base_texture.z,
      base_texture.w
    );
}

