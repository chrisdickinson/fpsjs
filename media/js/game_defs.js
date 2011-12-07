var IN_NODE = false
if(typeof define !== 'undefined') {
  define(init)
} else if(typeof module !== 'undefined') {
  IN_NODE = true
  module.exports = init
} else {
  init_definitions = init
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
      var program = renderer.programs.wall_program
        , model = renderer.models.wall_model
        , w     = 3
        , h     = 3
        , walign = w/2
        , halign = h/2

      renderer.camera.push_state()
      renderer.camera.translate(-this.x, 2.0, -this.z) 
      renderer.camera.scale(w, h, w)
      renderer.camera.rotate(0, 1, 0, this.r0)
      renderer.camera.translate(-0.5, -0.5, 0.0)
      renderer.camera.rotate(0, 1, 0, -this.r0)
      renderer.camera.translate(0.5, 0.5, 0.0)
      renderer.camera.rotate(0, 1, 0, this.r0)
      program.enable()
      program.set_color([1.0,1.0,1.0])
      program.set_model_matrix(false, renderer.camera.model_matrix)
      program.set_projection_matrix(false, renderer.camera.projection_matrix)
      program.set_texture('wall_texture_0', 0)
      program.set_texture('wall_texture_0', 1)
      model.draw(renderer)
      renderer.camera.pop_state()
    }

  })

  var Projectile = new def('Projectile', {
      player_id   : 0
    , state       : 'initial'   // of ['initial', 'fly', 'explode'] 
    , kind        : 'projectiles.Bullet' 
    , physics_id  : 0
  })

  Projectile.define_authority(network_master)

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
      renderer.camera.rotate(0, 1, 0, this.r0)
      renderer.camera.translate(this.x, 0, -this.y)
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

  var Control = new def('Control', {
      input_id    : 0
    , player_id   : 0
    , handle      : '<Player>'
    , score       : 0
  })

  Control.define_authority(network_master)

  var CHECK = 0
  Control.set_proto(function(proto) {
    proto.update = function(context, dt) {
      var input = context.objects[this.input_id]
        , player = context.objects[this.player_id]

      if(input && player) {
        // we're controlling something.
        var dz = 0
          , dx = 0
          , speed = 3

        if(input.key_87) {
          dz = 1
        } else if(input.key_83) {
          dz = -1
        } else if(input.key_65) {
          dx = -1
        } else if(input.key_68) {
          dx = 1
        } else {
        }

        // update rotation and position.
        var rot = player.r0 = (input.mouse_x % 360) * Math.PI / 180 

        dx *= speed
        dz *= speed

        // update forward momentum
        player.x += Math.sin(-rot) * (dz / dt) 
        player.z += Math.cos(-rot) * (dz / dt)

        // update sideways momentum
        // player.x += Math.sin(rot + Math.PI/2) * (dx / dt)
        // player.z += Math.cos(rot + Math.PI/2) * (dx / dt)
      } else {
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

