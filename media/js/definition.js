function init() {
  function Definition(id, def) {
    var keys = Object.keys(def).sort().map(function(key, idx) {
      return key
    })

    this.id = id
    this.keys = keys
    this.defaults = def
    this.authority_map = []
    this.constructor.all[id] = this
    this.authority_def = function(){}
    this.proto = function(o){ return o } 
  }

  Definition.all = {}

  Definition.lookup = function (id) {
    return this.all[id]
  }

  var proto = Definition.prototype

  proto.define_property = function(idx) {
    return {
        get: function() { return this.__attrs__[idx] }
      , set: function(val) {
          this.__dirty__[idx] = true
          this.__is_dirty__ = true
          return (this.__attrs__[idx] = val)  
        }
    }
  }

  proto.set_proto  = function(fn) {
    this.proto = fn
  }

  proto.is_authoritative = function(from_context, current_context) {
    return this.authority_def(from_context, current_context)
  }

  proto.define_authority = function(fn) {
    var self = this
    self.authority_def = fn
  }

  return Definition
}
if(typeof define !== 'undefined') 
  define(function() { return init() })
if(typeof module !== 'undefined')
  module.exports = init
else {
  Definition = init()
}
