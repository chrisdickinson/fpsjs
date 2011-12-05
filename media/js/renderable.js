define(['./thin_obj.js'], module)

function module(Thin) {
  var Default = 0
  var RenderState = {
    state : Default
  }

  function Renderable(physics) {
    this.physics = physics
    this.state = new Thin(RenderState) 
  } 

  
  return Renderable
}
