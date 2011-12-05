function logger (channel) {
  return function() {
    try {
      postMessage({channel:channel, data:[].slice.call(arguments)})
    } catch(err) {
      postMessage({channel:'error', data:['could not coerce arguments', (new Error()).stack]})
    }
  }
}

console = {
  log:logger('log')
, error:logger('error')
}

importScripts(
    'definition.js'
  , 'context.js'
  , 'context_object.js'
)

onmessage = function(ev) {
  if(ev.data.init) {
    worker_init(ev.data.threads, ev.data.all)
  } else if(ev.data.context === Network.uuid) {
    Thread.recv_update(ev.data.payload, Network)
  } else if(ev.data.context === RendererLoop.uuid) {
    Thread.recv_update(ev.data.payload, RendererLoop)
  }
}

function worker_init(threads, all) {
  Network       = new Context(threads.SERVER_UUID)
  RendererLoop  = new Context(threads.CLIENT_UUID)
  Thread        = new Context(threads.THREAD_UUID)

  Context.set(Thread)

  importScripts(
      'game.js'
    , 'input.js'
    , 'game_defs.js'
  )

  var counter = Context.current().create_object(CounterDefinition)

  counter.update = function(dt) {
    this.counter = dt 
  }

  console.log('starting up...', typeof Network)
  Thread.recv_update(all, Network) 
  game.thread_loop(function(dt) {
    // update all the objects.
    Object.keys(Thread.objects).forEach(function(key) {
      var item = Thread.objects[key]
      item.update && item.update(dt)
    })

    // send the data back up
    postMessage({
      context:Thread.uuid
    , payload:Thread.create_update()
    })
  }, 33)
}
