if(typeof module === 'undefined') {
  // noop
} else {
  ContextObject = require('./context_object')
}

function Context(uuid) {
  this.uuid = uuid

  this.id_counter = 0

  this.objects = {}
}

Context.prototype.create_object = function(definition) {
  var id = ++this.id_counter
    , uuid = this.uuid+':'+id
    , obj

  obj = new ContextObject(definition, uuid)
  this.objects[uuid] = obj
  return obj
}

Context.prototype.recv_object = function(definition_id, uuid) {
  console.log('creating ', definition_id, uuid)
  obj = new ContextObject(Definition.lookup(definition_id), uuid)
  this.objects[uuid] = obj
  return obj
}

Context.prototype.create_update = function(full) {
  full = full === undefined ? false : true
  var payload = {}
  for(var i = 0, all=Object.keys(this.objects), len = all.length; i < len; ++i) {
    var deleted = false
    payload[all[i]] = (deleted = this.objects[all[i]].__deleted__) ? 
        [this.objects[all[i]].__definition__.id, 'deleted'] : 
        [this.objects[all[i]].__definition__.id, this.objects[all[i]].send_update(full)]

    if(deleted) {
      delete this.objects[all[i]]
    }
  }
  return payload
}

var UP = 0

Context.prototype.recv_update = function(payload, from_context) {
  for(var i = 0, all=Object.keys(payload), len = all.length, key; key = all[i], i < len; ++i) {
    var def = Definition.lookup(payload[key][0])

    // only apply updates from authoritative contexts.
    if(!def) console.log(payload[key][0])
    if(from_context === this || def.is_authoritative(from_context, this)) {

      if(!this.objects[key]) {
        // create a new object matching the incoming uuid, looking up the definition in the process
        this.recv_object(payload[key][0], key)
      }
      if(payload[key][1] === 'delete') {
        delete this.objects[key]
      } else {
        this.objects[key].recv_update(payload[key][1], from_context)
      }
    }
  }
}

Context.current = function() {
  return this.__context__
}

Context.set = function(ctxt) {
  this.__context__ = ctxt
}

if(typeof module !== 'undefined') {
  module.exports = Context
}
