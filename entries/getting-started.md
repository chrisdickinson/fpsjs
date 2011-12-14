# Getting Started

In this article, I'll describe the basic, initial setup for our WebGL game and give a brief primer
on how games are typically structured.

## Ethos (and a note on style)

As we work on this game, I'd like to introduce requirements only as our needs grow complex enough to
necessitate them. I find that it'd easiest to think about things in small, discrete steps; and to that
end, throwing ourselves into the deep end with a full-fledged Node.js server instance with websockets
and webworkers and session data seems like it would spread our attention too thin. 

I mean, uh, spoilers. Anyway, while we're getting started we really don't need anything outside of
a simple http server that serves up our HTML, JavaScript, and media assets. It doesn't need to do
anything dynamic at first.

It bears mentioning at this point that I'll be adhering to the comma-first, no-semicolons style of JavaScript.
It's a preference this, mainly; however, you'll note that I stick to `method_name` versus `methodName` 
casing. This flies in the face of what everyone else in JavaScript does and I'm well aware of it. If you
feel more comfortable camelCasing, go right ahead -- but I won't be. Blame my python heritage.

## First steps

Let's create our game directory and set ourselves up with a few subdirectories -- and initialize a git
repository there, just to give ourselves a nice safety net:

    mkdir $YOURGAME
    cd $YOURGAME
    mkdir -p media/{img,css,js,shaders,models}
    curl http://requirejs.org/docs/release/1.0.2/minified/require.js > media/js/require.js
    cat > index.html <<EOF
        <!doctype html>
        <meta charset="utf-8">
        <title>FPS</title>
        <canvas id="canvas" width=640 height=480></canvas>
        <script src="/media/js/require.js" data-main="/media/js/main"></script>
        EOF
    cat > media/js/main.js <<EOF
        console.log("hello world")
    git init
    git add .
    git commit -m "initial commit"

Cool. Now we can serve it up using python's built-in `SimpleHTTPServer`:

    python -m SimpleHTTPServer

And you can open the page at `http://localhost:8000`. This gives us a basic entry point to start futzing
with JavaScript.

> ## Re: require.js
> Early in this project, I used require.js to manage my in-browser javascript.
> However, given that I end up re-using code between Node, WebWorkers, and the browser,
> require.js quickly became a liabilty. Caveat emptor.

We're loading our javascript using [RequireJS](http://requirejs.org/), a nicely designed API for asyncronous
module definitions. This means that as our project continues, instead of continually revisiting `index.html`
with additional script tags (and hoping to get them in the correct order), require.js will do it for us.

**Cool.**

Let's do something quick and dumb to prove to ourselves that we've got a workable system -- we'll make the world's
most boring screen saver. Open up `/media/js/main.js`, and let's perform the following incantations:

    // I meant what I said about not using extraneous deps.
    // this means you, jQuery >:| 
    var canvas = document.getElementById('canvas')
      , gl = canvas.getContext('experimental-webgl')
      , color = [Math.PI, Math.PI/2, 0]

    // we can get away with using setInterval instead of
    // requestAnimationFrame for now.
    setInterval(function() {
      gl.clearColor.apply(gl, color.map(Math.cos).concat([1]))
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      color = color.map(function(x) { return x + 0.01 })
    }, 33)


<canvas id="canvas" class="imgleft" style="background:#CCC"></canvas>
<script type="text/javascript">
    // I meant what I said about not using extraneous deps.
    // this means you, jQuery >:| 
    var canvas = document.getElementById('canvas')
      , gl = canvas.getContext('experimental-webgl')
      , color = [Math.PI, Math.PI/2, 0]

    // we can get away with using setInterval instead of
    // requestAnimationFrame for now.
    setInterval(function() {
      gl.clearColor.apply(gl, color.map(Math.cos).concat([1]))
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      color = color.map(function(x) { return x + 0.01 })
    }, 33)
</script>

You should see something like the animation on the left (at a different size, of course), if you've got WebGL.
For reference, this is a great example of why I think WebGL is so empowering: note the utter lack of platform
specific code in the previous example. Load it up in any browser that supports WebGL, and it does 
*exactly what you'd expect*. Beautiful. **Beautiful**.

## Games from a thousand miles up

![plainright](/media/img/gameloop.png) So what does a game look like from a high level? How does this look in JavaScript?
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



