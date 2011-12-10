if(typeof define !== 'undefined') {
  define(init)
} else if(typeof module !== 'undefined') {
  module.exports = init()
} else {
  ContextObject = init()
}

function init() {
  function ContextObject(definition, uuid) {
    var self = this
    self.__dirty__ = {} 
    self.__attrs__ = []
    self.__definition__ = definition
    self.__uuid__ = uuid

    definition.keys.forEach(function(key, idx) {
      self.__attrs__[idx] = definition.defaults[key]
    })

    self.__definition__.keys.forEach(function(attr, idx) {
      Object.defineProperty(self, attr, definition.define_property(idx))
    })

    definition.proto(self)
  }

  var proto = ContextObject.prototype

  proto.delete = function() {
    this.__deleted__ = true
  }

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

    var all = full ?
        Object.keys(self.__attrs__) :
        Object.keys(self.__dirty__)

    for(var i = 0, other = self.__attrs__, len = all.length; i < len; ++i) {
      out.push([all[i], other[all[i]]])
    }
    return out
  }
 
  proto.recv_update = function(payload) {
    var self = this
      , dirt = this.__dirty__

    for(var i = 0, attrs = self.__attrs__, len = payload.length; i < len; ++i) {
      attrs[payload[i][0]] = payload[i][1]
      dirt[payload[i][0]] = true
    }
  }

  return ContextObject
}
