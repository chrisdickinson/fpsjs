# Canvas Resizing of Images

Often we'll encounter non-power-of-two textures. It's useful to be able
to resize these into power of two textures. Luckily, the canvas 2D api
allows for this eventuality:

    function resize_image(image) {
      var canvas = document.createElement('canvas')
        , ctxt = canvas.getContext('2d')

      var new_size = Math.max(image.width, image.height)

      if(!(new_size & (new_size - 1)) === 0) {
        --new_size
        for(var i = 0; i < 32; i <<= 1)
          new_size = new_size | new_size >> i
        new_size += 1
      } 

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

<canvas id="original_image" class="imgleft"></canvas>
<canvas id="new_image" class="imgright"></canvas>

The NPOT texture on the left gets distorted into a power of two texture on the right.

<script type="text/javascript">
  var img = new Image
    , lhs = document.getElementById('original_image')
    , rhs = document.getElementById('new_image')

  function resize_image(image, cvs) {
    var canvas = cvs || document.createElement('canvas')
      , ctxt = canvas.getContext('2d')

    var new_size = Math.max(image.width, image.height)

    if(!(new_size & (new_size - 1)) === 0) {
      --new_size
      for(var i = 0; i < 32; i <<= 1)
        new_size = new_size | new_size >> i
      new_size += 1
    } 

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
