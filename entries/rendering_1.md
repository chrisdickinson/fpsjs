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

At a high level, we're performing the following steps:

* Create a vertex shader and compile it.
* Create a fragment shader and compile it.
* Attach the vertex and fragment shaders to a program object.
* Link the program. 

That process is remarkably similar to compiling C programs:

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

The line, `gcc main.c greeting.c -o greeting_program`, actually takes our two source files `greeting.c` and `main.c`,
compiles them into object files, and then links those object files to produce the 
complete program "greeting".

It's important to note what's going on here: there are two files that share knowledge of a single function,
`say_hi`. Only one has the actual definition of `say_hi`, the other just calls it and relies on the linking
process to complete the program. The two object files rely on each other to create a complete representation
of the program. By themselves, they are incomplete until they are linked.

Similarly, the vertex and fragment shaders rely on one another to build the context necessary to create a
complete shader program: in other words, we must compile them separately, and then explictly link them to
produce a program object.

**The Program Object**

When we link the vertex and fragment shaders into a complete shader program, we're actually defining
two important (and interrelated) parts of OpenGL's **rendering pipeline**. 

To explain what that means, we'll walk backwards from the `gl.drawArrays` call from the last article.

        gl.drawArrays(gl.TRIANGLES, 0, num_vertices)

The above line tells OpenGL to draw a series of triangles. It further specifies that we should start
at the first vertex given to us, and continue until we receive `num_vertices`. To draw a triangle, 
OpenGL requires 3 vertices, one for each corner of the triangle to be drawn. 

        // enable the first stream of vertex data:
        gl.enableVertexAttribArray(0)
        gl.drawArrays(gl.TRIANGLES, 0, num_vertices)

Importantly, when we're sending vertices to OpenGL to draw, we must describe that data in terms of
"attributes". In this simple case, our vertex data only has one attribute: position. To tell OpenGL
that we're only sending one attribute per vertex, we call `gl.enableVertexAttribArray` with `0`.

Note that at this point, we still haven't told OpenGL about what our position attribute looks like.
For example, are we sending it `[x, y]` coordinates? Or `[x, y, z]` coordinates? Are these coordinates
floating point, or are they integers? All OpenGL knows is that it will be receiving a stream of vertices
with a single attribute.

        // the vertices in `vertex_buffer` look like this:
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(0)
        gl.drawArrays(gl.TRIANGLES, 0, num_vertices)

The `gl.vertexAttribPointer` command describes a particular attribute of the vertex data that we're sending
to OpenGL. The first argument is the location of the attribute you wish to define -- `0`, in this case. The second
argument defines the width of this attribute -- our coordinate data is in `x, y, z` format, so our width will
be `3`. The data we are sending is floating point; hence the third argument, `gl.FLOAT`. If we were to send integer
data, we could request that it be normalized to a `[-1.0, 1.0]` range in the next arguments. Since we don't
need that, we send `false`. 

> A note: our vertex data looks like this:
> `[x, y, z, x, y, z, x, y, z]`.
> We could potentially interleave our position data with other data:
> `[x, y, z, LOL, ROFL, x, y, z, LOL, ROFL]`.

The final two arguments define the `stride` and `offset` of our data. `stride` tells OpenGL how many elements
to skip between sets of attributes -- if we were to interleave our data with `[LOL, ROFL]` after each `[x, y, z]`
element, our `stride` would be `2 * sizeof(float)` -- meaning, "after each set of this attribute, skip two float elements." 

Conversely, if we were defining the `LOL, ROFL` attribute, we would set our stride to `3 * sizeof(float)` -- to skip the `x, y, z` elements.
Also, were we to be defining a `LOL, ROFL` attribute in that manner, we would have to set our `offset` -- that is,
the offset of the first attribute we would like to read out of our buffer -- in this case, we would set it
to `3 * sizeof(float)` -- meaning "skip the first three float elements when you start reading out of the buffer."

Since we're just sending `x, y, z` data with no interleaved attributes, we can simply pass `0` for both the `stride`
and `offset`.

        // in all subsequent commands, tell GL that we're talking about the data
        // contained in `vertex_buffer`.
        gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer)
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(0)
        gl.drawArrays(gl.TRIANGLES, 0, num_vertices)

The `bindBuffer` command tells OpenGL that we're currently drawing data from the `vertex_buffer`. This command actually
tells `vertexAttribPointer` what data it is pointing at. With these four commands, OpenGL has all of the information it
needs to **grab vertex data**, as well as how to **slice that data into attributes**.

However, OpenGL still does not have enough information to actually perform the draw command. Note that in all of the previous
operations, we never told OpenGL what our attribute data actually means -- the whole `x, y, z` thing is entirely a client-side
interpretation of our buffer data at this point. OpenGL just knows that they're tightly packed sets of three floats in a row,
and that we'd like to draw triangles with them. In particular, it doesn't know what it needs to do to turn those `x, y, z`
values into screen-space `x, y` values (remember, we're drawing to a two dimensional screen!). Further, even if it was able
to divine our intention and somehow automatically project those `x, y, z` coordinates onto the screen, when it came time to
actually blit the triangle onto the screen, it would not know what to put into the pixels in question. Red? Green? Blue? Mauve?
We certainly haven't told it.

        // tell GL how to project our vertex information, as 
        // well as what colors to put onto the screen.
        gl.useProgram(program)
        gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer)
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(0)
        gl.drawArrays(gl.TRIANGLES, 0, num_vertices)

The call to `gl.useProgram` tells OpenGL what our intentions are, in the form of a program consisting of a vertex shader
and a fragment shader. The vertex shader tells OpenGL what we'd like to do with the various attributes of our vertex data --
how to project them onto the screen, for example -- while the fragment shader tells OpenGL what color to put into a given pixel
in that rasterized triangle.

At the moment, our vertex shader looks like this:

    attribute vec3 position;

    void main() {
        gl_Position = vec4(position, 1.0);
    }

The first line states that this program takes one vertex **attribute** -- `position` -- as a vector comprised of three floating point
values. We then define an entry point function named `main`. It doesn't return anything, but it assigns a value to a special variable
called `gl_Position`, which is the translated and projected output position of the vertex in question. `gl_Position` is defined as a vector
comprised of four floats. Since we're operating in 2D at the moment, we send our `position` attribute out with the addition of another float
to make it match the type of `gl_Position`. You may recall from the previous article that by default, OpenGL defines the screen space
by setting `-1, -1` to the bottom left of the screen, and `1, 1` to the top right of the screen.

*GLSL*, the language shaders are written in, is largely similar to C. However, it extends the type system with vector and matrix types.
A brief read of [this wiki page](http://www.opengl.org/wiki/GLSL_Types) should prove instructive; for the time being we'll only concern
ourselves with the `vec3` type.

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

To illustrate how the vertex shader affects rendering, let's change the vertex shader a bit: we'll scale our `position`
attribute out down by half. Let's see what effect it has.

    attribute vec3 position;

    void main() {
        gl_Position = vec4(position * 0.5, 1.0);
    }

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

It shrank our triangle! Neat. Next, let's look at the fragment shader:

    void main() {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    }

That's even simpler than our vertex shader. Again, it's defining an entry point function, `main`, and assigning
an RGBA value to a special, global variable named `gl_FragColor`.

In this case we're assigning "red".

I'd like to use another built-in variable, `gl_FragCoord`, which contains the screen-space position of the current
fragment, to demonstrate changing the color of a pixel given it's position on the screen.


    // GL_ES wants us to tell it how precise we'd like our floats to be.
    #ifdef GL_ES
    precision highp float;
    #endif

    void main() {
        float x = gl_FragCoord.x * 10.0;

        vec3 rgb = vec3(sin(radians(x)), sin(radians(x + 45.0)), sin(radians(x + 90.0)));

        gl_FragColor = vec4(rgb, 1.0);
    }

<canvas id="wavy" class="imgright" style="background:#CCC">
<script type="text/javascript">

    (function(){
    var canvas = document.getElementById('wavy')
      , gl = canvas.getContext('experimental-webgl')

    // here's our vertex data.
    var vertices = [
         -0.5, -0.5, 0
      ,   0.0,  0.5, 0
      ,   0.5, -0.5, 0
    ]

    var frag = [''
    ,'#ifdef GL_ES'
    ,'precision highp float;'
    ,'#endif'
    ,'void main() {'
    ,'     float x = gl_FragCoord.x * 10.0;'
    ,'     vec3 rgb = vec3(sin(radians(x)), sin(radians(x + 45.0)), sin(radians(x + 90.0)));'
    ,'     gl_FragColor = vec4(rgb, 1.0);'
    ,'  }'].join('\n')
    

    // create a shader program -- a strategy for
    // rendering OpenGL primitives -- and send it
    // to the OpenGL server.
    function init_program() {
        var program = gl.createProgram()
          , vertex_shader = gl.createShader(gl.VERTEX_SHADER)
          , fragment_shader = gl.createShader(gl.FRAGMENT_SHADER)

        gl.shaderSource(vertex_shader, 'attribute vec3 position;\nvoid main() { gl_Position = vec4( position, 1.0 ); }')
        gl.shaderSource(fragment_shader, frag)
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

Very Pink Floyd. An observation about the results: note that the fragment shader we defined only acted
on those pixels within the triangle. It didn't affect the background color at all. Also, that program we
defined ran *for each pixel in the triangle* -- that's a lot of computation to be doing in parallel, and
it took no time at all. GPUs are pretty cool, huh?

You can play more with fragment shader's on [mrdoob's shader playground](http://glsl.heroku.com). Before we
finish this article, I'd like to touch on one last topic -- `uniform`s.

A `uniform` is a variable that may be present in one or both of your fragment and shader programs. It's declared
at the top level. It is so named because of the fact that it's value is `uniform` across all vertex data and all
fragment data that runs through your complete shader program.

They're really powerful, and really neat.

Let's revist our `draw` function:

    function draw(program, vertex) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        gl.useProgram(program)

        // find the location of the `uniform` variable named `time`.
        var time_location = program.time_location || gl.getUniformLocation(program, 'time')

        // cache the location of the `time` uniform on the program
        // object so we don't have to keep asking OpenGL where it is.
        program.time_location = time_location

        // set the time to [0, 1] (over 3 seconds, go from 0 to 1).
        gl.uniform1f(time_location, (Date.now() % 3000) / 3000)

        gl.bindBuffer(gl.ARRAY_BUFFER, vertex)
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(0)

        gl.drawArrays(gl.TRIANGLES, 0, vertices.length/3)
    }

The function `gl.getUniformLocation` finds the location of the variable named `time` within our
program. Remember from the previous article that we don't wish to send or request extraneous data
from OpenGL while drawing, so after we get that location, we cache it.

The `gl.uniform1f` call takes a location and a value to assign to that location. The `1` denotes that
we're only sending a single value (not an array), and the `f` denotes that the value will be regarded as a `float`.

What can we do with this? Let's add it to our fragment shader:

    #ifdef GL_ES
    precision highp float;
    #endif

    uniform float time;

    void main() {
        // put time into degrees (2 cycles / iteration)
        float x = time * 720.0;

        // put x in the range [0, 2]
        x = sin(radians(x)) + 2.0;

        // and back into [0, 1].
        x = x / 2.0;

        gl_FragColor = vec4(x, x, x, 1.0);
    }

And for fun, we'll add it to our vertex shader. Note that you could omit it from either (or both)
shaders with no ill consequences.

    #ifdef GL_ES
    precision highp float;
    #endif
    
    attribute vec3 position;

    uniform float time;

    void main() {
        float x = sin(radians(time * 360.0)) + 2.0;

        x /= 2.0;
 
        gl_Position = vec4(position * x, 1.0);
    }

<canvas id="uniforms" class="imgleft" style="background:#CCC">
<script type="text/javascript">

    (function(){
    var canvas = document.getElementById('uniforms')
      , gl = canvas.getContext('experimental-webgl')

    // here's our vertex data.
    var vertices = [
         -0.5, -0.5, 0
      ,   0.0,  0.5, 0
      ,   0.5, -0.5, 0
    ]

    var frag = [''
    ,'#ifdef GL_ES'
    ,'precision highp float;'
    ,'#endif'
    ,'uniform float time;'
    ,'void main() {'
    ,'    float x = time * 720.0;'
    ,'    x = (sin(radians(x)) + 2.0) / 2.0;'
    ,'    vec3 rgb = vec3(x, x, x);'
    ,'    gl_FragColor = vec4(rgb, 1.0);'
    ,'}'
    ].join('\n')

    var vert = [''
    ,'#ifdef GL_ES'
    ,'precision highp float;'
    ,'#endif'
    ,'attribute vec3 position;'
    ,'uniform float time;'
    ,'void main() {'
    ,'    float x = (sin(radians(time * 360.0)) + 2.0) / 2.0;'
    ,'    gl_Position = vec4(position * x, 1.0);'
    ,'}'
    ].join('\n')
    

    // create a shader program -- a strategy for
    // rendering OpenGL primitives -- and send it
    // to the OpenGL server.
    function init_program() {
        var program = gl.createProgram()
          , vertex_shader = gl.createShader(gl.VERTEX_SHADER)
          , fragment_shader = gl.createShader(gl.FRAGMENT_SHADER)

        gl.shaderSource(vertex_shader, vert)
        gl.shaderSource(fragment_shader, frag)
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

        gl.useProgram(program)

        // find the location of the `uniform` variable named `time`.
        var time_location = program.time_location || gl.getUniformLocation(program, 'time')

        // cache the location of the `time` uniform on the program
        // object so we don't have to keep asking OpenGL where it is.
        program.time_location = time_location

        // set the time to [0, 360]
        gl.uniform1f(time_location, (Date.now() % 3000) / 3000)

        gl.bindBuffer(gl.ARRAY_BUFFER, vertex)
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(0)

        gl.drawArrays(gl.TRIANGLES, 0, vertices.length/3)
    }

    var program = init_program()
      , vertex = init_vertex()

    // set the background color, RGBA (from 0.0 to 1.0).
    gl.clearColor(0, 0, 0, 1.0)
    setInterval(function() {
        draw(program, vertex)
    }, 33)


    })()
</script>

Et voila. We've transformed our static, boring triangle into an animating one, all with the addition
of a single uniform that tracks time.

[In the next article](#rendering_2), I'd like to cover textures and a few more ways to issue draw calls.
