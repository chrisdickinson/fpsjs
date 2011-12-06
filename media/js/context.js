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

  // automatically set new objects as "dirty"
  obj.__definition__.keys.forEach(function(key) {
    obj[key] = obj[key]
  })
  return obj
}

Context.prototype.recv_object = function(definition_id, uuid) {
  obj = new ContextObject((this.definition_class || Definition).lookup(definition_id), uuid)
  this.objects[uuid] = obj

  // automatically set new objects as "dirty"
  obj.__definition__.keys.forEach(function(key) {
    obj[key] = obj[key]
  })

  return obj
}

Context.prototype.pretty = function() {
  var self = this
  return Object.keys(self.objects).map(function(key) {
    var out = self.objects[key].pretty()
    out.ID = key
    return out
  })
}

Context.prototype.create_full_update = function() {
  var payload = {}
    , def
    , deleted
    , item

  for(var i = 0, all=Object.keys(this.objects), len = all.length; item=this.objects[all[i]], i < len; ++i) {
    def = item.__definition__

    deleted = item.__deleted__
    if(!deleted)
      payload[all[i]] = [item.__definition__.id, item.send_update(true)]
  }

  return payload
}

Context.prototype.create_update = function(for_context, full) {
  if(full) return this.create_full_update()

  var payload = {}
    , def
    , deleted
    , item
    , valid = false

  for(var i = 0, all=Object.keys(this.objects), len = all.length; item=this.objects[all[i]], i < len; ++i) {
    def = item.__definition__

    deleted = item.__deleted__
    if(def.is_authoritative(this, for_context) && item.__is_dirty__) {
      payload[all[i]] = deleted ? 
          [item.__definition__.id, 'deleted'] : 
          [item.__definition__.id, item.send_update()]

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
      console.log((from_context&&from_context.uuid)+': updating '+def.id, payload[key][1])
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
