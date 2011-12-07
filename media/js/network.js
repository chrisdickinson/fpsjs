function Network() {
  this.listeners = {}

  this.ack = {}
}

var proto = Network.prototype

proto.init = function(context, ready) {
  this.context = context

  this.socket = io.connect('http://localhost:8000')

  var self = this
  this.socket.on('update', function() {
    var args = [].slice.call(arguments)
    ;(self.listeners.update || []).forEach(function(listener) {
      listener.apply(self, args)
    })
  })

  this.socket.on('ack', function(data) {
    var responder = self.ack[data.ack]
    if(responder) {
      console.log(data)
      delete self.ack[data.ack]
      responder.apply(null, data.data)
    }
  })

  ready()
}

proto.send = function(what, data, ready) {
  if(ready) {
    var msgid = Date.now()
    this.ack[msgid] = ready
    data = {'ack':msgid, 'data':data}
  }

  this.socket.emit(what, data)
}

proto.on = function(name, fn) {
  (this.listeners[name] = (this.listeners[name] || [])).push(fn)
  return this
}

if(typeof define !== 'undefined') {
  define(function() { return new Network })
} else if(typeof module !== 'undefined') {
  module.exports = Network 
} else {
  network = new Network
}
