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

CONTEXTS = {}

importScripts(
    'definition.js'
  , 'context.js'
  , 'context_object.js'
)

onmessage = function(ev) {
  if(ev.data.init) {
    worker_init(ev.data.threads, ev.data.all)
  } else if(ev.data.context === CONTEXTS.Network.uuid) {
    Thread.recv_update(ev.data.payload, CONTEXTS.Network)
  } else if(ev.data.context === CONTEXTS.RendererLoop.uuid) {
    CONTEXTS.Thread.recv_update(ev.data.payload, CONTEXTS.RendererLoop)
  }
}

function worker_init(threads, all) {
  CONTEXTS.Network       = new Context(threads.SERVER_UUID)
  CONTEXTS.RendererLoop  = new Context(threads.CLIENT_UUID)
  CONTEXTS.Thread        = new Context(threads.THREAD_UUID)

  Context.set(CONTEXTS.Thread)

  importScripts(
      'game.js'
    , 'input.js'
    , 'game_defs.js'
  )

  init_definitions(Definition)

  Definition.define_authority(CONTEXTS)

  CONTEXTS.Thread.recv_update(all, CONTEXTS.Network) 
  game.thread_loop(function(dt) {
    // update all the objects.
    Object.keys(CONTEXTS.Thread.objects).forEach(function(key) {
      var item = CONTEXTS.Thread.objects[key]
      item.update && item.update(dt)
    })

    var payload = CONTEXTS.Thread.create_update(CONTEXTS.RendererLoop)
    // send the data back up
    if(payload)
      postMessage({
        context:CONTEXTS.Thread.uuid
      , payload:payload
      })
  }, 33)
}
