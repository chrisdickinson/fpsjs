function Definition(id, def, authority_map) {
  var keys = Object.keys(def).sort().map(function(key, idx) {
    return key
  })

  this.id = id
  this.keys = keys
  this.defaults = def
  this.authority_map = authority_map
  this.constructor.all[id] = this
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
        return (this.__attrs__[idx] = val)  
      }
  }
}

proto.is_authoritative = function(from_context, current_context) {
  var map = this.authority_map.filter(function(item) {
    return item[0] === current_context
  })[0]

  return map[1] === from_context
}

if(typeof define !== 'undefined') 
  define(function() { return Definition })
if(typeof module !== 'undefined') module.exports = Definition
else {
}
