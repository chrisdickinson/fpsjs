# A Statement of Intent

This blog documents my experience attempting to build a fairly full featured
networked first person shooter in the browser.

In specific, I'll go over the steps taken in building the project -- pitfalls and otherwise; specific
game topics, and where applicable, I'll link to outside documentation or walkthroughs that illuminate the
process. In addition, wherever JavaScript enables a particularly neat trick, I'll note it in the margins.

A caveat: as this is the documentation of a process, any single article should not be regarded by itself as
a "How To" guide. There will be missteps, perhaps quite frequently. In one article I may describe a process
that makes (or made) sense to me at the time; and in a later article I may rebut it. That said, when that happens,
I'll include a link to the new article in the old article, alongside a brief explanation of why I was wrong.

![right](/media/img/mpm.png) A second caveat: I'm not a game programmer by trade -- quite the opposite, really: I'm a web developer working
at Mediaphormedia in Lawrence, Kansas. My degree is in liberal arts; I've only had a single full year of 
calculus courses, and that was over six years ago. In short: I might be wrong. I'm relying on you, dear reader,
to [let me know where I'm incorrect](http://github.com/chrisdickinson/fpsjs/issues), and I humbly ask that if
you have a better solution available, please submit it to me as a github pull request. 

Oh yeah, and I apologize for the occasional weird drawing. I can't help it.

## Initial outline

* [Why WebGL?](#intro)
  "I used to program in C++, but I recovered." A statement about why I think WebGL is such an enabling technology.

* [Getting started](#getting-started)
  Our hero describes the basic structure of the project, along with some pitfalls in the process.

* [Game loops](#game-loops)
  How does JavaScript affect how we write games? How does one even go about structuring a game?

* [Rendering Basics](#rendering)
  Let's chat about how rendering works with OpenGL, and what we're going to do about it.
 
* [Networking Basics](#networking)
  A quick overview of socket.io and what we'll do with that.

* [Web workers](#web-workers)
  Web workers! Crazy future alien threads, or easy subprocess spawning? Find out in this article.

* [Architecture](#architecture)
  How do we combine those three elements to make a game?

* [First steps](#first-steps)
  First steps -- building the basic renderer utilities for loading assets; making a player, moving it around.

* [Collision](#collision-part-1)
  Our first stab at collision detection. Let's talk about numerical instability.

