var Context         = require('../media/js/context')
  , ContextObject   = require('../media/js/context_object')
  , init_definition = require('../media/js/definition')
  , init_game_defs  = require('../media/js/game_defs')
  , BaseGame        = require('../media/js/game')
  , uuid            = require('node-uuid')
  , url             = require('url')
  , missions        = require('./missions')

Number.prototype.degrees = function() {
  return this * (Math.PI / 180)
}

var games = {}

function Game(id, name, map_name) {
  this.id = id
  this.name = name
  this.mission = missions[map_name]

  this.definition_class = init_definition()
  this.context = new Context(this.id, this.definition_class)

  this.context.is_network = true

  this.defs = init_game_defs(this.definition_class, [this.context])
  this.game = new BaseGame(this.context)

  this.game.thread_loop(this.interval(), 33)

  var self = this
  this.mission.load(function(name, values) {
    var obj = self.context.create_object(self.definition_class.all[name])
    for(var key in values) {
      obj[key] = values[key]
    }
  }, this.mission.assets)

  this.clients = {}
}

Game.prototype.interval = function() {
  var self = this
    , ctxt = this.context

  return function(dt) {
    Object.keys(ctxt.objects).forEach(function(key) {                                                                                             
      var item = ctxt.objects[key]                                                                                                                
      item.update && item.update(ctxt, dt)                                                                                                           
    })
    var all = self.context.create_update({uuid:null, is_thread:true})
    if(all) {
      self.send_all('update', all)
      self.context.clean()
    }
  }
}

Game.prototype.send_all = function(what, data) {
  var self = this
  Object.keys(this.clients).forEach(function(id) {
    self.clients[id].socket.emit(what, data)
  })
}

Game.prototype.join = function(screenname, client_id, socket, ack_id) {
  this.clients[client_id] = {
      socket  :socket
    , context :new Context(client_id)
  }

  this.clients[client_id].context.is_renderer = true

  var control = this.context.create_object(this.defs.Control)
    , self = this

  control.player_id = null
  control.input_id = client_id+':1'
  control.handle = screenname

  var update = self.context.create_full_update()

  self.clients[client_id].control = control

  socket.emit('ack', {ack:ack_id, data:[
    null, self.mission.assets, control.__uuid__, update 
  ]})

  socket.on('update', function(payload) { self.recv_update(payload, self.clients[client_id].context) })
  socket.on('disconnect', function() {
    // remove the control and the player object.
    if(self.context.objects[control.player_id]) {
      self.context.objects[control.player_id].delete()
    }
    control.delete()
  }) 
}

Game.prototype.recv_update = function(update, from_context) {
  this.context.recv_update(update, from_context)
}

Game.prototype.get_absolute_url = function() {
  return '/games/'+this.id
}

Game.prototype.create_client_uuid = function() {
  var arr = new Array(16)
  return uuid.v4(null, arr, 0).map(function(i) { return i.toString(16) }).join('')
}

// export the controllers and the socket method for joining a game.
module.exports = {
  // list all the available games.
  list:function(template, req, resp) {
    template.render({games:games, missions:missions}, function(err, data) {
      resp.writeHead(200, {'Content-Type':'text/html'})
      resp.end(data)
    })
  }
  // create a new game.
  , create:function(template, req, resp) {
    data = req.body

    if(!missions[data.map]) {
      resp.writeHead(302, {Location:'/'})
      return resp.end()
    }

    var my_uuid = new Array(16)
    my_uuid = uuid.v4(null, my_uuid, 0)
      .map(function(i) { return i.toString(16) })
      .join('')
    games[my_uuid] = new Game(my_uuid, data.name, data.map)

    resp.writeHead(302, {Location:'/games/'+my_uuid})
    resp.end()
  }
  // join an existing game.
  , join:function(template, req, resp, which) {
    var game = games[which]
    if(!game) {
      resp.writeHead(404, {'Content-Type':'text/html'})
      return resp.end('<h1>not found</h1>')
    }
    template.render({game:game, req:req}, function(err, data) {
      resp.writeHead(200, {'Content-Type':'text/html'})
      resp.end(data)
    })
  }
  // called when the `join` controller is rendered and the client
  // connects its websocket.
  , socket_join:function(screenname, game_id, client_id, socket, ack) {
    var game = games[game_id]
    if(!game) return

    game.join(screenname, client_id, socket, ack)  
  }
}
