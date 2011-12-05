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

  worker.onmessage = function(ev) {
    if(ev.data.context === CONTEXTS.Thread.uuid) {
      CONTEXTS.RendererLoop.recv_update(ev.data.payload, CONTEXTS.Thread)

      // keep the local thread updated.
      CONTEXTS.Thread.recv_update(ev.data.payload, CONTEXTS.Thread)
    } else if(ev.data.channel === 'log') {
      console.log.apply(console, ['THREAD'].concat(ev.data.data))
    } else if(ev.data.channel === 'error') {
      console.error.apply(console, ['THREAD'].concat(ev.data.data))
    }
  }

  ready()
}

proto.clear = function() {
  // eeeh.
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
    self.load_texture(key, value, done)
  })

  Object.keys(manifest.programs || {}).forEach(function(key, value) {
    self.load_program(key, value, done)
  })

  Object.keys(manifest.models || {}).forEach(function(key, value) {
    self.load_model(key, value, done)
  })

  done()
}

function Camera() {
  
}

proto.start = function(controlling_id, network, worker, all_data) {

  var controlling = controlling_id ? Renderer.objects[controlling_id] : null
    , self = this

  self.camera = new Camera(controlling)
  self.input = new this.input_class(CONTEXTS.RendererLoop.create_object(Definition.all.Input), controlling, self.camera)

  requestAnimFrame(function iter() {

    // redraw ALL THE THINGS 
    self.clear()
    for(var i = 0, len = self.renderables.length; i < len; ++i) {
      renderables[i].render(self.camera)
    }

    var payload = CONTEXTS.RendererLoop.create_update()
    network.send('update', payload, function() {
      // no ack necessary.  
    })
    worker.postMessage({
        context:CONTEXTS.RendererLoop.uuid
      , payload:payload
    })

    requestAnimFrame(iter, canvas)
  }, canvas)

  network.on('update', function(payload) {
    console.log('GOT UPDATE', CONTEXTS.Network.uuid)
    worker.postMessage({
        context:Network.uuid
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
