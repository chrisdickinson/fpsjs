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
  }

  Definition.all = {}

  Definition.define_authority = function(contexts) {
    var self = this
    Object.keys(self.all).forEach(function(key) {
      console.log('defining authority for '+key, contexts)
      self.all[key].authority_def(contexts)
    })
  }

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

  proto.is_authoritative = function(from_context, current_context) {
    return this.authority_map.filter(function(item) {
      return item[0] === current_context
    }).reduce(function(lhs, rhs) {
      return lhs && (rhs[1] === from_context || rhs[1] === undefined)
    }, true)
  }

  proto.define_authority = function(fn) {
    var self = this
    self.authority_def = function(contexts) {
      self.authority_map = fn(contexts)
    }
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
