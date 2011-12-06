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
    console.log(ev.data.payload)
    CONTEXTS.Thread.recv_update(ev.data.payload, CONTEXTS.Network)
  } else if(ev.data.context === CONTEXTS.RendererLoop.uuid) {
    CONTEXTS.Thread.recv_update(ev.data.payload, CONTEXTS.RendererLoop)
  } else {
    console.error('WHAT IS THIS FOR: ', ev.data)    
  }
}

function worker_init(threads, all) {
  CONTEXTS.Network       = new Context(threads.SERVER_UUID)
  CONTEXTS.RendererLoop  = new Context(threads.CLIENT_UUID)
  CONTEXTS.Thread        = new Context(threads.THREAD_UUID)
  CONTEXTS.Network.is_network = true
  CONTEXTS.RendererLoop.is_renderer = true
  CONTEXTS.Thread.is_thread = true
  Context.set(CONTEXTS.Thread)

  importScripts(
      'game.js'
    , 'input.js'
    , 'game_defs.js'
  )

  init_definitions(Definition)

  CONTEXTS.Thread.recv_update(all, CONTEXTS.Network)

  var first_run = true 
  game.thread_loop(function(dt) {
    // update all the objects.
    Object.keys(CONTEXTS.Thread.objects).forEach(function(key) {
      var item = CONTEXTS.Thread.objects[key]
      item.update && item.update(dt)
    })

    var payload = CONTEXTS.Thread.create_update(CONTEXTS.RendererLoop, first_run)
    // send the data back up
    if(payload)
      postMessage({
        context:CONTEXTS.Thread.uuid
      , payload:payload
      })

    first_run = false
  }, 33)
}
