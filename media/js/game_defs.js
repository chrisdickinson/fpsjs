if(typeof define !== 'undefined') {
  define(init)
} else if(typeof module !== 'undefined') {
  module.exports = init
} else {
  init_definitions = init
}

function init (def) {

  var network_master = function(contexts) {
    return [
      [contexts.RendererLoop, contexts.Thread]
    , [contexts.Thread, contexts.Network]
    , [contexts.Network]  
    ]
  }

  var renderer_master = function(contexts) {
    return [
      [contexts.Network, contexts.RendererLoop]
    , [contexts.Thread, contexts.RendererLoop]
    , [contexts.RendererLoop]
    ]
  }

  var Player = new def('Player', {
      health      : 100
    , physics_id  : 0
  })

  Player.define_authority(network_master)

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

  return {
      Player  :Player
    , Input   :Input
    , Control :Control
  }
}

