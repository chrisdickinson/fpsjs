
if(typeof define !== 'undefined') {
  define(init)
} else if(typeof module !== 'undefined') {
  module.exports = init
} else {
  if(typeof Network === 'undefined')
    setTimeout(function() {
      if(typeof Network === 'undefined')
        return setTimeout(arguments.callee)

      Player = init(Definition, [
        [RendererLoop, Thread]
      , [Thread, Network]
      , [Network]  
      ])
    })
  else
    Player = init(Definition, [
      [RendererLoop, Thread]
    , [Thread, Network]
    , [Network]  
    ])

}

function init (def, map) {
  return {
    'Player':new def('Player', {
        health:100
      , physics:0
    }, map)
  }
}

