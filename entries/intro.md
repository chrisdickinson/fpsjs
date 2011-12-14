# Why?

Games are what initially piqued my interest in programming; I actually
learned how to program by making mods for Starsiege: Tribes in 
[TorqueScript](http://docs.garagegames.com/tge/official/content/documentation/Reference/Introduction/TorqueScript.html).
The later availabilty of the Torque Game Engine source for the low, low, price
of $100.00 got me started in C++, and I spent a good portion of my high school
experience pounding the keys on MS Visual Studio 6, attempting to build a 3D
terrain-engine based game. 

![right](http://www2.fileplanet.com/images/140000/140246ss_sm2.jpg) I was using OpenGL immediate mode, and attempted to avoid learning how
win32 worked. My math knowledge was&hellip; fairly sparse. Needless to
say, it took me around 3 years of stumbling through Game Programming Gems books 
to produce an engine capable of rendering a terrain with collision detection, lighting,
and the worlds worst (home-grown!) scripting language.

Years later, I find myself as a web developer working at (I think!) one of the most
exciting times to be hacking on the web. The availability of high performance JavaScript,
the apis HTML5 is exposing &mdash; primarily WebGL, Web Workers, and Web Sockets &mdash;
are making it easier and easier to get started with game programming.

An empirical case, slightly skewed by the accumulation of experience over the last few years;
what took me three years of muddling previously, I managed to replicate (by and large) over the
course of a [week using WebGL](http://neversaw.us/terrain/). Exciting! Not only that, but I can
actually show my friends and coworkers what I've built &mdash; no futzing with platform programming required.

And it's only getting better.

Recently, the mouse lock API became available in Chrome Canary builds alongside the `requestFullScreen` API. 
These missing pieces complete a picture; they enable a new generation of high-quality WebGL games. They'll be easer 
to write, easier to share, and with easy access to thorough documentation; I believe WebGL and JavaScript will
help more young folk transform their interest in writing video games into a love of programming. The barrier is
only getting lower, year after year. 

[That said, let's jump in.](#getting-started)
