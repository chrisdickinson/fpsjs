var IN_NODE = false
if(typeof define !== 'undefined') {
  define(init)
} else if(typeof module !== 'undefined') {
  IN_NODE = true
  module.exports = init
} else {
  init_definitions = init
}

Array.prototype.scale = function(x) {
  return [
      this[0] * x
    , this[1] * x
    , this[2] * x
  ]
}

Array.prototype.magnitude = function() {
  return Math.sqrt(this[0]*this[0] + this[1]*this[1] + this[2]*this[2])
}

Array.prototype.normalize = function() {
  var sqrt = this.magnitude()
  return this.map(function(item) {
    return item / sqrt
  })
}

Array.prototype.dot = function(rhs) {
  return this.map(function(item, idx) {
    return item * rhs[idx]
  }).reduce(function(lhs, rhs) { return lhs + rhs }, 0)
}

Array.prototype.add = function(rhs) {
  return this.map(function(item, idx) {
    return item + rhs[idx]
  })
}

Array.prototype.sub = function(rhs) {
  return this.map(function(item, idx) {
    return item - rhs[idx]
  })
}

Array.prototype.cross = function(rhs) {
  return [
      this[1]*rhs[2] - this[2]*rhs[1]
    , this[2]*rhs[0] - this[0]*rhs[2]
    , this[0]*rhs[1] - this[1]*rhs[0]
  ]
}

function init (def) {


  var network_master = function(query, target) {
    // never send anything to the network
    if(target.is_network) {
      return false
    }

    // if the target is the thread, then we have to be the network
    if(target.is_thread) {
      return query.is_network
    }

    // if the target is the renderer, then we have to be the thread
    if(target.is_renderer) {
      return query.is_thread
    }
    return true
  }

  var renderer_master = function(query, target) {
    if(target.is_network || target.is_thread) {
      return query.is_renderer
    }
    return false
  }

  var Physics = new def('Physics', {
      x           : 0
    , y           : 0
    , z           : 0
    , dx          : 0
    , dy          : 0
    , dz          : 0
    , h           : 0
    , w           : 0
    , d           : 0
    , r0          : 0
    , r1          : 0
  })

  Physics.define_authority(network_master)

  var Player = new def('Player', {
      health      : 100
    , x           : 0
    , y           : 0
    , z           : 0
    , r0          : 0
    , weapon_type : 'weapons.Gun'
  })

  Player.define_authority(network_master)

  Player.set_proto(function(proto) {
    proto.renderable = true

    proto.render = function(renderer) {
      var controlling = renderer.input.controlling()

      if(controlling.player_id === this.__uuid__)
        return

      var program = renderer.programs.wall_program
        , model = renderer.models.wall_model
        , w     = 1 
        , h     = 1
        , walign = w/2
        , halign = h/2

      renderer.camera.push_state()
      renderer.camera.translate(-this.x, 3.5, -this.z) 
      renderer.camera.scale(w, h, w)
      renderer.camera.rotate(0, 1, 0, this.r0)
      renderer.camera.translate(-0.5, -0.5, 0.0)
      renderer.camera.rotate(0, 1, 0, -this.r0)
      renderer.camera.translate(0.5, 0.5, 0.0)
      renderer.camera.rotate(0, 1, 0, this.r0+Math.PI/2)
      program.enable()
      program.set_color([1.0,1.0,1.0])
      program.set_model_matrix(false, renderer.camera.model_matrix)
      program.set_projection_matrix(false, renderer.camera.projection_matrix)
      program.set_texture('player_texture', 0)
      program.set_texture('player_texture', 1)
      model.draw(renderer)
      renderer.camera.pop_state()
    }

  })

  var Projectile = new def('Projectile', {
      player_id   : 0
    , state       : 'initial'   // of ['initial', 'fly', 'explode'] 
    , kind        : 'projectiles.Bullet' 
    , x           : 0
    , y           : 0
    , z           : 0
    , dx          : 0
    , dy          : 0
    , dz          : 0
  })

  Projectile.define_authority(network_master)

  Projectile.set_proto(function(proto) {
    proto.renderable = true
    proto.program = 'wall_program'
    proto.texture = 'wall_texture_0'
    proto.model = 'wall_model'

    proto.render = function(renderer) {
      var controlling = renderer.input.controlling()
        , controlling_player = CONTEXTS.RendererLoop.objects[controlling.player_id]

      if(!controlling_player)
        return console.log('umm')

      var program = renderer.programs[this.program]
        , model = renderer.models[this.model]

      renderer.camera.push_state()
      renderer.camera.translate(-this.x, 3.5, -this.z) 
      program.enable()
      program.set_color(this.state === 'initial' ? [1.0,1.0,1.0] : [1.0,0,0])
      program.set_model_matrix(false, renderer.camera.model_matrix)
      program.set_projection_matrix(false, renderer.camera.projection_matrix)
      program.set_texture(this.texture, 0)
      program.set_texture(this.texture, 1)
      model.draw(renderer)
      renderer.camera.pop_state()
    }

    proto.update = function(context, dt) {
      // fly straight and true, yon projectile

      var x = this.x
        , z = this.z
        , dx = this.dx / dt
        , dz = this.dz / dt
        , walls = context.find('Wall')

      var PLZWRAP = true 
        , ret = function(x) { return x }

      var GAMMA   = 1000
        , wrap    = PLZWRAP ? function(x) { return ~~(x * GAMMA) } : ret
        , unwrap  = PLZWRAP ? function(x) { return (x / GAMMA) } : ret
        , EPSILON = wrap(10e-1)

      if(this.state === 'initial') {
        // update momentum
        vecx = wrap(dx)
        vecz = wrap(dz)

        x = wrap(x)
        z = wrap(z)

        magnitude = [vecx, 0, vecz].magnitude()

        for(var i = 0, len = walls.length; i < len; ++i) {
          var wall = walls[i]
            , normal = wall.normal || (function() {
                var x = [
                      wrap(wall.w * Math.cos(-wall.r0))
                    , 0
                    , wrap(wall.w * Math.sin(-wall.r0))
                  ]
                  , y = [ 
                      0
                    , wrap(wall.h)
                    , 0
                  ]
                  , normal = x.cross(y)
                  return normal.normalize()
              })()
            , wall_offset = wall.offset || (function() {
                return normal.dot([wrap(wall.x), 0, wrap(wall.y)])
              })()
          wall.normal = wall.normal || normal
          wall.offset = wall.offset || wall_offset

          // skip any wall we're facing away from. 
          if(wall.normal.dot([vecx, 0, vecz]) / magnitude > 0) {
            continue 
          }

          var distance = wall.normal.dot([x, wrap(2.5), z].add([vecx, 0, vecz])) - wall.offset

          if(Math.abs(distance) < EPSILON)
            distance = 0

          if(0 <= distance && distance <= magnitude) {
            var v = [vecx, 0, vecz].normalize()
              , target_point = [vecx, 0, vecz].add([x, 0, z])
              , new_vecx = v[0] * distance
              , new_vecz = v[2] * distance
              , new_point = [x + new_vecx, 0, z + new_vecz]
              , origin_to_new_point = new_point.sub([wrap(wall.x), 0, wrap(wall.y)])
              , to_corner = [-Math.cos(-wall.r0), 0, -Math.sin(-wall.r0)]
              , dotted = origin_to_new_point.dot(to_corner)       // gives |origin_to_new_point| * cos(theta), if it's negative it's in the opposite direction

            if(dotted < 0) {
              // outside the rotating edge of the wall 
              continue
            }

            var off_mag = origin_to_new_point.magnitude()
            if(off_mag > wrap(wall.w)) {
              // outside the width of the wall
              continue
            }

            this.dx = 0
            this.dz = 0
            this.x = unwrap(new_point[0])
            this.z = unwrap(new_point[2])
            this.state = 'explode'

            var self = this
            IN_NODE && setTimeout(function() {
              // mark this projectile for deletion
              self.delete()
            }, 1000)
            return
          }
        }
        this.x = unwrap(x + vecx)
        this.z = unwrap(z + vecz) 
      }

    }
  })

  var Wall = new def('Wall', {
      texture_0   : 0
    , texture_1   : 0
    , program     : 0
    , model       : 0
    , x           : 0
    , y           : 0
    , color       : [1, 0, 0]
    , h           : 0
    , w           : 0
    , r0          : 0
    , r1          : 0
  })

  Wall.define_authority(network_master)

  Wall.set_proto(function(proto) {
    proto.renderable = true

    proto.render = function(renderer) {
      if(typeof this.program !== 'string') return
      if(typeof this.model !== 'string') return

      var program = renderer.programs[this.program]
        , model = renderer.models[this.model]

      renderer.camera.push_state()
      renderer.camera.translate(-this.x, 0, -this.y)
      renderer.camera.rotate(0, 1, 0, this.r0)
      renderer.camera.scale(this.w, this.h, this.w/this.h) 
      program.enable()

      program.set_color(this.color)
      program.set_model_matrix(false, renderer.camera.model_matrix)
      program.set_projection_matrix(false, renderer.camera.projection_matrix)
      program.set_texture(this.texture_0, 0)
      program.set_texture(this.texture_1, 1)
      //program.set_eye_position(renderer.camera.eye_position)
      model.draw(renderer)
      renderer.camera.pop_state()
    }
  })

  Wall.init_renderer = function(renderer) {

  }

  var Input = new def('Input', {
      mouse_0     : false
    , mouse_1     : false
    , mouse_x     : 0
    , mouse_y     : 0
    , key_87      : false    // w
    , key_65      : false    // a
    , key_83      : false    // s
    , key_68      : false    // d
    , key_spc     : false    // space
  })

  Input.define_authority(renderer_master)

  Input.set_proto(function(proto) {
    var initial_update = proto.recv_update

    proto.recv_update = function(payload) {
      var original_click = this.mouse_0
        , new_click

      initial_update.call(this, payload)

    }

  })

  var Control = new def('Control', {
      input_id    : 0
    , player_id   : 0
    , handle      : '<Player>'
    , score       : 0
    , view_bob    : 0
  })

  Control.define_authority(network_master)

  var CHECK = 0
  Control.set_proto(function(proto) {
    proto.renderable = true

    var created_name = false
    proto.render = function(renderer) {
      var controlling = renderer.input.controlling()
        , controlling_player = CONTEXTS.RendererLoop.objects[controlling.player_id]
        , texture
        , name = 'text:'+this.handle

      if(controlling === this || !controlling_player)
        return

      if(!(texture=renderer.textures[name])) {
        if(!created_name) {
          created_name = true
          renderer.load_text(name, this.handle, function() {
            created_name = false // reset in case handle changes later.
          })
        }
        return
      }

      if(!this.player_id)
        return

      // ooo, spooky action at a distance, hey?
      var ctxt = CONTEXTS.RendererLoop
        , player = ctxt.objects[this.player_id]

      if(!player)
        return

      var program = renderer.programs.billboard_program
        , model = renderer.models.wall_model
        , gl = renderer.ctxt



      renderer.camera.push_state()
      renderer.camera.translate(-player.x, 4.5, -player.z) 
      renderer.camera.rotate(0, 1, 0, player.r0)
      renderer.camera.translate(-0.5, -0.5, 0.0)
      renderer.camera.rotate(0, 1, 0, -player.r0)
      renderer.camera.translate(0.5, 0.5, 0.0)
      renderer.camera.rotate(0, 1, 0, -controlling_player.r0)
      program.enable()

      program.set_model_matrix(false, renderer.camera.model_matrix)
      program.set_projection_matrix(false, renderer.camera.projection_matrix)
      program.set_texture(name, 0)
      program.set_texture(name, 1)
      model.draw(renderer)
      renderer.camera.pop_state()

    }


    proto.update = function(context, dt) {
      var input = context.objects[this.input_id]
        , player = context.objects[this.player_id]

      if(input && player && player.health > 0) {
        // we're controlling something.
        var dz = 0
          , dx = 0
          , speed = 9.9 


        var base_rotation = 0
          , moving = false

        if(input.key_87) {
          dz = 1
          base_rotation = Math.PI * 2
          moving = true
        } else if(input.key_83) {
          dz = -1
          base_rotation = Math.PI
          moving = true
        } 
  
        if(input.key_65) {
          dx = -1
          base_rotation = moving ? base_rotation == Math.PI ? base_rotation + Math.PI/4 : base_rotation - Math.PI/4 : -Math.PI/2
          moving = true
        } else if(input.key_68) {
          dx = 1
          base_rotation = moving ? base_rotation == Math.PI ? base_rotation - Math.PI/4 : base_rotation + Math.PI/4 : Math.PI/2
          moving = true
        }

        // update rotation and position.
        var rot = player.r0 = (input.mouse_x % 360) * Math.PI / 180
          , initial_rot = rot 
          , vecx
          , vecz
          , walls
          , x = player.x
          , z = player.z
          , magnitude

        walls = context.find('Wall')

        dx *= speed
        dz *= speed



        var PLZWRAP = true 
          , ret = function(x) { return x }

        var GAMMA   = 1000
          , wrap    = PLZWRAP ? function(x) { return ~~(x * GAMMA) } : ret
          , unwrap  = PLZWRAP ? function(x) { return (x / GAMMA) } : ret
          , EPSILON = wrap(10e-1)

        if(moving) {

          this.view_bob += 10 / dt

          rot = rot + base_rotation

          // update momentum
          vecx = wrap(Math.sin(-rot) * (speed / dt))
          vecz = wrap(Math.cos(-rot) * (speed / dt))

          x = wrap(x)
          z = wrap(z)

          magnitude = [vecx, 0, vecz].magnitude()

          for(var i = 0, len = walls.length; i < len; ++i) {
            var wall = walls[i]
              , normal = wall.normal || (function() {
                  var x = [
                        wrap(wall.w * Math.cos(-wall.r0))
                      , 0
                      , wrap(wall.w * Math.sin(-wall.r0))
                    ]
                    , y = [ 
                        0
                      , wrap(wall.h)
                      , 0
                    ]
                    , normal = x.cross(y)
                    return normal.normalize()
                })()
              , wall_offset = wall.offset || (function() {
                  return normal.dot([wrap(wall.x), 0, wrap(wall.y)])
                })()
            wall.normal = wall.normal || normal
            wall.offset = wall.offset || wall_offset

            // skip any wall we're facing away from. 
            if(wall.normal.dot([vecx, 0, vecz]) / magnitude > 0) {
              continue 
            }

            var distance = wall.normal.dot([x, wrap(2.5), z].add([vecx, 0, vecz])) - wall.offset

            if(Math.abs(distance) < EPSILON)
              distance = 0

            if(0 <= distance && distance <= magnitude) {
              var v = [vecx, 0, vecz].normalize()
                , target_point = [vecx, 0, vecz].add([x, 0, z])
                , new_vecx = v[0] * distance
                , new_vecz = v[2] * distance
                , new_point = [x + new_vecx, 0, z + new_vecz]
                , origin_to_new_point = new_point.sub([wrap(wall.x), 0, wrap(wall.y)])
                , to_corner = [-Math.cos(-wall.r0), 0, -Math.sin(-wall.r0)]
                , dotted = origin_to_new_point.dot(to_corner)       // gives |origin_to_new_point| * cos(theta), if it's negative it's in the opposite direction

              if(dotted < 0) {
                // outside the rotating edge of the wall 
                continue
              }

              var off_mag = origin_to_new_point.magnitude()
              if(off_mag > wrap(wall.w)) {
                // outside the width of the wall
                continue
              }

              var target_dist   = target_point.sub([x, 0, z].add([new_vecx, 0, new_vecz])).dot(wall.normal)
                , plane_target  = target_point.sub(normal.normalize().scale(target_dist)) 

              // oh, a collision happened.
              // how sweet of you to notice.
              vecx = plane_target[0] - x
              vecz = plane_target[2] - z

              magnitude = [vecx, 0, vecz].magnitude()
            }
          }
          player.x = unwrap(x + vecx)
          player.z = unwrap(z + vecz) 
        }


        var new_mouse_0 = input.mouse_0
          , old_mouse_0 = input.old_mouse_0 || false

        // uh oh, we're firing our LAZER CANNON
        if(IN_NODE && new_mouse_0 != old_mouse_0) {
          if(!new_mouse_0) {
            // mouse up
             
          } else {
            // mouse down
            var projectile = context.create_object(Projectile)
              , dx = Math.sin(-initial_rot) * 20 
              , dz = Math.cos(-initial_rot) * 20

            projectile.x = player.x
            projectile.z = player.z
            projectile.dx = dx
            projectile.dz = dz
          }
        }
        input.old_mouse_0 = new_mouse_0

      } else if(input) {
        var new_mouse_0 = input.mouse_0
          , old_mouse_0 = input.old_mouse_0 || false

        // mark the old player object (if any) for deletion
        player && player.delete()

        // if we're transitioning from mouse down to mouse up,
        // spawn the player.
        if(new_mouse_0 != old_mouse_0 && !new_mouse_0 && IN_NODE) {
          var player = context.create_object(Player)
            , spawns = context.find('Spawnpoint')
            , spawn = spawns[~~(Math.random() * (spawns.length-1))]

          if(spawn) {
            player.x = spawn.x
            player.z = spawn.y
            player.r0 = spawn.r0
          }

          this.player_id = player.__uuid__
        }

        input.old_mouse_0 = new_mouse_0
      }
    }
  })

  var Spawnpoint = new def('Spawnpoint', {
      x : 0
    , y : 0
    , r0: 0
  }) 

  return {
      Player  :Player
    , Input   :Input
    , Control :Control
  }
}

