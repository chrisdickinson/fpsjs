<script type="text/javascript" src="/fpsjs/media/js/heightmap.js"></script>
<script type="text/javascript" src="/fpsjs/media/js/glmatrix.js"></script>
<script type="text/javascript" src="/fpsjs/media/js/terrain.js"></script>
<canvas id="canvas" width="640" height="480">
</canvas>

<script type="text/javascript">
  onload = function() {
    var size = ~~prompt('what size?')
      , cvs = document.getElementById('canvas')
    start(cvs, size)
  }
</script>
