if(typeof define !== 'undefined') {
  define(init)
} else if(typeof module !== 'undefined') {
  module.exports = init()
} else {
  Input = init()
}


function Input(object, controlling_id, camera) {
  this.object = object
  this.controlling_id = controlling_id
  this.camera = camera
  this.mouselock = false
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

Input.events = {}

Input.events.keydown = function(ev) {
  this.object['key_'+ev.keyCode] = true 
}

Input.events.keyup = function(ev) {
  this.object['key_'+ev.keyCode] = false
}

Input.events.mousemove = function(ev) {
  if(!this.mouselock) return

  this.object.mouse_x += ev.movementX || ev.webkitMovementX || 0
  this.object.mouse_y += ev.movementY || ev.webkitMovementY || 0
}

Input.events.mousewheel = function(ev) {
  this.object.mouse_x += ev.wheelDeltaX / 100
  this.object.mouse_y += ev.wheelDeltaY / 100
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
