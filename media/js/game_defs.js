if(typeof define !== 'undefined') {
  define(init)
} else if(typeof module !== 'undefined') {
  module.exports = init
} else {
  init_definitions = init
}

function init (def) {
  console.log('ummm defining definitions')
  var player = new def('Player', {
      health:100
    , physics:0
  })

  player.define_authority(function(contexts) {
    return [
      [contexts.RendererLoop, contexts.Thread]
    , [contexts.Thread, contexts.Network]
    , [contexts.Network]  
    ]
  })

  var input = new def('Input', {
      mouse_0:false
    , mouse_1:false
    , mouse_x:0
    , mouse_y:0
    , key_87:false    // w
    , key_65:false    // a
    , key_83:false    // s
    , key_68:false    // d
    , key_spc:false   // space
  })

  input.define_authority(function(contexts) {
    return [
      [contexts.Network, contexts.RendererLoop]
    , [contexts.Thread, contexts.RendererLoop]
    , [contexts.RendererLoop]
    ]
  })

  return {
      'Player':player
    , 'Input':input
  }
}

