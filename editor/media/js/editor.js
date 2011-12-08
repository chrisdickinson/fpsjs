function draw_grid (canvas) {

  var ctxt
    , w
    , h
    , step

  canvas.canvas.width = canvas.canvas.width

  ctxt = canvas.canvas.getContext('2d')
  ctxt.lineWidth = 0.2
  ctxt.strokeStyle = '#323232'

  w = canvas.canvas.width
  h = canvas.canvas.height
  step = 10/canvas.zoom

  ctxt.moveTo(0, 0)
  ctxt.beginPath()
  var i 

  for(i = Math.min(canvas.off_x, 0); i < (w+canvas.off_x)/step; ++i) {
    ctxt.moveTo(i*step-canvas.off_x, 0)
    ctxt.lineTo(i*step-canvas.off_x, h)
  }

  for(i = Math.min(canvas.off_y, 0); i < (h+canvas.off_y)/step; ++i) {
    ctxt.moveTo(0, i*step-canvas.off_y)
    ctxt.lineTo(w, i*step-canvas.off_y)
  }

  ctxt.stroke()
  ctxt.beginPath()
  
  ctxt.moveTo(0, 0)

  ctxt.lineWidth = 2
  ctxt.strokeStyle = '#7A7A7A' 
  ctxt.moveTo(-canvas.off_x, 0)
  ctxt.lineTo(-canvas.off_x, h)

  ctxt.moveTo(0, -canvas.off_y)
  ctxt.lineTo(w, -canvas.off_y)

  ctxt.stroke()
}

var canvas = [].slice.call(document.querySelectorAll('.canvas')).map(function(cvs) {
  return {
    off_x:~~(-cvs.width/2)
  , off_y:~~(-cvs.height/2)
  , zoom:1
  , canvas:cvs
  } 
})

var alt_pressed = false

document.addEventListener('keydown', function(ev) {
  alt_pressed = ev.altKey
})

document.addEventListener('keyup', function(ev) {
  if(alt_pressed && !ev.altKey)
    alt_pressed = false
})

canvas.forEach(function(cvs) {

  cvs.canvas.addEventListener('mousewheel', function(ev) {
    ev.preventDefault()
    if(alt_pressed) {
      cvs.zoom += ev.wheelDeltaY / 1000
    } else {
      cvs.off_x += ~~ev.wheelDeltaX
      cvs.off_y += ~~ev.wheelDeltaY
    }

    if(cvs.zoom > 2)
      cvs.zoom = 2
    if(cvs.zoom < 0.1)
      cvs.zoom = 0.1

    draw_grid(cvs)
  })

  cvs.canvas.addEventListener('mousedown', function(ev) {
    var base_x = ev.pageX
      , base_y = ev.pageY
      , onmove
      , onup

    ev.preventDefault()

    document.addEventListener('mousemove', onmove=function(ev) {
      cvs.off_x -= (ev.pageX - base_x)
      cvs.off_y -= (ev.pageY - base_y)
      base_x = ev.pageX
      base_y = ev.pageY

      draw_grid(cvs)
    }, true)

    document.addEventListener('mouseup', onup=function(ev) {
      document.removeEventListener('mousemove', onmove, true)
      document.removeEventListener('mouseup', onup, true)
    }) 
  }, true)
})

on_resize(function() {
  canvas.forEach(function(cvs) {
    draw_grid(cvs)
  })
})

