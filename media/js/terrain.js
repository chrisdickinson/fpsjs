var requestAnimFrame;

if(typeof window !== 'undefined')
  requestAnimFrame = (function(){
  return  window.requestAnimationFrame       || 
          window.webkitRequestAnimationFrame || 
          window.mozRequestAnimationFrame    || 
          window.oRequestAnimationFrame      || 
          window.msRequestAnimationFrame     || 
          function(/* function */ callback, /* DOMElement */ element){
            window.setTimeout(callback, 1000 / 60);
          };
  })();

Function.prototype.shader = function() {
  var src = ''+this
    , start = src.indexOf('/*')+2
    , end = src.indexOf('*/')
  return src.slice(start, end)
}

var sin = Math.sin
  , cos = Math.cos
  , Pi = Math.PI

function Camera(cvs) {
  this.x = 0
  this.y = -18
  this.z = 0

  this.r_x = 0.0
  this.r_y = Math.PI 

  this.canvas = cvs

  // 30mps
  this.speed = 30
  this.wasd = {}

  this.model_matrix = mat4.create()
  this.projection_matrix = mat4.create()
  mat4.identity(this.projection_matrix)
  mat4.perspective(45, this.canvas.width / this.canvas.height, 0.1, 100, this.projection_matrix) 
}

Camera.events = {}

Camera.prototype.get_model_matrix = function() {
  mat4.identity(this.model_matrix)
  mat4.rotate(this.model_matrix, this.r_x, [1, 0, 0])
  mat4.rotate(this.model_matrix, this.r_y, [0, 1, 0])
  mat4.translate(this.model_matrix, [this.x, this.y, this.z])
  return this.model_matrix 
}

Camera.prototype.get_projection_matrix = function() {
  return this.projection_matrix
}

Camera.events.mousewheel = function(ev) {
  ev.preventDefault()

  this.r_x += ev.wheelDeltaY / 1000
  this.r_y += ev.wheelDeltaX / 1000

  this.r_x =  this.r_x < -Math.PI / 2 ? -Math.PI / 2 : 
              this.r_x >  Math.PI / 2 ? Math.PI / 2 : this.r_x
}

Camera.KEYS = [87, 83, 65, 68]

Camera.events.keydown = function(ev) {
  if(!~Camera.KEYS.indexOf(ev.keyCode))
    return

  this.wasd[ev.keyCode] = true
  ev.preventDefault()
}

Camera.events.keyup = function(ev) {
  if(!~Camera.KEYS.indexOf(ev.keyCode))
    return

  this.wasd[ev.keyCode] = false
  ev.preventDefault()
}

Camera.prototype.tick = function(dt) {
  var self = this
  ;[65,68,83,87].forEach(function(key) {
    if(self.wasd[key]) {
      var rot_y = -self.r_y
      if(key === 65 || key === 68) {
        rot_y += Pi/2
      }

      if(key === 68 || key === 83) {
        rot_y += Pi
      }

      self.x += sin(rot_y) * dt * self.speed
      self.z += cos(rot_y) * dt * self.speed
    }
  }) 
}

Camera.prototype.setup_events = function() {
  var self = this
  Object.keys(Camera.events).forEach(function(ev) {
    document.addEventListener(ev, Camera.events[ev].bind(self), true)
  })
}

function Resources (gl) {
  this.gl = gl
}

function next_power_of_two(size) {
  if((size & (size - 1)) !== 0) {
    --size
    for(var i = 1; i < 32; i <<= 1)
      size = size | size >> i
    size += 1
  } 
  return size
}

function resize_image(image, cvs) {
  var canvas = cvs || document.createElement('canvas')
      , ctxt = canvas.getContext('2d')
      , width = next_power_of_two(image.width)
      , height = next_power_of_two(image.height)

    var new_size = Math.min(
      Math.abs(width - image.width)
    , Math.abs(height - image.height)
    ) === width - image.width ? width : height

  canvas.width = canvas.height = new_size
  ctxt.drawImage(
      image
    , 0
    , 0
    , image.width
    , image.height
    , 0
    , 0
    , new_size
    , new_size
  )

  return canvas
}

Resources.prototype.fetch_load_texture = function(path, options, ready) {
  var img = new Image
    , self = this
  img.src = path

  if(ready === undefined) {
    ready = options
    options = undefined
  }

  img.onload = function() {
    setTimeout(function() {
      ready(null, self.load_texture(img, options))
    }, 0) 
  }

  img.onerror = function() {
    ready(new Error('could not fetch '+path))
  }
}

Resources.prototype.load_texture = function(image, options) {
  var gl = this.gl
    , texture = gl.createTexture()
    , is_npot = image.width !== image.height || (image.width & (image.width - 1)) !== 0
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

  if(!options) {
      options = {}
  }

  options = [defaults, options].reduce(function(lhs, rhs) {
    for(var key in rhs) {
      lhs[key] = map_options_to_gl[rhs[key]] || map_options_to_gl[lhs[key]]
    } 
    return lhs
  }, {})

  if(is_npot && (options.clamp !== gl.CLAMP_TO_EDGE || options.min !== gl.LINEAR)) {
    image = resize_image(image)
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)

  if(options.min === gl.LINEAR_MIPMAP_LINEAR) {
    gl.generateMipmap(gl.TEXTURE_2D)
  }

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, options.mag)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, options.min)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, options.clamp)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, options.clamp)

  return texture
}

Resources.prototype.load_shader = function(vert, frag) {
  var gl = this.gl
    , vs = gl.createShader(gl.VERTEX_SHADER)
    , fs = gl.createShader(gl.FRAGMENT_SHADER)
    , program = gl.createProgram()

  gl.shaderSource(vs, vert)
  gl.shaderSource(fs, frag)
  gl.compileShader(vs)
  gl.compileShader(fs)
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  return program
}

Resources.prototype.build_vertices = function(size) {
  var verts = []
    , gl = this.gl
    , buffer = gl.createBuffer()
    , len = size*size

  for(var x = 0; x < size; ++x)
    for(var y = 0; y < size; ++y)
      verts[verts.length] = x, verts[verts.length] = y

  verts = new Float32Array(verts)

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW) 

  buffer.enable = function() {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(0) 
  }

  buffer.size = len

  return buffer
}

Resources.prototype.build_indices = function(size) {

  size = 128

  var indices = []
    , gl = this.gl
    , buffer = gl.createBuffer()

  for(var x = 0; x < size - 1; ++x) {
    if(x % 2 === 0) {
      for(var y = 0; y < size; ++y) {
        indices[indices.length] = y + (x * size)
        indices[indices.length] = y + (x * size) + size
      }
      if(x !== (size-2)) {
        indices[indices.length] = --y + (x * size)
      }
    } else {
      for(var y = size-1; y >= 0; --y) {
        indices[indices.length] = y + (x * size)
        indices[indices.length] = y + (x * size) + size
      }
      if(x !== size-2) {
        indices[indices.length] = ++y + (x * size)
      }
    }
  }

  var len = indices.length
    , TypedArray =  len < 0xFF   ? Uint8Array  :
                    len < 0xFFFF ? Uint16Array :
                    Int32Array
    , Type =        len < 0xFF         ? gl.UNSIGNED_BYTE :
                    len < 0xFFFF       ? gl.UNSIGNED_SHORT :
                    gl.INT

  indices = new TypedArray(indices)

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)

  buffer.draw = function() {
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer)
    gl.drawElements(gl.TRIANGLE_STRIP, len, Type, 0)
  }

  return buffer
}

Resources.prototype.build_heightmap = function(size) {
  size = next_power_of_two(size)
  var cvs = document.createElement('canvas')
  return terrainGeneration(cvs, size, 0 * Pi/180, 30*Pi/180)
}

function init (canvas, size, ready) {
  var gl = canvas.getContext('experimental-webgl')
    , resources = new Resources(gl)
    , camera = new Camera(canvas)
    , vertices
    , elements
    , heightmap
    , tiles = {}
    , wait = []

  camera.setup_events()
  vertices = resources.build_vertices(128)
  elements = resources.build_indices(128)
  heightmap = resources.load_texture(resources.build_heightmap(size), {mag:'nearest', min:'nearest'})

  var store = function(what) {
    wait.push(what) 
    return function(err, data) { 
      wait.splice(wait.indexOf(what, 1))
      tiles[what] = data
      wait.length === 0 && ready(gl, resources, camera, vertices, elements, heightmap, tiles)
    } 
  }
  resources.fetch_load_texture('/fpsjs/media/img/terrain_1.jpg', store('tile_1'))
  resources.fetch_load_texture('/fpsjs/media/img/terrain_0.jpg', store('tile_0'))
  resources.fetch_load_texture('/fpsjs/media/img/terrain_2.png', store('tile_2'))

}

var terrain_vertex_shader = function() {/*
  precision highp float;

  attribute vec2 a_position;

  uniform sampler2D u_heightmap;
  uniform float u_height;
  uniform float u_size;
  uniform int   u_patch_offset_x;
  uniform int   u_patch_offset_y;

  uniform mat4 u_model_matrix;
  uniform mat4 u_projection_matrix;

  varying vec2 v_texcoord;
  varying float v_height;
  varying float v_shadow;

  void main(void) {
    vec2 position = a_position + vec2(127.0 * float(u_patch_offset_x), 127.0 * float(u_patch_offset_y)); 
    float size = u_size;

    vec4 h_0_0 = texture2D(u_heightmap, position/size);
    vec4 h_1_0 = texture2D(u_heightmap, (position+vec2(1.0, 0.0))/size);
    vec4 h_1_1 = texture2D(u_heightmap, (position+vec2(1.0, 1.0))/size);
    vec4 h_0_1 = texture2D(u_heightmap, (position+vec2(0.0, 1.0))/size);

    vec4 agg = (h_0_0 + h_1_0 + h_1_1 + h_0_1) / 4.0;
    float height = agg.x;
    float shadow = agg.y;

    gl_Position = u_projection_matrix * u_model_matrix * vec4(
      position.x / 2.0,
      height * u_height,
      position.y / 2.0,
      1.0
    );

    v_height = height;
    v_shadow = shadow;
    v_texcoord = a_position / 16.0;
  }
*/}.shader()

var terrain_fragment_shader = function() {/*
  precision highp float;

  varying vec2 v_texcoord;
  varying float v_height;
  varying float v_shadow;

  uniform sampler2D u_tile_0;
  uniform sampler2D u_tile_1;
  uniform sampler2D u_tile_2;

  void main(void) {
    float PI = 3.141592653589793;

    float tile_0 = v_height * v_height;
    float tile_1 = 1.0 + -tile_0;

    vec4 tile_0_tex = texture2D(u_tile_0, v_texcoord);
    vec4 tile_1_tex = texture2D(u_tile_1, v_texcoord);

    gl_FragColor = (tile_0_tex * tile_0 +
                   tile_1_tex * tile_1) - vec4(v_shadow, v_shadow, v_shadow, 0.0);
  }
*/}.shader()

function start (canvas, size) {
  init(canvas, size, function(gl, resources, camera, vertices, elements, heightmap, tiles) {
    var program = resources.load_shader(terrain_vertex_shader, terrain_fragment_shader)
      , uniforms = [ 'u_heightmap', 'u_height', 'u_size', 'u_model_matrix', 'u_projection_matrix'
                   , 'u_tile_0', 'u_tile_1', 'u_tile_2', 'u_patch_offset_x', 'u_patch_offset_y'].reduce(function(lhs, rhs) {
                      lhs[rhs] = gl.getUniformLocation(program, rhs)
                      return lhs
                   }, {})

    var pre = document.createElement('pre')
      , now = Date.now()
      , new_now
      , dt

    document.body.appendChild(pre)
 
    gl.clearColor(0, 0, 0, 1.0)
    gl.enable(gl.DEPTH_TEST)
    requestAnimFrame(function draw() {

      new_now = Date.now()
      dt = (new_now - now) / 1000
      now = new_now
    
      camera.tick(dt)

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      gl.useProgram(program)

      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, heightmap)
      gl.uniform1i(uniforms.u_heightmap, 0)

      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, tiles.tile_0)
      gl.uniform1i(uniforms.u_tile_0, 1)

      gl.activeTexture(gl.TEXTURE2)
      gl.bindTexture(gl.TEXTURE_2D, tiles.tile_1)
      gl.uniform1i(uniforms.u_tile_1, 2)

      gl.activeTexture(gl.TEXTURE3)
      gl.bindTexture(gl.TEXTURE_2D, tiles.tile_2)
      gl.uniform1i(uniforms.u_tile_2, 3)

      gl.uniform1f(uniforms.u_height, 16.0)
      gl.uniform1f(uniforms.u_size, size)

      gl.uniformMatrix4fv(uniforms.u_model_matrix, false, camera.get_model_matrix())
      gl.uniformMatrix4fv(uniforms.u_projection_matrix, false, camera.get_projection_matrix())

      vertices.enable()
      for(var x = 0, len = size/128; x < len; ++x) {
        gl.uniform1i(uniforms.u_patch_offset_x, x)
        for(var y = 0; y < len; ++y) {
          gl.uniform1i(uniforms.u_patch_offset_y, y)
          elements.draw()
        }
      }

      pre.innerText = ['x','y','z','r_x','r_y'].map(function(key) {
        return key + ':\t\t' + camera[key].toFixed(2)
      }).join('\n')
      requestAnimFrame(draw, canvas)
    }, canvas)
  })
}

