if(typeof define !== 'undefined') {
  define(init)
} else if(typeof module !== 'undefined') {
  module.exports = init()
} else {
  ContextObject = init()
}

function init() {
  // definition is either ['attribute', 'attribute2'], etc, in order OR
  // a map with default values (used for making the canonical thin object.
  function ContextObject(definition, uuid) {
    var self = this
    self.__dirty__ = {} 
    self.__attrs__ = []
    self.__definition__ = definition
    self.__uuid__ = uuid

    self.__is_dirty__ = false

    definition.keys.forEach(function(key, idx) {
      self.__attrs__[idx] = definition.defaults[key]
    })

    self.__definition__.keys.forEach(function(attr, idx) {
      Object.defineProperty(self, attr, definition.define_property(idx))
    })

    definition.proto(self)
  }

  ContextObject.get_inject = arguments.callee

  var proto = ContextObject.prototype

  proto.pretty = function() {
    var out = {}
    out.constructor = new Function('return function '+this.__definition__.id+'(){}')()
    for(var i = 0, keys = this.__definition__.keys, len = keys.length; i < len; ++i)
      out[keys[i]] = this[keys[i]]
    return out
  }

  proto.send_update = function(full) {
    var out = [] 
      , self = this
      , last = -Infinity

    var all = full ?
        Object.keys(self.__dirty__) :
        Object.keys(self.__attrs__)

    for(var i = 0, other = self.__attrs__, len = all.length; i < len; ++i) {
      out.push([all[i], other[all[i]]])
    }
    return out
  }
 
  // mirrored objects apply updates. 
  proto.recv_update = function(payload) {
    var self = this
    for(var i = 0, attrs = self.__attrs__, len = payload.length; i < len; ++i) {
      attrs[payload[i][0]] = payload[i][1]
    }
    // clear the dirt.
    delete self.__dirty__
    self.__dirty__ = {}
  }

  return ContextObject
}
