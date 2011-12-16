# A brief aside on shaders

So, in the [last article](#rendering), we drew a triangle to the screen. To do so, we defined
an array of vertices and sent them to the graphics card, and we defined an enigmatic little
function that would send a shader program to the graphics card:
 
    // create a shader program (a strategy for
    // rendering OpenGL primitives) and send it
    // to the OpenGL server.
    function init_program() {

        // create a handle for the program (which is comprised of a vertex and fragment shader),
        // and handles for the vertex and fragment shaders. 
        var program = gl.createProgram()
          , vertex_shader = gl.createShader(gl.VERTEX_SHADER)
          , fragment_shader = gl.createShader(gl.FRAGMENT_SHADER)

        // send OpenGL the source code of our shaders.
        gl.shaderSource(vertex_shader, 
            'attribute vec3 position;\nvoid main() { gl_Position = vec4( position, 1.0 ); }')
        gl.shaderSource(fragment_shader, 
            'void main() { gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); }')

        // ...and tell OpenGL to compile them.
        gl.compileShader(vertex_shader)
        gl.compileShader(fragment_shader)

        // attach both compiled shaders to the shader program.
        gl.attachShader(program, vertex_shader)
        gl.attachShader(program, fragment_shader)

        // link it, so we have a complete program!
        gl.linkProgram(program)
        return program
    }

A high level read of the code yields us the following procedure:

* Create a program object.
* Create a vertex shader.
* Send our vertex shader source code to the graphics card.
* Compile it.
* Create a fragment shader.
* Send our fragment shader source code to the graphics card.
* Compile it.
* Attach the fragment and vertex shaders to the program.
* Tell the program to link.

Cool. It sounds remarkably similar to compiling and linking C programs, actually:

    cat > greeting.h <<EOF
        #ifndef GREETING_H
        #define GREETING_H

            int say_hi(char* arg);

        #endif
    EOF
    cat > main.c <<EOF
        #include "greeting.h"

        int main(int argc, char** argv) {
            say_hi(argv[argc-1]);
            return 0;
        }
    EOF
    cat > greeting.c <<EOF
        #include "greeting.h"
        #include <stdio.h>

        int say_hi(char* arg) {
            printf("hello %s\n", arg);
        }
    EOF
    
    gcc main.c greeting.c -o greeting
    ./greeting world
    # hello world

That last line -- `gcc main.c greeting.c -o greeting_program` actually takes our two files,
compiles them into "object files", and then links those object files to produce the 
complete program "greeting".

It's important to note what's going on here: there are two files that share knowledge of a single function,
`say_hi`. Only one has the actual definition of `say_hi`, the other just calls it and relies on the linking
process to complete the program.

So from this we can surmise that shader programs must be sharing some kind of state: otherwise there'd
really be no reason to link them. Further, they come in two "kinds" of source program -- fragment and
vertex -- that must be linked. Okay, cool.


> ### Nota bene:
> For the rest of the article, we'll
> be using the source code from the [previous article](#rendering),
> and only manipulating the shader source code (the two calls to 
> `gl.shaderSource` in `init_program`). 

**So what state are we sharing between the vertex and fragment shader?**

When we link the vertex and fragment shaders into a complete shader program, we're actually defining
two important (and interrelated) parts of OpenGL's **rendering pipeline**. 

*Wait, what?* Okay, let's put ourselves in the shoes of OpenGL in our program. We've just received
a draw call. What do we see?

        gl.drawArrays(gl.TRIANGLES, 0, num_vertices)

Okay, we know we're supposed to be drawing `TRIANGLES`. We know that to draw a triangle, we need 3
vertices, one for each corner of the triangle. We also know that when we get data, we're supposed
to start slicing it into triangles starting at the first element (`0` above), and we'll be receiving
`num_vertices` vertices. We'll do our best to turn that data into triangles.

Where's that data coming from, though?

        // enable the first stream of vertex data:
        gl.enableVertexAttribArray(0)
        gl.drawArrays(gl.TRIANGLES, 0, num_vertices)

Oh, we've enabled a `vertexAttribArray` at location 0! Okay. so we should expect one stream of data coming
in, on the first channel. Okay. What data are we talking about?

        // use data from the following buffer:
        gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer)
        gl.enableVertexAttribArray(0)
        gl.drawArrays(gl.TRIANGLES, 0, num_vertices)

What does a vertex look like, though? Remember, that buffer just contains a flat array of numbers. Is it a
stream of `x`, `y` values as integers? Or is it `x`, `y`, `z` coordinates in floating point? Oh, woe betide
that vain, capricious client, telling us to draw triangles without even telling us what her vertex data
looks like!

Waitaminute.

        gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer)
        // the vertices in `vertex_buffer` look like this:
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(0)
        gl.drawArrays(gl.TRIANGLES, 0, num_vertices)

> A note: the buffer data looks like this:
> `[x, y, z, x, y, z, x, y, z]`.
> We could potentially have a buffer with extra data
> between vertices, e.g.  `[x, y, z, LOL, ROFL, x, y, z, LOL, ROFL]`.

Oh! The vertex data at stream `0` is `3` `FLOAT` elements wide. It's already in floating point format -- we don't
need to convert them into floats ourselves (the `false` above). There are `0` elements in the array data between
vertices, and the data in the buffer starts at the `0`th index. **OK!** Let's get drawing. 

Wait, hold up.

We're making a two dimensional drawing of these triangles, right? How does the client want us to take
his three dimensional vertexes and turn them into two dimensional positions on the screen?

Furthermore, after we know how the client wants us to project those vertices onto the screen, and we're starting to draw
pixels, what does the client actually want us to put in those pixels? I mean, we'll know we're supposed to draw into 
these pixels, but what goes in 'em?

**Oh.**

        // use this program to transform the vertices into screen space,
        // and to determine the RGBA value of the pixels that need drawn.
        gl.useProgram(program)
        gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer)
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(0)
        gl.drawArrays(gl.TRIANGLES, 0, num_vertices)

So we'll use the shader program we defined in `init_program` in the last lesson to determine how to transform incoming
vertices onto the screen, and how to determine a color value for pixels that need to be rendered. What does our
vertex shader look like right now?

    attribute vec3 position;

    void main() {
        gl_Position = vec4(position, 1.0);
    }

<canvas id="normal" class="imgright" style="background:#CCC">
<script type="text/javascript">

    (function(){
    var canvas = document.getElementById('normal')
      , gl = canvas.getContext('experimental-webgl')

    // here's our vertex data.
    var vertices = [
         -0.5, -0.5, 0
      ,   0.0,  0.5, 0
      ,   0.5, -0.5, 0
    ]

    // create a shader program -- a strategy for
    // rendering OpenGL primitives -- and send it
    // to the OpenGL server.
    function init_program() {
        var program = gl.createProgram()
          , vertex_shader = gl.createShader(gl.VERTEX_SHADER)
          , fragment_shader = gl.createShader(gl.FRAGMENT_SHADER)

        gl.shaderSource(vertex_shader, 'attribute vec3 position;\nvoid main() { gl_Position = vec4( position, 1.0 ); }')
        gl.shaderSource(fragment_shader, 'void main() { gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); }')
        gl.compileShader(vertex_shader)
        gl.compileShader(fragment_shader)

        gl.attachShader(program, vertex_shader)
        gl.attachShader(program, fragment_shader)
        gl.linkProgram(program)
        return program
    }

    // send our vertex data to the OpenGL server.
    function init_vertex() {
        var buffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)
        return buffer
    }

    function draw(program, vertex) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        // tell OpenGL to use our shader program
        gl.useProgram(program)

        // tell OpenGL that we're talking about the
        // vertexes we sent it earlier.
        gl.bindBuffer(gl.ARRAY_BUFFER, vertex)
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(0)

        // issue a draw command to OpenGL.
        gl.drawArrays(gl.TRIANGLES, 0, vertices.length/3)
    }

    var program = init_program()
      , vertex = init_vertex()

    // set the background color, RGBA (from 0.0 to 1.0).
    gl.clearColor(0, 0, 0, 1.0)
    draw(program, vertex)

    })()
</script>

There's only one "attribute" of the incoming data that we're worried about -- `position`. We want to hand it back
to OpenGL directly because we're just drawing 2D graphics, hence the `gl_Position = vec4(position, 1.0);`. Pretty simple.

**Let's mess with it.**

What happens when we scale that position by `0.5`?

<canvas id="scaled" class="imgright" style="background:#CCC">
<script type="text/javascript">

    (function(){
    var canvas = document.getElementById('scaled')
      , gl = canvas.getContext('experimental-webgl')

    // here's our vertex data.
    var vertices = [
         -0.5, -0.5, 0
      ,   0.0,  0.5, 0
      ,   0.5, -0.5, 0
    ]

    // create a shader program -- a strategy for
    // rendering OpenGL primitives -- and send it
    // to the OpenGL server.
    function init_program() {
        var program = gl.createProgram()
          , vertex_shader = gl.createShader(gl.VERTEX_SHADER)
          , fragment_shader = gl.createShader(gl.FRAGMENT_SHADER)

        gl.shaderSource(vertex_shader, 'attribute vec3 position;\nvoid main() { gl_Position = vec4( position*0.5, 1.0 ); }')
        gl.shaderSource(fragment_shader, 'void main() { gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); }')
        gl.compileShader(vertex_shader)
        gl.compileShader(fragment_shader)

        gl.attachShader(program, vertex_shader)
        gl.attachShader(program, fragment_shader)
        gl.linkProgram(program)
        return program
    }

    // send our vertex data to the OpenGL server.
    function init_vertex() {
        var buffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)
        return buffer
    }

    function draw(program, vertex) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        // tell OpenGL to use our shader program
        gl.useProgram(program)

        // tell OpenGL that we're talking about the
        // vertexes we sent it earlier.
        gl.bindBuffer(gl.ARRAY_BUFFER, vertex)
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(0)

        // issue a draw command to OpenGL.
        gl.drawArrays(gl.TRIANGLES, 0, vertices.length/3)
    }

    var program = init_program()
      , vertex = init_vertex()

    // set the background color, RGBA (from 0.0 to 1.0).
    gl.clearColor(0, 0, 0, 1.0)
    draw(program, vertex)

    })()
</script>

Oh, the triangle got smaller. Awesome. 
