var Context         = require('../media/js/context')
  , ContextObject   = require('../media/js/context_object')
  , init_definition = require('../media/js/definition')
  , init_game_defs  = require('../media/js/game_defs')
  , uuid            = require('node-uuid')
  , url             = require('url')

var games = {}

function Game(id, name, map_name) {
  this.id = id
  this.name = name
  this.map_name = map_name

  this.definition_class = init_definition()
  this.context = new Context(this.id, this.definition_class)
  this.defs = init_game_defs(this.definition_class, [this.context])
  this.definition_class.define_authority({Network:this.context})

  this.clients = {}
}

Game.prototype.send_all = function(what, data) {
  var self = this
  Object.keys(this.clients).forEach(function(id) {
    self.clients[id].socket.emit(what, data)
  })
}

Game.prototype.join = function(client_id, socket, ack_id) {
  this.clients[client_id] = {
      socket  :socket
    , context :new Context(client_id)
  }

  var player = this.context.create_object(this.defs.Player)
    , self = this

  // this hits everyone but the incoming socket, really.
  this.send_all('update', this.context.create_update({uuid:null}))

  socket.emit('ack', {ack:ack_id, data:[
    null, {}, player.id, self.context.create_update(this.clients[client_id].context, true) 
  ]})

  socket.on('update', function(payload) { self.recv_update(payload, self.clients[client_id].context) }) 
}

Game.prototype.recv_update = function(update, from_context) {
  console.log('got update from '+from_context.uuid+'; len='+Object.keys(update).length)
  this.context.recv_update(update, from_context)
}

Game.prototype.get_absolute_url = function() {
  return '/games/'+this.id
}

Game.prototype.create_client_uuid = function() {
  var arr = new Array(16)
  return uuid.v4(null, arr, 0).map(function(i) { return i.toString(16) }).join('')
}

module.exports = {
  list:function(template, req, resp) {
    template.render({games:games}, function(err, data) {
      resp.writeHead(200, {'Content-Type':'text/html'})
      resp.end(data)
    })
  }
  , create:function(template, req, resp) {
    var data = []
    req.on('data', data.push.bind(data))
    req.on('end', function() {
      data = url.parse('/?'+data.join(''), true).query

      var my_uuid = new Array(16)
      my_uuid = uuid.v4(null, my_uuid, 0)
        .map(function(i) { return i.toString(16) })
        .join('')
      games[my_uuid] = new Game(my_uuid, data.name, data.map)

      resp.writeHead(302, {Location:'/games/'+my_uuid})
      resp.end()
    })
  }
  , join:function(template, req, resp, which) {
    var game = games[which]
    if(!game) {
      resp.writeHead(404, {'Content-Type':'text/html'})
      return resp.end('<h1>not found</h1>')
    }
    template.render({game:game}, function(err, data) {
      resp.writeHead(200, {'Content-Type':'text/html'})
      resp.end(data)
    })
  }
  , socket_join:function(game_id, client_id, socket, ack) {
    var game = games[game_id]
    if(!game) return

    game.join(client_id, socket, ack)  
  }
}
