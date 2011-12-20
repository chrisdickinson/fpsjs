# Textures and draw calls

In the [last lesson](#rendering_1), we talked at length about the OpenGL rendering pipeline; touching
on **vertex attributes** and what they mean to our shader program. We also defined what
the **vertex and fragment shaders** contribute to the rendering path -- and learned that it's
fairly straightforward to send uniform (unchanging) data into the rendering path that can
be accessed by both the vertex and fragment shaders. In particular, we sent a floating
point uniform representing the current progress through a period (3 seconds), and used
it to bounce the triangle in and out; as well as to fade from white to black and back to
white. We marveled at how many **parallel** operations our GPU is capapble of performing.

What now?

![left](/fpsjs/media/img/painterly.jpg)

Take a look at these screenshots from Minecraft. They're using a [custom texture pack](http://painterlypack.net/)
to change the look and feel of the game.

Obviously, we're not anywhere close to having a game -- we're still working out OpenGL --
but it's important to note the importance of textures: they play a large part in defining
the look and feel of our game. More than that, since we'll have *direct*, **programmatic**
access to the textures in our vertex and fragment shaders, we can use them to send a lot
of data to the GPU in a very efficient manner.

## How do we load textures?

OpenGL allows a lot of flexibility in configuring textures. We can send 1, 2, or even 3 dimensional
textures to our shader program. We can define the edge behavior of the texture -- that is, if you try to sample
a texture outside of it's width or height, it will behave as we tell it to. We can also define what
happens when the texture is subsampled (when the camera is far away from the texture), as well as what
we see when it is supersampled (when the camera is close to the texture). 

Let's define a new function -- `load_texture` -- that takes a path to an image and returns a configured
OpenGL texture object.

    function load_texture(path) {
      // use the built in `Image` constructor provided to javascript.
      var img = new Image
        , texture = gl.createTexture()

      img.src = path

      img.onload = function() {
        // put the image data in the correct order for OpenGL.
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)

        // set the active texture object to `texture`.
        gl.bindTexture(gl.TEXTURE_2D, texture)

        // we want to write a 2D image, at the first level of detail,
        // to the current texture handle. store the data internally as (r,g,b,a).
        // the incoming data is already in (r,g,b,a) format, and it's defined in
        // unsigned bytes (0-255). pull that data from `img`.
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)

        // as we get closer to the texture, use linear scaling to supersample the image.
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

        // as we get further away from the texture, use linear scaling to subsample the image.
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)

        // set the behavior for sampling a coordinate from the texture outside of the width
        // of the image:
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)

        // as well as outside the height of the image:
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      }
      return texture
    } 

The result of calling this function is a configured texture object. 
[There are many other options we could configure](http://www.opengl.org/sdk/docs/man/xhtml/glTexParameter.xml), 
but this will do for now.

To actually start using our texture, we'll have to modify our fragment shader and our
draw call from the previous program:

    // our fragment shader:
    #ifdef GL_ES
    precision highp float;
    #endif

    uniform float time;

    // this is our texture!
    uniform sampler2D texture;

    void main() {
        // put time into degrees (2 cycles / iteration)
        float x = time * 720.0;

        // put x in the range [0, 2]
        x = sin(radians(x)) + 2.0;

        // and back into [0, 1].
        x = x / 2.0;

        // lookup a pixel from our texture using our
        // current screen coordinates divided by our screen resolution.
        vec4 texture_color = texture2D(texture, gl_FragCoord.xy / 640.0);
        vec4 x_vec = vec4(x, x, x, 1.0);

        gl_FragColor = x_vec * texture_color;
    }

As for the draw call:

    // we'll add a parameter for `texture` to our draw call:
    function draw(program, vertex, texture) {
        var time_location
          , texture_location

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        gl.useProgram(program)
        time_location = program.time_location || gl.getUniformLocation(program, 'time')
        program.time_location = time_location

        // note: we cache the location of `uniform sampler2D texture` just
        // like the time.
        texture_location = program.texture_location || gl.getUniformLocation(program, 'texture')
        program.texture_location = texture_location

        // set the active texture unit to 0.
        gl.activeTexture(gl.TEXTURE0)

        // bind the texture to the current active texture unit.
        gl.bindTexture(gl.TEXTURE_2D, texture)

        // tell our program that the variable `uniform sampler2D texture` refers to texture unit 0.
        gl.uniform1i(texture_location, 0)

        gl.uniform1f(time_location, (Date.now() % 3000) / 3000)
        gl.bindBuffer(gl.ARRAY_BUFFER, vertex)
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(0)
        gl.drawArrays(gl.TRIANGLES, 0, vertices.length/3)
    }

Okay, now our `draw` call will accept a texture object. Let's modify our loop:

    // we're just loading the texture and passing it into the draw call now.
    var program = init_program()
      , vertex = init_vertex()
      , texture = load_texture('/media/img/painterly.jpg')

    gl.clearColor(0, 0, 0, 1.0)
    setInterval(function() {
        draw(program, vertex, texture)
    }, 33)

<canvas id="triangle" class="imgright" style="background:#CCC">
<script type="text/javascript">

    (function(){
    var canvas = document.getElementById('triangle')
      , gl = canvas.getContext('experimental-webgl')

    var frag = [''
    ,'#ifdef GL_ES'
    ,'precision highp float;'
    ,'#endif'
    ,'uniform float time;'
    ,'uniform sampler2D texture;'
    ,'void main() {'
    ,'    float x = time * 720.0;'
    ,'    x = sin(radians(x)) + 2.0;'
    ,'    x = x / 2.0;'
    ,'    vec4 texture_color = texture2D(texture, gl_FragCoord.xy/300.0);'
    ,'    vec4 x_vec = vec4(x, x, x, 1.0);'
    ,'    gl_FragColor = x_vec * texture_color;'
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
    
    function load_texture(path) {
        // use the built in `Image` constructor provided to javascript.
        var img = new Image
          , texture = gl.createTexture()

        img.src = path

        img.onload = function() {
        // put the image data in the correct order for OpenGL.
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)

        // set the active texture object to `texture`.
        gl.bindTexture(gl.TEXTURE_2D, texture)

        // we want to write a 2D image, at the first level of detail,
        // to the current texture handle. store the data internally as (r,g,b,a).
        // the incoming data is already in (r,g,b,a) format, and it's defined in
        // unsigned bytes (0-255). pull that data from `img`.
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)

        // as we get closer to the texture, use linear scaling to supersample the image.
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

        // as we get further away from the texture, use linear scaling to subsample the image.
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)

        // set the behavior for sampling a coordinate from the texture outside of the width
        // of the image:
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)

        // as well as outside the height of the image:
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        }

        return texture
    } 

    // we'll add a parameter for `texture` to our draw call:
    function draw(program, vertex, texture) {
        var time_location
          , texture_location

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        gl.useProgram(program)
        time_location = program.time_location || gl.getUniformLocation(program, 'time')
        program.time_location = time_location

        // note: we cache the location of `uniform sampler2D texture` just
        // like the time.
        texture_location = program.texture_location || gl.getUniformLocation(program, 'texture')
        program.texture_location = texture_location

        // set the active texture unit to 0.
        gl.activeTexture(gl.TEXTURE0)

        // bind the texture to the current active texture unit.
        gl.bindTexture(gl.TEXTURE_2D, texture)

        // tell our program that the variable `uniform sampler2D texture` refers to texture unit 0.
        gl.uniform1i(texture_location, 0)

        gl.uniform1f(time_location, (Date.now() % 3000) / 3000)
        gl.bindBuffer(gl.ARRAY_BUFFER, vertex)
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(0)
        gl.drawArrays(gl.TRIANGLES, 0, vertices.length/3)
    }

    var program = init_program()
      , vertex = init_vertex()
      , texture = load_texture('/fpsjs/media/img/painterly.jpg')

    gl.clearColor(0, 0, 0, 1.0)
    setInterval(function() {
        draw(program, vertex, texture)
    }, 33)

    })()
</script>

Our texture is displayed on the triangle. However, there's a bit of a wrinkle: the texture isn't
being scaled along with the size of the triangle! We'd really like the texture to scale up and down,
but to do that we'll need **texture coordinates** associated with each vertex of the triangle.

> ### Power of two textures
> WebGL (and OpenGL in general) works best with
> power of two textures -- that is, `256x256`, `512x512`.
> In particular, if a texture's dimensions are not a power of two,
> WebGL requires that we must use certain filtering (mipmapping is not allowed),
> as well as clamping for the texture to display -- hence the `CLAMP_TO_EDGE` above.

However, vertex attribute data isn't passed from the vertex shader to the fragment shader. It wouldn't make
sense to directly pass vertices in: in the fragment shader, we're working at the pixel level. There's no
association between the pixel we're working on and which vertex caused that pixel to be drawn.

Enter the `varying` qualifier. In our shaders, we can define variables as being `varying` -- in the vertex shader,
this means that we'll be passing vertex-specific data into the variable. In the fragment shader, we'll be reading
that data back out. **Nota bene**: the values we assign to the varying variable in the vertex shader will not be
the exact same values we read back out in the fragment shader -- remember, the pixel has no idea which vertex it
should be associated with. Instead, the values will be **interpolated** across the primitive created by the vertex
shader.

Let's take a look at the modifications we'll have to make to the vertex shader:

    #ifdef GL_ES
    precision highp float;
    #endif
    
    attribute vec3 position;

    // declare an [x, y] texcoord we'll be writing into.
    varying vec2 texcoord;

    uniform float time;

    void main() {
        float x = sin(radians(time * 360.0)) + 2.0;

        x /= 2.0;
 
        gl_Position = vec4(position * x, 1.0);

        // pass our position data into the fragment shader.
        // move it into the [0, 1] space (remember, our [x,y,z] coords are [-0.5, 0.0, 0.0], etc)
        texcoord = position.xy + vec2(0.5, 0.5);
    }

And our fragment shader:

    // our fragment shader:
    #ifdef GL_ES
    precision highp float;
    #endif

    uniform float time;

    uniform sampler2D texture;

    // declare that we'll be reading from the interpolated [x, y] texcoord from above.
    varying vec2 texcoord;

    void main() {
        float x = time * 720.0;
        x = sin(radians(x)) + 2.0;
        x = x / 2.0;

        // use our interpolated texcoord value to lookup a pixel in the texture.
        vec4 texture_color = texture2D(texture, texcoord);
        vec4 x_vec = vec4(x, x, x, 1.0);

        gl_FragColor = x_vec * texture_color;
    }

<canvas id="texcoord" class="imgright" style="background:#CCC">
<script type="text/javascript">

    (function(){
    var canvas = document.getElementById('texcoord')
      , gl = canvas.getContext('experimental-webgl')

    var frag = [''
    ,'#ifdef GL_ES'
    ,'precision highp float;'
    ,'#endif'
    ,'uniform float time;'
    ,'uniform sampler2D texture;'
    ,'varying vec2 texcoord;'
    ,'void main() {'
    ,'    float x = time * 720.0;'
    ,'    x = sin(radians(x)) + 2.0;'
    ,'    x = x / 2.0;'
    ,'    vec4 texture_color = texture2D(texture, texcoord);'
    ,'    vec4 x_vec = vec4(x, x, x, 1.0);'
    ,'    gl_FragColor = x_vec * texture_color;'
    ,'}'
    ].join('\n')

    var vert = [''
    ,'#ifdef GL_ES'
    ,'precision highp float;'
    ,'#endif'
    ,'attribute vec3 position;'
    ,'uniform float time;'
    ,'varying vec2 texcoord;'
    ,'void main() {'
    ,'    float x = (sin(radians(time * 360.0)) + 2.0) / 2.0;'
    ,'    gl_Position = vec4(position * x, 1.0);'
    ,'    texcoord = position.xy + vec2(0.5, 0.5);'
    ,'}'
    ].join('\n')
    

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
    
    function load_texture(path) {
        // use the built in `Image` constructor provided to javascript.
        var img = new Image
          , texture = gl.createTexture()

        img.src = path

        img.onload = function() {
        // put the image data in the correct order for OpenGL.
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)

        // set the active texture object to `texture`.
        gl.bindTexture(gl.TEXTURE_2D, texture)

        // we want to write a 2D image, at the first level of detail,
        // to the current texture handle. store the data internally as (r,g,b,a).
        // the incoming data is already in (r,g,b,a) format, and it's defined in
        // unsigned bytes (0-255). pull that data from `img`.
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)

        // as we get closer to the texture, use linear scaling to supersample the image.
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

        // as we get further away from the texture, use linear scaling to subsample the image.
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)

        // set the behavior for sampling a coordinate from the texture outside of the width
        // of the image:
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)

        // as well as outside the height of the image:
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        }

        return texture
    } 

    // we'll add a parameter for `texture` to our draw call:
    function draw(program, vertex, texture) {
        var time_location
          , texture_location

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        gl.useProgram(program)
        time_location = program.time_location || gl.getUniformLocation(program, 'time')
        program.time_location = time_location

        // note: we cache the location of `uniform sampler2D texture` just
        // like the time.
        texture_location = program.texture_location || gl.getUniformLocation(program, 'texture')
        program.texture_location = texture_location

        // set the active texture unit to 0.
        gl.activeTexture(gl.TEXTURE0)

        // bind the texture to the current active texture unit.
        gl.bindTexture(gl.TEXTURE_2D, texture)

        // tell our program that the variable `uniform sampler2D texture` refers to texture unit 0.
        gl.uniform1i(texture_location, 0)

        gl.uniform1f(time_location, (Date.now() % 3000) / 3000)
        gl.bindBuffer(gl.ARRAY_BUFFER, vertex)
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(0)
        gl.drawArrays(gl.TRIANGLES, 0, vertices.length/3)
    }

    var program = init_program()
      , vertex = init_vertex()
      , texture = load_texture('/fpsjs/media/img/painterly.jpg')

    gl.clearColor(0, 0, 0, 1.0)
    setInterval(function() {
        draw(program, vertex, texture)
    }, 33)

    })()
</script>

Now our texture is scaling along with the size of the triangle. You may note some problems with our current approach.

* Our position information is our texture coordinate information. What if we want to change one without changing the other?
* This is harder to notice, but you might see a flicker at the beginning of the render. This is caused by our texture loader:
  When we're sending our texture image data to OpenGL, we haven't actually loaded the image yet. 

  In other words, we start rendering before we've actually loaded our texture! To solve this, we'll have to rework our texture
  loader to use callbacks.
* What if we want to change our texture parameters? Right now, you might note that when the texture is sub- or super-sampled,
  the scaling looks a little blocky. What if we want our textures to repeat?

It's not all doom and gloom, however -- over the last three articles, we've gone from drawing a static, red triangle to drawing
an animated, pulsating triangle that displays textures. Importantly, **note how little code we had to write to do this**. Were
we programming against OpenGL using C or C++, we'd have to take into consideration:

* Platform specific code (not necessary with WebGL!)
* System endianness (again, JavaScript and WebGL take care of that for us!)
* Writing image loaders for every image type we wanted to use (all we have to do in WebGL is just load an image and pass it to
  OpenGL!)

So, keeping in mind how much we have specifically not had to learn, let's approach those three problems we listed above optimistically!
I promise the solutions will be short and sweet.

## Making our texture loader take callbacks

This is probably the easiest problem to tackle, but might be a little difficult if you're not well-versed in how JavaScript works.

If you're comfortable with transforming synchronous code into asynchronous code in JS, you can feel free to skip this section.

In brief, JavaScript, unlike many language, has the concept of an **event loop** baked in. In other words, your program does not
exit once the stack is exhausted, unlike many other languages. You may schedule events to happen later, at which point your code
will execute in a new stack: references to variables in your function's scope will be retained, so the process is painless.

In the browser, we may hook onto document-wide events, element-specific events, or event events triggered by an object.

In particular, we'd like our texture loader to have an api like the following:

    load_texture('/path/to/texture.png', function(error, texture) {
        // if we couldn't load the texture, skip out early.
        if(error) throw error;

        // otherwise create the game loop.
        setInterval(function() {
            draw(program, vertex_buffer, texture)
        }, 33)
    })

It turns out that we can do this with a minimal amount of contortion on our part. A rule of thumb: it's easier to write
your code as if it will be asynchronous by default -- even when it won't be -- than it is to keep revisiting synchronous code
and rewriting it to be async. Furthermore, in JavaScript, it's entirely possible to make synchronous code act asynchronous, but it's very difficult
to make asynchronous code act synchronously.

Going forward we'll write our loading functions with those properties in mind. For now, let's revisit our image loader:

    // add a `ready` parameter that will act as our callback.
    function load_texture(path, ready) {
        var img = new Image
          , texture = gl.createTexture()

        img.src = path

        // javascript will automatically "hoist" the `loaded` and `error` functions to the top of
        // the scope, so they're available here:
        img.onload = loaded
        img.onerror = error

        function loaded () {
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
            gl.bindTexture(gl.TEXTURE_2D, texture)
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

            // there was no error, so we'll pass `null` for 
            // the error parameter, and `texture` as the data parameter.
            ready(null, texture)
        }

        function error () {
            // there was an error, so we'll call the `ready` 
            // callback with a `new Error` as it's error parameter.
            ready(new Error('Could not load '+path))
        }
    } 

Now our image loader works as it should: it delays defining the texture until the image is fully loaded. It'll also give us
a handy "error" if the image failed to load.

## Making our texture loader attempt to mipmap and repeat.

As mentioned previously, WebGL is particularly picky about textures that are not a power of two on each side: `256x256`, `512x512`,
etc. are all fine, and we have all the configuration options in the world available to us, but when we're faced with an oddly sized texture
(as our current texture currently is), we can only use `LINEAR` filtering, and we must `CLAMP_TO_EDGE` when we're outside the bounds of the texture.

This kind of sucks.

In an ideal world, we would be able to specify any clamping or mag/min filtering options, and if they're not supported by the texture as is,
we would resize said texture to a power of two and retry. Our ideal defaults are to use mipmapping (which ensures a smooth sub-sampling scheme),
and a repeating stategy for texture wrapping.

[I'll use the canvas texture resizer from this article](#canvas-resizing), which is defined as `resize_image(image)`, and returns a `canvas` object
that we can pass to OpenGL as our image. We'll modify our `load_texture` to optionally accept `options` as a hash of option values, with sane
defaults built into the function.

    // add a `ready` parameter that will act as our callback.
    function load_texture(path, options, ready) {
        var img = new Image
          , texture = gl.createTexture()
          , defaults = {
                wrap:'repeat'
              , mag:'linear'
              , min:'mipmap'
            }
          , map_options_to_gl = {
                repeat:gl.REPEAT
              , clamp:gl.CLAMP_TO_EDGE
              , linear:gl.LINEAR
              , mipmap:gl.LINEAR_MIPMAP_LINEAR
              , nearest:gl.NEAREST
            }

        // if we only passed two arguments in, reorder the arguments.
        if(ready === undefined) {
            ready = options
            options = {}
        }

        // reduce our options into a single options object,
        // transforming the options into their gl equivalents. 
        // if an option is invalid, attempt to use the default value.
        options = [defaults, options].reduce(function(lhs, rhs) {
          for(var key in rhs) {
            lhs[key] = map_options_to_gl[rhs[key]] || map_options_to_gl[lhs[key]]
          } 
          return lhs
        }, {})

        img.src = path
        img.onload = loaded
        img.onerror = error

        function loaded () {
            // if the width and height are different
            // or if the width isn't a power of two, it's a npot texture.
            var is_npot = img.width !== img.height || !(img.width & (img.width - 1)) === 0

            // if we've got an npot texture and our options 
            // request something other than clamping or
            // linear sub-sampling, resize it. 
            if(is_npot && (options.clamp !== gl.CLAMP_TO_EDGE || options.min !== gl.LINEAR)) {
              img = resize_image(img)
            }

            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
            gl.bindTexture(gl.TEXTURE_2D, texture)
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)

            if(options.min === gl.LINEAR_MIPMAP_LINEAR) {
              gl.generateMipmap(gl.TEXTURE_2D)
            }

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, options.mag)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, options.min)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, options.clamp)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, options.clamp)
            ready(null, texture)
        }

        function error () {
            ready(new Error('Could not load '+path))
        }
    } 

## Adding attributes to our vertex stream

This is probably the trickiest of the three problems listed above; but it's not insurmountable.
You may recall in the previous article that we defined the following in our draw call:

        gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer)
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(0)
        gl.drawArrays(gl.TRIANGLES, 0, num_vertices)

We touched on the fact that `vertexAttribArray` would enable the first stream of attributes, defined
by the previous calls to `vertexAttribPointer` and `bindBuffer`. In a sense, we were defining the `source`
of the data, and the `format` of the data coming through that first stream.

We now want to describe a separate attribute of our vertex data -- the texture coordinate for a given vertex.
There are two ways that we haven't defined **where** we want it to come from, nor have we defined the **format**
of that data.

Since we are drawing two dimensional textures onto flat planes, we really only need two coordinates to define a
texture coordinate -- `x, y`. We sample a pixel out of a texture in our fragment shader using `texture2D(float x, float y)`.
The coordinate system OpenGL uses for textures is basically the same as our screen coordinates: that is, `0, 0`
is the bottom left of the texture, while `1, 1` is the top right of our texture, regardless of the dimensions of the
texture. That gives us our **format**, by and large, but doesn't say anything about our **source**.

We actually have **two** options for defining our source. I mentioned in the [last article](#rendering_1) that the call to
`vertexAttribPointer` took two final arguments, `stride` and `offset`. These allow us to use data from a single
buffer for all of our vertex attributes; e.g., our data could look like `x, y, z, texture x, texture y, x, y, z, texture x, texture y`,
and so on. If we go this route, our `vertexAttribPointer`'s stride and offset would be `3 * 4`: floats are `4` bytes
wide, and we are skipping `3` floats from our buffer to get to our texture coordinates. Our draw call would look like
this:

        gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer)
        // there are now elements to skip in our position information, hence the `2 * 4`
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 2 * 4, 0)
        gl.enableVertexAttribArray(0)

        // skip 3 floats, starting 3 floats in.
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 3 * 4, 3 * 4)
        gl.enableVertexAttribArray(1)

        gl.drawArrays(gl.TRIANGLES, 0, num_vertices)

Alternatively, we could put all of our texture coordinate data into another buffer -- `texture x, texture y, texture x, texture y`,
and point the second attribute channel at it. This ends up looking like the following:

        gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer)
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(0)

        gl.bindBuffer(gl.ARRAY_BUFFER, texture_coordinate_buffer)
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(1)

        gl.drawArrays(gl.TRIANGLES, 0, num_vertices)

We've described our **sources** and **formats** to OpenGL, and it will draw from both of those buffers to stream vertex attribute
information to our vertex shader.

There are tradeoffs with both approaches; the first approach might improve data locality due to all of the data streaming out of a
single buffer source, but any change to any attribute in a model will require a resend of all of the data (changed or not) to OpenGL.
For example, this would make developing authoring tools somewhat difficult -- data is expected to change on a fairly constant basis,
and in that case it might be easier to keep attributes in separate buffers. Further, we may wish to export attributes as separate files,
with the aim of reducing load time: if a model's texture coordinates changes but it's vertices do not, we could build a loader that
only fetches changes attributes of the model at runtime.

That said, it would be fairly trivial to take these separate attributes and interleave them in our game; which would give us the best
of both worlds -- ease of editing in our authoring tools, and better data locality while actually running the game.

In either case, we will be modifying our vertex shader to accept the new vertex attribute. We'll wish to accept a new `attribute`,
`a_texcoord`:

    #ifdef GL_ES
    precision highp float;
    #endif
    

    // accept a new attribute: note that we've started 
    // to prefix our attributes with `a_`.
    attribute vec3 a_position;
    attribute vec2 a_texcoord;

    // we'll also start prefixing our varying variables with `v_`:
    varying vec2 v_texcoord;

    uniform float time;

    void main() {
        float x = sin(radians(time * 360.0)) + 2.0;

        x /= 2.0;
 
        gl_Position = vec4(a_position * x, 1.0);

        // pass the new attribute into the fragment shader:
        v_texcoord = a_texcoord;
    }

**Note that our existing fragment shader already accepts a `varying vec2` for texture coordinates**; we'll simple have to rename that variable
from `texcoord` to `v_texcoord` to match our revised vertex shader.

In the [next article](#rendering_3), I'd like to cover a few more nuances of draw calls -- specifically, using index arrays to cut down
the amount of vertex data we need to send to the GPU, and we'll touch on another primitive drawing mode to further reduce the amount of
vertex data we need to send.
