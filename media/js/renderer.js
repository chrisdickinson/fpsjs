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

function Renderer(input_class) {
  this.ctxt = null
  this.canvas = null
  this.renderables = []

  this.input_class = input_class
  //
  this.textures = {} 
  this.models = {}

  //
  this.camera = null
  this.input = null
  this.worker = null
  this.network = null
}

var proto = Renderer.prototype


proto.init = function(worker, ready) {

  var self = this
  self.worker = worker

  var canvas = document.getElementById('canvas')
    , ctxt = canvas.getContext('experimental-webgl')

  self.canvas = canvas
  self.ctxt = ctxt

  this.ctxt.clearColor(0.5, 0.5, 0.5, 1.0);
  worker.onmessage = function(ev) {
    if(ev.data.context === CONTEXTS.Thread.uuid) {
      CONTEXTS.RendererLoop.recv_update(ev.data.payload, CONTEXTS.Thread)
      for(var key in CONTEXTS.RendererLoop.objects) {
        var item = CONTEXTS.RendererLoop.objects[key]
        if(item.renderable && !item.__renderer__) {
          self.renderables.push(item)
          item.__renderer__ = true
        }
      }

      // remove deleted renderables
      self.renderables = self.renderables.filter(function(item) {
        return !!CONTEXTS.RendererLoop.objects[item.__uuid__]
      })
    } else if(ev.data.channel === 'log') {
      console.log.apply(console, ['THREAD'].concat(ev.data.data))
    } else if(ev.data.channel === 'error') {
      console.error.apply(console, ['THREAD'].concat(ev.data.data))
    }
  }
  self.ctxt.blendFunc(self.ctxt.SRC_ALPHA, self.ctxt.ONE_MINUS_SRC_ALPHA)
  self.ctxt.enable(self.ctxt.DEPTH_TEST)
  self.ctxt.disable(self.ctxt.CULL_FACE)
  self.ctxt.enable(self.ctxt.BLEND)
  ready()
}

proto.clear = function() {
  var gl = this.ctxt
  gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  // eeeh.
}

proto.load_texture = function(key, value, ready) {

  var self = this
    , gl = self.ctxt
    , texture = gl.createTexture()
    , mipmapped = true

  texture.image = new Image
  texture.image.onload = function() {
    mipmapped = texture.image.width == texture.image.height && (texture.image.width & (texture.image.width-1)) === 0;
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image)
    
    if(mipmapped)
      gl.generateMipmap(gl.TEXTURE_2D)

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mipmapped ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR)

    texture.use = function(on_tmu, as) {
      gl.activeTexture(gl['TEXTURE'+(on_tmu||0)])
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.uniform1i(as, on_tmu||0)
    }

    self.textures[key] = texture
    console.log('got texture at '+value+' as '+key)
    ready()
  }

  texture.image.onerror = function() {
    console.error('could not fetch '+key)
    ready()
  }

  texture.image.src = value
}

proto.load_model = function(key, value, ready) {
  var model_xhr = new XMLHttpRequest
    , self = this
    , gl = self.ctxt


  model_xhr.onreadystatechange = function() {
    if(model_xhr.readyState === 4)
      build_model(JSON.parse(model_xhr.responseText))
  }

  model_xhr.open('GET', value)
  model_xhr.send(null)

  var types = {
    'TRIANGLE_STRIP':gl.TRIANGLE_STRIP
  }

  function build_model(data) {
    var model = {}
      , draw_calls 

    model.draw = function(renderer) {
      for(var i = 0, len = draw_calls.length; i < len; ++i) {
        draw_calls[i](renderer)
      }
    }

    draw_calls = data.map(function(draw_call) {
      var element_buffer = gl.createBuffer()
        , steps = []
        , element_buffer_bits = []
        , attrib_location = 0
        , kind = types[draw_call.type]

      if(draw_call.data.position) {
        var vertices = draw_call.data.position.length/3
          , vertex_buffer = gl.createBuffer()

        for(var i = 0; i < vertices; ++i) {
          element_buffer_bits.push(i)
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(draw_call.data.position), gl.STATIC_DRAW)

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, element_buffer)
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(element_buffer_bits), gl.STATIC_DRAW)

        steps.push(function(loc) {
            return function() {
              gl.enableVertexAttribArray(loc)
              gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer)
              gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0)
              gl.bindAttribLocation(self.current_program, loc, "a_position")
            }
        }(attrib_location++)) 
      }

      if(draw_call.data.texcoord) {
        var texcoord_buffer = gl.createBuffer()

        gl.bindBuffer(gl.ARRAY_BUFFER, texcoord_buffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(draw_call.data.texcoord), gl.STATIC_DRAW)

        steps.push(function(loc) {
            return function() {
              gl.enableVertexAttribArray(loc)
              gl.bindBuffer(gl.ARRAY_BUFFER, texcoord_buffer)
              gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
              gl.bindAttribLocation(self.current_program, loc, "a_texcoord")
            }
        }(attrib_location++)) 
      }

      if(draw_call.data.normal) {
        var normal_buffer = gl.createBuffer()

        gl.bindBuffer(gl.ARRAY_BUFFER, normal_buffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(draw_call.data.normal), gl.STATIC_DRAW)

        steps.push(function(loc) {
            return function() {
              gl.enableVertexAttribArray(loc)
              gl.bindBuffer(gl.ARRAY_BUFFER, normal_buffer)
              gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0)
              gl.bindAttribLocation(self.current_program, loc, "a_normal")
            }
        }(attrib_location++)) 
      }

      steps.push(function() {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, element_buffer)
        gl.drawElements(kind, element_buffer_bits.length, gl.UNSIGNED_SHORT, 0)
      })

      return function(renderer) {
        for(var i = 0, len = steps.length; i < len; ++i)
          steps[i](renderer)
      }
    })

    console.log('got model at '+value+' as '+key)
    self.models[key] = model 
    ready()
  }
}

proto.load_program = function(key, value, ready) {
  var fs_xhr = new XMLHttpRequest
    , vs_xhr = new XMLHttpRequest
    , countdown = 2
    , self = this
    , gl = self.ctxt

  function orsc (xhr) {
    if(xhr.readyState === 4) {
      --countdown === 0 &&
      build_program()
    }
  }

  console.log('got program at '+value+' as '+key)
  fs_xhr.onreadystatechange = orsc.bind(null, fs_xhr)
  vs_xhr.onreadystatechange = orsc.bind(null, vs_xhr)

  fs_xhr.open('GET', value.fs)
  vs_xhr.open('GET', value.vs)

  fs_xhr.send(null); vs_xhr.send(null) 

  function build_program() {
    var fs = gl.createShader(gl.FRAGMENT_SHADER)
      , vs = gl.createShader(gl.VERTEX_SHADER)
      , program = gl.createProgram()

    gl.shaderSource(fs, fs_xhr.responseText)
    gl.shaderSource(vs, vs_xhr.responseText)
    gl.compileShader(fs)
    gl.compileShader(vs)

    if(!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      console.error('could not compile fragment shader '+key, gl.getShaderInfoLog(fs))
    }

    if(!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
      console.error('could not compile vertex shader '+key, gl.getShaderInfoLog(vs))
    }

    gl.attachShader(program, vs)
    gl.attachShader(program, fs)

    gl.linkProgram(program)

    if(!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('could not link shader '+key)
    }

    program.uniforms = {}

    var re = /\s*uniform\s*([\w\d]+)\s*([\w\d]+);/g
      , type_map = {
          vec2:       'uniform2fv'
        , vec3:       'uniform3fv'
        , vec4:       'uniform4fv'
        , mat4:       'uniformMatrix4fv'
        , float:      'uniform1f'
        , int:        'uniform1i'
        , sampler2D:  'uniform1i'
      }

    var create_uniforms = function(all, type, name) {
      var method = type_map[type]
        , ulocation = gl.getUniformLocation(program, name)
      if(method) {
        var fn = function() {
          gl[method].apply(gl, [ulocation].concat([].slice.call(arguments)))
        }
        if(type === 'sampler2D') {
          fn = function(str, on) {
            var tex = self.textures[str]
            gl.activeTexture(gl['TEXTURE'+(on||0)])
            gl.bindTexture(gl.TEXTURE_2D, tex)
            gl.uniform1i(ulocation, on)
          }
        }

        // uniform vec3 u_color -> program.set_color(0.3, 0.3, 0.3)
        program['set_'+name.replace('u_', '')] = fn
      }
    }
    fs_xhr.responseText.replace(re, create_uniforms)
    vs_xhr.responseText.replace(re, create_uniforms)

    program.enable = function() {
      gl.useProgram(program)
      self.current_program = program
    } 

    self.programs[key] = program
    console.log(key, self.programs[key])
    ready()
  }
}

proto.load = function(manifest, ready) {
  // {textures:{name:source}
  // ,programs:{name:{fs:<source>,vs:<source>}}
  // ,models:{name:source}}

  var textures_done = Object.keys(manifest.textures || {}).length
    , programs_done = Object.keys(manifest.programs || {}).length
    , models_done = Object.keys(manifest.models || {}).length
    , self = this
    , done = function() {
      !textures_done && !programs_done && !models_done &&
        ready()
      }
  self.programs = {}
  self.textures = {}
  self.models = {}

  Object.keys(manifest.textures || {}).forEach(function(key, value) {
    self.load_texture(key, manifest.textures[key], function() { --textures_done; done() })
  })

  Object.keys(manifest.programs || {}).forEach(function(key, value) {
    self.load_program(key, manifest.programs[key], function() { --programs_done; done() })
  })

  Object.keys(manifest.models || {}).forEach(function(key, value) {
    self.load_model(key, manifest.models[key], function() { --models_done; done() })
  })

  done()
}

function Camera(tied_to, canvas) {
  var self = this
  
  self.canvas = canvas
  self._model_matrix = mat4.create()
  self._projection_matrix = mat4.create()
  self.eye_position = [0, 0, 0, 0]

  self._projection_matrix = mat4.identity(self._projection_matrix) 
  self._model_matrix = mat4.identity(self._model_matrix) 
  mat4.perspective(45, self.canvas.width / self.canvas.height, 0.1, 100, self._projection_matrix)

  self.stack = [{
    model:      self._model_matrix
  , projection: self._projection_matrix
  }]

  Object.defineProperty(self, 'model_matrix', {
    get : function() { return self.stack[self.stack.length-1].model }
  })


  Object.defineProperty(self, 'projection_matrix', {
    get : function() { return self.stack[self.stack.length-1].projection }
  })
}

Camera.prototype.push_state = function() {
  this.stack.push({
      model:      mat4.create(this.model_matrix)
    , projection: mat4.create(this.projection_matrix)
  })
}

Camera.prototype.pop_state = function() {
  this.stack.pop()
}

Camera.prototype.scale = function(x, y, z) {
  mat4.scale(this.model_matrix, [x, y, z])
}

Camera.prototype.rotate = function(x, y, z, r) {
  mat4.rotate(this.model_matrix, r, [x,y,z]) 
}

Camera.prototype.translate = function(x, y, z) {
  mat4.translate(this.model_matrix, [x, y, z])
}

X = Y = Z = R = 0
proto.start = function(controlling_id, network, worker, all_data) {

  var controlling = controlling_id ? CONTEXTS.RendererLoop.objects[controlling_id] : null
    , self = this

  self.camera = new Camera(controlling, self.canvas)
  self.input = new this.input_class(CONTEXTS.RendererLoop.create_object(Definition.all.Input), controlling_id, self.camera)

  var events = this.input.events()
  for(var key in events) {
    document.addEventListener(key, events[key])
  }

  var now = Date.now()
    , new_now
    , avg = 0
    , samples = 0
    , dt
    , update = 0

  var elem = document.createElement('p')
  document.body.appendChild(elem)

  setInterval(function() {
    elem.innerHTML = 'hey: '+(avg / samples).toFixed(2)+' between cycles; '+(update/samples).toFixed(2)+' creating updates'
  })

  requestAnimFrame(function iter() {
    controlling = controlling || (controlling_id ? CONTEXTS.RendererLoop.objects[controlling_id] : null)
    var player = controlling && controlling.player_id && CONTEXTS.RendererLoop.objects[controlling.player_id]

    new_now = Date.now()
    dt = new_now - now
    now = new_now

    avg += dt
    samples += 1

    // redraw ALL THE THINGS 
    self.clear()

    self.camera.push_state()

    if(player) {
      self.camera.rotate(0, 1, 0, player.r0)
      self.camera.translate(player.x, Y-4, player.z)
    }
    for(var i = 0, len = self.renderables.length; i < len; ++i) {
      self.renderables[i].render(self)
    }
    self.camera.pop_state()

    var payload = CONTEXTS.RendererLoop.create_update(CONTEXTS.Network)

    if(payload) {
      worker.postMessage({
          context:CONTEXTS.RendererLoop.uuid
        , payload:payload
      })
      network.send('update', payload)
    }

    update += Date.now() - now
    requestAnimFrame(iter, self.canvas)
  }, self.canvas)

  network.on('update', function(payload) {
    worker.postMessage({
        context:CONTEXTS.Network.uuid
      , payload:payload
    })
  })
}

if(typeof define !== 'undefined') {
define(['./input.js'], function(Input) {
    return new Renderer(Input)
})
} else if(typeof module !== 'undefined') {
  module.exports = Renderer
} else {
  
}
