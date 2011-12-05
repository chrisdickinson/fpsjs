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

  Definition.define_authority(CONTEXTS)

  network.init(Network, function() {
    var worker = new Worker('/media/js/worker.js')
    renderer.init(worker, function() {


      // join the game... (update events will start being sent)
      network.send('join', threads, function(err, manifest, controlling_id, all_data) {

        // load the required data...
        renderer.load(manifest || {}, function() {

          // start the worker...
          threads.THREAD_UUID = CONTEXTS.Thread.uuid
          worker.postMessage({init:true, threads:threads, all:all_data})

          renderer.start(controlling_id, network, worker, all_data)
        })
      })
    })
  })
}
