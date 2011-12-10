attribute vec3 a_position;
uniform mat4 u_model_matrix;
uniform mat4 u_projection_matrix;
varying vec2 v_texcoord;

void main(void) {
    gl_Position  = u_projection_matrix * u_model_matrix * vec4(a_position, 1.0);
    v_texcoord = a_position.xy;
}

