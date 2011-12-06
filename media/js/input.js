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

  switch(ev.keyCode) { 
  case 87: Z += 0.2; break;
  case 65: X += 0.2; break;
  case 83: Z -= 0.2; break;
  case 68: X -= 0.2; break;
  }
}

Input.events.keyup = function(ev) {
  this.object['key_'+ev.keyCode] = false
}

Input.events.mousemove = function(ev) {
  this.object['mouse_x'] = ev.movementX || ev.webkitMovementX || 0
  this.object['mouse_y'] = ev.movementY || ev.webkitMovementY || 0

  // automatically tell the camera to rotate.
  R += this.object.mouse_x / 100
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
