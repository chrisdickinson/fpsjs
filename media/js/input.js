if(typeof define !== 'undefined') {
  define(init)
} else if(typeof module !== 'undefined') {
  module.exports = init()
} else {
  Input = init()
}


function Input(object, controlling_id, camera, canvas, change_size) {
  this.object = object
  this.controlling_id = controlling_id
  this.camera = camera
  this.mouselock = false
  this.canvas = canvas
  this.change_size = change_size
}

var proto = Input.prototype

proto.controlling = function() {
  return CONTEXTS.RendererLoop.objects[this.controlling_id]
}

proto.events = function() {
  var self = this
  return Object.keys(Input.events).map(function(key) {
    return [key, Input.events[key].bind(self)]
  }).reduce(function(lhs, rhs) { lhs[rhs[0]] = rhs[1]; return lhs; }, {}) 
}

var noop = function() {}
Input.events = {}

Input.events.keydown = function(ev) {
  this.object['key_'+ev.keyCode] = true 
}


Input.events.keyup = function(ev) {
  if((navigator.webkitPointer || navigator.mozPointer || navigator.pointer) && ev.keyCode === 192) {
    if(document.fullScreen) {
      ;(document.cancelFullScreen ||
      document.mozCancelFullScreen ||
      document.webkitCancelFullScreen ||
      noop).call(document)
    } else {
      ;(this.canvas.requestFullScreen ||
      this.canvas.mozRequestFullScreen ||
      this.canvas.webkitRequestFullScreen ||
      noop).call(this.canvas, Element.ALLOW_KEYBOARD_INPUT)
    }
    return
  }
  this.object['key_'+ev.keyCode] = false
}

Input.events.fullscreenchange = 
Input.events.mozfullscreenchange = 
Input.events.webkitfullscreenchange = function(ev) {
  this.mouselock = document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen

  var pointer = 
    navigator.webkitPointer ||
    navigator.mozPointer ||
    navigator.pointer 

  if(pointer && this.mouselock) {
    pointer.lock(this.canvas)
  }

  if(this.mouselock) {
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
    this.camera.reset_matrices()
  } else {
    this.canvas.width = 640
    this.canvas.height = 480
    this.camera.reset_matrices()
  }

  this.change_size()
}

Input.events.mousemove = function(ev) {
  if(!this.mouselock) return

  this.object.mouse_x += (ev.movementX || ev.webkitMovementX || 0) / 10
  this.object.mouse_y += (ev.movementY || ev.webkitMovementY || 0) / 10
}

Input.events.mousewheel = function(ev) {
  if(this.mouselock) return

  this.object.mouse_x += ev.wheelDeltaX / 100
  // this.object.mouse_y += ev.wheelDeltaY / 100
  ev.preventDefault()
}

Input.events.mousedown = function(ev) {
  ev.preventDefault()
  this.object['mouse_0'] = true 
}

Input.events.mouseup = function(ev) {
  ev.preventDefault()
  this.object['mouse_0'] = false
}

Input.events.contextmenu = function(ev) {
  ev.preventDefault()
}

function init() {
  return Input
}
