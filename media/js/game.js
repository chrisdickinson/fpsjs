function Game() {

}

var proto = Game.prototype

proto.thread_loop = function(fn, interval) {
  var self = this
    , now = Date.now()

  setInterval(function() {
    var new_now = Date.now()
      , dt = new_now - now

    now = new_now
    fn.call(self, dt)
  }, interval)
}

if(typeof define !== 'undefined') {
  define(function() { return new Game })
} else if(typeof module !== 'undefined') {
  module.exports = Game
} else {
  game = new Game
}
