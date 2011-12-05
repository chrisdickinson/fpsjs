define(['./thin_obj.js'], module)

function module(Thin) {
  var PhysicsDefinition = {
      x     : 0
    , y     : 0
    , z     : 0
    , h     : 0 // height
    , w     : 0 // width
    , d     : 0 // depth
    , dx    : 0 // velocity x (abs, sideways)
    , dy    : 0 // velocity y (abs, vertical)
    , dz    : 0 // velocity z (abs, forward)
    , rx    : 0 // rotation up/down
    , ry    : 0 // rotation left/right
  }

  function SimObject(render_class) {
    this.physics      = new Thin(PhysicsDefinition)
    this.renderable   = new render_class(this.physics)
  }

  return SimObject
}
