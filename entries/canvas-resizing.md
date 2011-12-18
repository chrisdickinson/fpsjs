# Canvas Resizing of Images

Often we'll encounter non-power-of-two textures. It's useful to be able
to resize these into power of two textures. Luckily, the canvas 2D api
allows for this eventuality:

    function next_power_of_two(size) {
      if((size & (size - 1)) !== 0) {
        --size
        for(var i = 1; i < 32; i <<= 1)
          size = size | size >> i
        size += 1
      } 
      return size
    }

    function resize_image(image) {
      if(image.width === image.height && (image.width & (image.width - 1)) === 0)
        return image

      var canvas = document.createElement('canvas')
        , ctxt = canvas.getContext('2d')
        , width = next_power_of_two(image.width)
        , height = next_power_of_two(image.height)

      var new_size = Math.min(
        Math.abs(width - image.width)
      , Math.abs(height - image.height)
      ) === width - image.width ? width : height

      canvas.width = canvas.height = new_size
      ctxt.drawImage(
          image
        , 0
        , 0
        , image.width
        , image.height
        , 0
        , 0
        , new_size
        , new_size
      )

      return canvas
    }

A note about what we're attempting to accomplish here: we'd like to scale our non-power-of-two
texture to a square, power of two-sized image. The first step is to determine whether or
not our texture is square, which is a simple `image.width === image.height`. Next, we determine
whether or not that size is a power of two:

    (image.width & (image.width - 1)) === 0 

Let's take a look at what this actually performs for some example numbers:

    256: 100000000 & 011111111 === 000000000 (power of two!) 
    192: 011000000 & 010111111 === 010000000 (not a power of two!)

Looks good. Next, we need to find the next power of two:

    --size
    for(var i = 1; i < 32; i <<= 1)
        size = size | size >> i

Unrolled, the algorithm looks like the following:

    --val                       // 192 - 1 = 191    (010111111)
    val = val | (val >> 1)      // 191 | 95 = 255   (011111111)
    val = val | (val >> 2)      // 255 | 63 = 255   (011111111)
    val = val | (val >> 4)      // .. from here out val == 255
    val = val | (val >> 8)
    val = val | (val >> 16)
    ++val                       // 255 + 1 === 256 (011111111 + 000000001 === 100000000)
 
In essence, we're attempting to set every bit from the first `1` bit to the last bit to `1`, and
then we add `1` to the result to get a power of two.

Our function then takes the next power two of each side, and then attempts to determine which power
of two results in less distance from the original size, and sets the canvas we're rendering into to that
power of two.

<canvas id="original_image" class="imgleft"></canvas>
<canvas id="new_image" class="imgright"></canvas>

The NPOT texture on the left gets distorted into a power of two texture on the right.

<script type="text/javascript">
  var img = new Image
    , lhs = document.getElementById('original_image')
    , rhs = document.getElementById('new_image')

    function next_power_of_two(size) {
      if((size & (size - 1)) !== 0) {
        --size
        for(var i = 1; i < 32; i <<= 1)
          size = size | size >> i
        size += 1
      } 
      return size
    }

  function resize_image(image, cvs) {
    var canvas = cvs || document.createElement('canvas')
        , ctxt = canvas.getContext('2d')
        , width = next_power_of_two(image.width)
        , height = next_power_of_two(image.height)

      var new_size = Math.min(
        Math.abs(width - image.width)
      , Math.abs(height - image.height)
      ) === width - image.width ? width : height

    canvas.width = canvas.height = new_size
    ctxt.drawImage(
        image
      , 0
      , 0
      , image.width
      , image.height
      , 0
      , 0
      , new_size
      , new_size
    )

    return canvas
  }

  img.src = '/media/img/npot.jpg'
  img.onload = function() {
    var lhs_ctxt = lhs.getContext('2d')
   
    lhs.width = img.width
    lhs.height = img.height 
    lhs_ctxt.drawImage(img, 0, 0, img.width, img.height)

    resize_image(img, rhs)
  }
</script>
