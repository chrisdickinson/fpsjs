if(typeof define !== 'undefined') {
  define(init)
} else if(typeof module !== 'undefined') {
  module.exports = init()
} else {
  Input = init()
}


function Input(object, controlling, camera) {
  this.object = object
  this.controlling = controlling
  this.camera = camera
}

var proto = Input.prototype

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
  this.object['mouse_x'] = ev.movementX || ev.webkitMovementX || 0
  this.object['mouse_y'] = ev.movementY || ev.webkitMovementY || 0

  // automatically tell the camera to rotate.
  this.camera.rotate(this.object['mouse_x'], this.object['mouse_y'])
}

Input.events.mousedown = function(ev) {
  this.object['mouse_0'] = true 
}

Input.events.mouseup = function(ev) {
  this.object['mouse_0'] = false
}

function init() {
  return Input
}
