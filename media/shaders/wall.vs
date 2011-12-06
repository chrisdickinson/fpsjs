attribute vec3 a_position;
attribute vec2 a_texcoord;
attribute vec3 a_normal;

uniform vec3 u_color;
uniform mat4 u_model_matrix;
uniform mat4 u_projection_matrix;

varying vec2 v_texcoord;
varying vec3 v_color;

void main(void) {
    gl_Position  = u_projection_matrix * u_model_matrix * vec4(a_position, 1.0);
    v_texcoord = a_texcoord;
    v_color = u_color;
}
