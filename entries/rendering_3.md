# Cameras, element array buffers, and primitives.

Up until this article, we've been satisfied with drawing a simple, two-dimensional triangle to the screen.
By this point we've got a fairly complete mental model of what resources we need to draw an element to a screen. 
There are three final concepts I'd like to introduce at this point: **primitives**, **view matrices**, and 
**element array buffers**. By the end of the article, we should be able to create a general purpose resource loader,
and define a format for our resources. We'll also start using [`requestAnimFrame`](http://paulirish.com/2011/requestanimationframe-for-smart-animating/) to schedule our draw call (up until now, we've used `setInterval`). The linked article does a much
better job of explaining the benefits of this approach; so we won't worry ourselves overly much with it at the moment.

## Primitives

        gl.drawArrays(gl.TRIANGLES, 0, vertices.length/3)

We've been using this `drawArrays` call [since the first article in the series](#rendering). It's an old friend by now.
We talked about how, in this call, we're asking WebGL to draw `TRIANGLES` from the first element in our buffer until we
hit `vertices.length/3` -- basically asking it, "draw `N` triangles for us". That abstraction works, but we're only talking
about the last two arguments, really: we never discussed different options for that first argument, `gl.TRIANGLES`.

Let's talk about `gl.TRIANGLES`, briefly. Hypothetically, what would a square look like if we wanted to draw it using
`gl.TRIANGLES`? Well, we'd need two triangles to make a square, and three vertices to draw a triangle. Past that, we need
three coordinates to make up those three vertices -- `x, y, z`. That means we end up needing `3 (coordinates) * 3 (vertices) * 2`
to draw a square. 

**`18`** floating point numbers to define a square! Let's look at the data we're sending:

    [ 0, 0, 0   // first triangle
    , 0, 1, 0
    , 1, 1, 0
    , 0, 1, 0   // second triangle
    , 1, 1, 0
    , 1, 0, 0 ]

How much unique data is in that data, really?

    [ 0, 0, 0   // a
    , 0, 1, 0   // b
    , 1, 0, 0   // c
    , 1, 1, 0 ] // d

    /* b --- d
       | \   |
       |  \  |
       |   \ |
       a --- c */

It turns out, since the two triangles share an edge, we can get away with only four vertices to define the square.
Specifically, we just need to add one vertex to define a new triangle. It will share the last edge defined, and create
two new edges to define the second triangle.

## A note on winding

> The above method of defining triangles is called `gl.TRIANGLE_STRIP`. It treats every vertex past the first 3 vertexes defined
> as a new triangle -- an incredible improvement over our previous situation, where each triangle necessitated 3 entire vertices
> all to itself. It interacts with the **winding** in an interesting way: every odd triangle drawn is technically wound
> counter clockwise, but OpenGL knows that we're using a `TRIANGLE_STRIP` and treats those triangles as if they were wound
> clockwise.

OpenGL will attempt to skip primitives
that are facing away from the camera position.

It can determine this by looking at the *winding* of the
primitive. Specifically, it attempts to cull polygons that are
wound counter-clockwise, with respect to the camera.

In other words, we define the first triangle as `a, b, c` --
bottom left, top left, bottom right. Were this triangle defined
as `a, c, b`, the winding would be counter-clockwise.

You can mentally model this by tracing the path that the triangle
in being drawn -- if it goes from the left to the right to the top,
it is wound counterclockwise and will be culled.

## Downsides of `TRIANGLE_STRIP`

This approach is not without it's downsides, however. We still have to repeat a lot of information, in certain cases. 
Imagine for a second that we're attempting to draw a cube with `gl.TRIANGLE_STRIP`. We would have to send the following information
to the GPU:

    [ 0, 0, 0   // a
    , 0, 1, 0   // b
    , 1, 0, 0   // c
    , 1, 1, 0   // d
    , 1, 0, 1   // e
    , 1, 1, 1   // f
    , 0, 1, 0   // b *
    , 0, 1, 1   // g
    , 1, 0, 1   // e *
    , 0, 0, 1   // h
    , 1, 0, 0   // c *
    , 0, 0, 0   // a *
    , 0, 1, 1   // g * 
    , 0, 1, 0 ] // b *

    /*
            g --- f
          / |   / |
        b ---- d  |
        |   |  |  |
        |   h -|- e
        | /    | /
        a ---- c 
    */

We end up repeating vertex information -- **six** times! Visualize that extra data in terms of bytes:
`3 * sizeof(float) * 6` is **`72`** extra bytes sent to the GPU that it must keep in memory, making less room for 
more interesting data, like textures or other models. 

Our ideal situation is that all data present on the GPU be *unique*. Hence, in this situation, it would be beneficial
if we could simply send the unique vertices of the cube to the GPU, and refer to the vertices using a well-known name
per vertex -- "draw vertices `a-b-c-d-e-f-b-g-e-h-c-a-g-b`". It'd be simplest to implement the vertex offset as the naming scheme -- `a` is the vertex we sent at the `0`th position, `d` is at the `3`rd position, and so on. The memory advantages would be huge: instead of sending `72` extra bytes, we could compress that (assuming 1-byte indices) into `14` bytes of element offsets!

Luckily, OpenGL affords us this convenience, through the `gl.drawElements` command:

    gl.drawElements(gl.TRIANGLE_STRIP, number_of_elements, size_of_index, initial_offset)










## Element Array Buffers

## View Matrices

### A simple camera class

### Our resource format and loader


