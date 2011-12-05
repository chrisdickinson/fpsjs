if(typeof module === 'undefined') {
  // noop
} else {
  ContextObject = require('./context_object')
}

function Context(uuid, definition_class) {
  this.uuid = uuid

  this.id_counter = 0

  this.objects = {}

  this.definition_class = definition_class
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
  obj = new ContextObject((this.definition_class || Definition).lookup(definition_id), uuid)
  this.objects[uuid] = obj
  return obj
}

Context.prototype.create_update = function(for_context, full) {
  full = full === undefined ? false : true
  var payload = {}
    , def
    , deleted
    , item
    , valid = false

  for(var i = 0, all=Object.keys(this.objects), len = all.length, item=this.objects[all[i]]; i < len; ++i) {
    def = item.__definition__

    deleted = item.__deleted__
    if(full || (def.is_authoritative(this, for_context) && item.__is_dirty__)) {
      payload[all[i]] = deleted ? 
          [item.__definition__.id, 'deleted'] : 
          [item.__definition__.id, item.send_update(full)]

      item.__is_dirty__ = false
      valid = true
    }
    if(deleted) {
      delete this.objects[all[i]]
    }
  }
  if(!valid) return

  return payload
}

var UP = 0

Context.prototype.recv_update = function(payload, from_context) {
  for(var i = 0, all=Object.keys(payload), len = all.length, key; key = all[i], i < len; ++i) {
    var def = (this.definition_class || Definition).lookup(payload[key][0])

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
