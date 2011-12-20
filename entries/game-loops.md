# Games from a thousand miles up

![plainright](/fpsjs/media/img/gameloop.png) So what does a game look like from a high level? How does this look in JavaScript?
All a game is doing is looping endlessly, checking the input received, advancing the game state using that input
by some unit of time -- usually the elapsed milliseconds since the last time through the loop -- and then rendering
the resulting scene.

Input can mean several things: as noted before, we send the elapsed milliseconds into the game update as a form of input;
keypresses, clicks, and other user-initiated events can likewise be considered input. Furthermore, network updates are input.

That gives us a nice, clean definition:

**Input**: *n.*, any data that potentially changes game state.

In a typical native game, you'll see that core loop defined as a `for(;;)` or `while(1)` loop. What other, familiar construct
uses a big loop collecting data to notify listeners with updates? That's right -- event loops! Games can be said to be setting
up giant event loops. What language has a nice, wholesome event loop *baked right in*? Right again! **JavaScript**.

This actually puts us in a bit of weird spot, compared to native game engines:

    // forgive my pathetically incorrect C code.
    #include <game.h>
    #include <time.h>

    extern int g_is_running;

    int main(int argc, char\*\* argv) {
        g_is_running = init();

        long now = time(),
             new_now,
             dt;

        game_keystate keystate;
        while(g_is_running) {
            // grab the elapsed seconds.
            new_now = time()
            dt = new_now - now;
            now = new_now;

            // grab input
            game_collect_input(&keystate);

            // update the game
            g_is_running = game_update(dt);

            // draw the game
            game_draw();
        }
    }

We can't do that in JavaScript. For one, that `while` loop would completely halt the web page, and eventually our browser would
pop up with a lovely little "Kill this script? You should probably kill this script." dialog notifying the user that we, as developers,
have made some questionable choices.

Disregarding that, there's no way to synchronously query key or mouse state -- they come in asynchronously through DOM events, and that's
that. So a for-loop is right out. How do we structure something like this in JavaScript? Fairly easily, it turns out:

    var canvas = document.getElementById('canvas')
      , gl = canvas.getContext('experimental-webgl')

    var keystate = {}
      , set_keystate = function(onoff) {
        return function(ev) { keystate[ev.keyCode] = onoff }
      }

    document.addEventListener('keydown', set_keystate(true), true)
    document.addEventListener('keyup', set_keystate(false), true)

    var now = new Date
      , new_now
      , dt

    if(init())
      requestAnimationFrame(function iter() {
          new_now = new Date
          dt = new_now - now
          now = new_now

          // if the game is still running, redraw
          // and wait to be signaled for the next frame.
          if(game_update(dt, keystate)) {
            game_draw()
            requestAnimationFrame(iter, canvas)
          }
      }, canvas);

The above example disregards newer (and thus, cooler) APIs like mouselock, websockets, and webworkers; it's just the bare bones way you'd
structure your JavaScript code to achieve the aforementioned game loop. I also fail to bring up polyfills -- sometimes APIs like 
`requestAnimationFrame` are prefixed on certain browsers. Rest assured, this omission shouldn't give you too much heartburn: polyfills
exist for these situations, and are a fire-and-forget solution to the problem.

So what's happening in `init`, `game_update`, and `game_draw`?

[To answer that, we'll have to chat a little bit about the renderer, first.](#rendering)
