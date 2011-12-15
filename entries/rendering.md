# Rendering Basics

In the [previous article](#game-loops), we posed a question: what do the `init`, `game_draw`,
and `game_update` functions look like? This article will explain a bit about `init` and `game_draw`,
but before we get started detailing how those work, we should talk a bit about how WebGL works.

## WebGL, how does it work?

At it's core, OpenGL (and hence, WebGL) is designed as a state machine server. Your code (henceforth
referred to as the *"client"*) issues commands to change the state of the renderer. Over the course of
the frame, the client changes the state of the OpenGL server and issues draw commands. The result of a
draw call is dependent on the state of the server at the time of the call. In terms of REST -- which
you may be a bit more familiar with -- imagine the client continually `POST`'ing partial state changes
to the server; while the draw calls are like `GET` requests dependent on server state. In other words,
the world's worst REST API.

However, this continual mutation of state (and interdependent results based on previous state) allows for
a lot of potential outcomes, and thus a staggering amount of flexibility.


> # Disclaimer
> Keep in mind, this conceptualization is based on
> technologies of latter year: for instance, when
> I first started learning OpenGL, AGP was the 
> *new, cool thing.* However, even with the advent of
> PCI Express, I think this abstraction holds up.

**But wait** -- the GPU is a *part* of your computer! Why is OpenGL designed to act like a server separate from
your client?

GPU's usually have their own allocation of high performance memory, and tons upon tons of tiny parallel computing cores.
Processing local information is **fast, fast, fast**. However, your CPU and the memory attached to it are completely
distinct from the GPU. Any information that the CPU has that it wants the GPU to know about has to travel over
a bus to get to the GPU -- compared to having local data, this is **slow**. 

For optimum performance, the client should send the server all of the data it needs to run the process. Of course,
this is such a platonic ideal, especially for a game -- things are changing on the CPU all the time, and those changes
need to be reflected in the rendered screen. We get a nice continuum out of this abstraction, however: the less the
client sends to the server, the faster it will be to draw the frame. This can be measured both in volume of commands,
as well as size of data sent. We'll call this the **State Change Bottleneck**. The easiest way to avoid this is to
organize your renderer such that similar items can be grouped together, and share a single `setup` and `teardown` of
state. 

Another bottleneck, one we'll call the **Primitive Bottleneck**: If there are a lot of primitives on the GPU that need
intensive processing, and we're just minimally telling the GPU that it needs to draw that data every frame (basically,
the tiniest amount of client code possible!), the framerate will suffer. We can avoid this by only sending primitives that
we know to be visible.

It's useful to keep those two bottlenecks
in mind as we design our program, since one of our stated goals is that we should run at 30 frames per second or better --
in other words, it should only take 33 milliseconds to draw a frame.

### So what kind of data are we sending to the server?

There are three basic kinds of data we'll be sending to the server: state changes (usually cheap), rendering data (usually pricey),
and draw commands (price determined by the previous two items).

State changes look like: `gl.enable(gl.CULL_FACE)`, or `gl.enable(gl.TEXTURE0)`. These can be fairly cheap; however it's 
best to keep that GPU bottleneck in mind -- we'd rather change state as little as humanly possible while drawing our scene.

Rendering data can come in all sorts of shapes and sizes. To whit:

* Vertices
* Shader programs
* Program data
* Texture data

Rendering data is (typically) generated and sent to the GL server during initialization. This makes sense: it's quite hefty, usually,
and it's not expected to change dynamically over the course of the game. Sending it at the beginning makes it a one-time sunk cost.

So let's take a simple case: we want to draw a triangle to the screen. How do we accomplish this? Our `init` function might look
a little bit like this pseudocode:

    // init:
    our_program = send_render_program_to_gl()
    vertex_handle = send_vertices_to_gl()

    // draw:
    gl_use_program(our_program)
    gl_send_program_data('vertex_handle', vertex_handle)
    gl_draw(gl.TRIANGLES, vertex_handle)

Of course, this is simplified, but it shows a common pattern you'll see while writing game initialization and rendering code. Send something
to WebGL, get a handle back. When we want to use that data, we tell WebGL that we'd like to change the current state of the server so that we're
using that handle. Then we issue a draw call. In other words, we're only sending the bulk of our data at the outset of the game, not during each
frame. Instead, we send the data up front, get a handle for it, and send that (tiny!) handle back to the server to use the data we sent earlier. 

## Theory is boring. Let's draw a triangle. 

We'll want to send OpenGL some vertex data and a shader program -- the vertex data represents a triangle,
while the shader program tells OpenGL how we'd like to render that triangle. Let's split up our `init` function accordingly. First we'll create the
`init_program` function, which sends our shader program to OpenGL and returns a handle to that program. 

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

> ### Coordinate System
> Our coordinate system for this example will be slightly different than usual
> since we're in two dimensions.
> In this lesson, `[-1, -1]` is at the bottom left of the canvas element, while 
> `[1, 1]` points at the top right. 

We'll get more in depth about shader programs a little later; this particular program just tells OpenGL to treat our vertices as screen coordinates, 
and says that when it encounters a primitive (a shape), it should put red pixels onto the screen. 

Next, let's send some vertices to the OpenGL server.

    var canvas = document.getElementById('triangle')
      , gl = canvas.getContext('experimental-webgl')

    // here's our vertex data.
    // note that it's a flat array. we'll
    // tell openGL how to slice it up in our draw command.
    var vertices = [
         -0.5, -0.5, 0 // bottom left
      ,   0.0,  0.5, 0 // top middle
      ,   0.5, -0.5, 0 // bottom right
    ]

    // send our vertex data to the OpenGL server.
    function init_vertex() {
        // create a buffer handle.
        var buffer = gl.createBuffer()

        // tell the OpenGL buffer manipulator that we're talking about our new buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)

        // tell OpenGL that we'd like to put the following data into the currently bound buffer.
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)
        return buffer
    }

> A note: we use `Float32Array` to pass our vertex data to OpenGL; this constructor is built in to all WebGL compliant browsers.

Again, pretty simple. Our vertices have 3 components, `[x, y, z]`. We ignore `z` for now, since we're just drawing a 2D triangle. After the last two `init`
functions, you should see another pattern emerging: when we want to send data to OpenGL, we ask it for a handle up front -- e.g., `gl.createBuffer()`, `gl.createProgram()`,
and friends -- and then send data to that handle using another function (`attachShader`, `bufferData`, et cetera). You'll see this pattern a lot as we
continue to add functionality to our tiny game. 

Finally, we define the `draw` function: 

    function draw(program, vertex) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        // tell OpenGL to use our shader program
        gl.useProgram(program)

        // tell OpenGL that we're talking about the
        // vertexes we sent it earlier.
        gl.bindBuffer(gl.ARRAY_BUFFER, vertex)

        // remember when I mentioned that we'd tell OpenGL how to chop up
        // our vertices? the second parameter (3) here does just that.
        // you should read this as:
        // "OpenGL, the first attribute pointer is pointed at an array of Floats, 3 per vertex."
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(0)

        // issue a draw command to OpenGL.
        gl.drawArrays(gl.TRIANGLES, 0, vertices.length/3)
    }

    var program = init_program()
      , vertex = init_vertex()

    // set the background color, RGBA (from 0.0 to 1.0).
    gl.clearColor(0, 0, 0, 1.0)
    setInterval(function() {
        draw(program, vertex)
    }, 33)

<canvas id="triangle" class="imgleft" style="background:#CCC">
<script type="text/javascript">

    (function(){
    var canvas = document.getElementById('triangle')
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

Cool. You should see our friend, the triangle, to the left. **To recap**, in this section we discussed
how the WebGL API is structured, and how that affects your program design. We learned that WebGL treats
talking to your graphics card like a client/server system, and that it employs a state machine to determine
how to render draw calls. 
[Next, I'd like to talk about the different kinds of data we'll be sending to WebGL](#rendering_1)
