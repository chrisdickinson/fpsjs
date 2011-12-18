# Cameras, element array buffers, and primitives.

Up until this article, we've been satisfied with drawing a simple, two-dimensional triangle to the screen.
By this point we've got a fairly complete mental model of what resources we need to draw an element to a screen. 
There are three final concepts I'd like to introduce at this point: **primitives**, **view matrices**, and 
**element array buffers**. By the end of the article, we should be able to create a general purpose resource loader,
and define a format for our resources. We'll also start using [`requestAnimFrame`](http://paulirish.com/2011/requestanimationframe-for-smart-animating/) to schedule our draw call (up until now, we've used `setInterval`). The linked article does a much
better job of explaining the benefits of this approach; so we won't worry ourselves overly much with it at the moment.

## Primitives

## Element Array Buffers

## View Matrices

### A simple camera class

### Our resource format and loader


