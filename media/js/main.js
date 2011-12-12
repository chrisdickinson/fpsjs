define(
    [ '/media/js/game.js'
    , '/media/js/renderer.js'
    , '/media/js/network.js']
    , module )

CONTEXTS = {
    Network       : new Context(threads.SERVER_UUID)
  , RendererLoop  : new Context(threads.CLIENT_UUID)
  , Thread        : new Context(threads.CLIENT_UUID+':thread')
}

function module(game, renderer, network) {

  var defs = init_definitions(Definition) 

  CONTEXTS.Network.is_network = true
  CONTEXTS.RendererLoop.is_renderer = true
  CONTEXTS.Thread.is_thread = true

  network.init(Network, function() {
    var worker = new Worker('/media/js/worker.js')
    renderer.init(worker, function() {

      console.log('renderer init')

      // join the game... (update events will start being sent)
      network.send('join', {threads:threads, screenname:screenname}, function(err, manifest, controlling_id, all_data) {

        console.log('network join')

        // load the required data...
        renderer.load(manifest || {}, function() {

          console.log('renderer loaded')

          // start the worker...
          threads.THREAD_UUID = CONTEXTS.Thread.uuid
          worker.postMessage({init:true, threads:threads, all:all_data})

          renderer.start(controlling_id, network, worker, all_data)
          console.log('renderer start')
        })
      })
    })
  })
}
