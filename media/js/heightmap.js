function terrainGeneration(cvs, size, sun_r_x, sun_r_y){
	// Set these variables to adjust how the map is generated
	var mapDimension = size,
		unitSize = 2, // Power of 2
		roughness = 4,
		map,
		mapCanvas = cvs

	// Setup the map array for use
	function create2DArray(d1, d2) {
		var x = new Array(d1),
		i = 0,
		j = 0;

		for (i = 0; i < d1; i += 1) {
			x[i] = new Array(d2);
		}

		for (i=0; i < d1; i += 1) {
			for (j = 0; j < d2; j += 1) {
				x[i][j] = 0;
			}
		}

		return x;
	}

  if(roughness < 0 || isNaN(roughness)){
    roughness = 1;
  }

  if(mapDimension < 0 || isNaN(mapDimension)){
    mapDimension = 256;
  }

  if(unitSize < 1 || isNaN(unitSize)){
    unitSize = 1;
  }

  mapCanvas.width = mapDimension;
  mapCanvas.height = mapDimension;

  map = create2DArray(mapDimension+1, mapDimension+1);

  startDisplacement();

	// Save the current heightmap into a new window. Found info on http://www.nihilogic.dk/labs/canvas2image/

	// Random function to offset the center
	function displace(num){
		var max = num / (mapDimension + mapDimension) * roughness;
		return (Math.random(1.0)- 0.5) * max;
	}

	// Normalize the value to make sure its within bounds
	function normalize(value){
		if( value > 1){
			value = 1;
		}else if(value < 0){
			value = 0;
		}
		return value;
	}

	// Round to nearest pixel
	function round(n)
	{
		if (n-(parseInt(n)) >= 0.5){
			return parseInt(n)+1;
		}else{
			return parseInt(n);
		}
	}

	// Create color gradients Taken from http://www.elctech.com/snippets/javascript-color-fade-function-find-the-hex-value-between-two-hex-values  .... Its bugged however
	colorFade = function(h1, h2, p) { return ((h1>>16)+((h2>>16)-(h1>>16))*p)<<16|(h1>>8&0xFF)+((h2>>8&0xFF)-(h1>>8&0xFF))*p<<8|(h1&0xFF)+((h2&0xFF)-(h1&0xFF))*p; }

	// Workhorse of the terrain generation.
	function midpointDisplacment(dimension){
		var newDimension = dimension / 2,
			top, topRight, topLeft, bottom, bottomLeft, bottomRight, right, left, center,
			i, j;

		if (newDimension > unitSize){
			for(i = newDimension; i <= mapDimension; i += newDimension){
				for(j = newDimension; j <= mapDimension; j += newDimension){
					x = i - (newDimension / 2);
					y = j - (newDimension / 2);

					topLeft = map[i - newDimension][j - newDimension];
					topRight = map[i][j - newDimension];
					bottomLeft = map[i - newDimension][j];
					bottomRight = map[i][j];

					// Center
					map[x][y] = (topLeft + topRight + bottomLeft + bottomRight) / 4 + displace(dimension);
					map[x][y] = normalize(map[x][y]);
					center = map[x][y];

					// Top
					if(j - (newDimension * 2) + (newDimension / 2) > 0){
						map[x][j - newDimension] = (topLeft + topRight + center + map[x][j - dimension + (newDimension / 2)]) / 4 + displace(dimension);;
					}else{
						map[x][j - newDimension] = (topLeft + topRight + center) / 3+ displace(dimension);
					}

					map[x][j - newDimension] = normalize(map[x][j - newDimension]);

					// Bottom
					if(j + (newDimension / 2) < mapDimension){
						map[x][j] = (bottomLeft + bottomRight + center + map[x][j + (newDimension / 2)]) / 4+ displace(dimension);
					}else{
						map[x][j] = (bottomLeft + bottomRight + center) / 3+ displace(dimension);
					}

					map[x][j] = normalize(map[x][j]);


					//Right
					if(i + (newDimension / 2) < mapDimension){
						map[i][y] = (topRight + bottomRight + center + map[i + (newDimension / 2)][y]) / 4+ displace(dimension);
					}else{
						map[i][y] = (topRight + bottomRight + center) / 3+ displace(dimension);
					}

					map[i][y] = normalize(map[i][y]);

					// Left
					if(i - (newDimension * 2) + (newDimension / 2) > 0){
						map[i - newDimension][y] = (topLeft + bottomLeft + center + map[i - dimension + (newDimension / 2)][y]) / 4 + displace(dimension);;
					}else{
						map[i - newDimension][y] = (topLeft + bottomLeft + center) / 3+ displace(dimension);
					}

					map[i - newDimension][y] = normalize(map[i - newDimension][y]);
				}
			}
			midpointDisplacment(newDimension);
		}
	}



	// Draw the map
	function drawMap(size, canvasId, mapData){
		var canvas = cvs,
		ctx = canvas.getContext("2d"),
		canvasData = ctx.getImageData(0, 0, mapDimension, mapDimension),
		x = 0,
		y = 0,
		r = 0, g = 0, b = 0, gamma = 500,
		colorFill = 0;

    // x == height, y == shadow, z == lolwut?
    var vec = [Math.sin(sun_r_y), Math.cos(sun_r_y), Math.cos(sun_r_x)]
      , shadow

    console.log(vec[0], vec[1], vec[2])
    var log_if = function(x, y) {
      var args = [].slice.call(arguments, 2)
      if(x === 16 && y === 16) console.log.apply(console, args)
    }
		for(x = 0; x <= size; x += unitSize){
			for(y = 0; y <= size; y += unitSize){
        colorFill = Math.floor(map[x][y] * 250);

        shadow = 0
        if(Math.abs(vec[0]) > 0 || Math.abs(vec[1]) > 0)
          for(var i = 0; i < size; ++i) {
            var n_x = (x/unitSize + vec[0]*i)*unitSize
              , n_y = (y/unitSize + vec[1]*i)*unitSize
              , n_z = colorFill + vec[2]*i*unitSize

            log_if(x, y, x, y, n_x, n_y, n_z-colorFill, n_z, colorFill)

            if(~~n_x === x && ~~n_y === y)
              continue

            if(n_x < 0 || n_y < 0)
              break

            if(n_z < 0)
              break

            if(n_z > 250)
              break

            if(map[~~n_x] === undefined)
              continue

            if(map[~~n_x][~~n_y] * 250 > n_z) {
              shadow = 32 
              break
            }
          }

        ctx.fillStyle = "rgb(" + colorFill + "," +  shadow + "," + shadow  +")";
				ctx.fillRect (x, y, unitSize, unitSize);
			}
		}
	}

	// Starts off the map generation, seeds the first 4 corners
	function startDisplacement(){
		var x = mapDimension,
			y = mapDimension,
			tr, tl, t, br, bl, b, r, l, center;

		// top left
		map[0][0] = Math.random(1.0);
		tl = map[0][0];

		// bottom left
		map[0][mapDimension] = Math.random(1.0);
		bl = map[0][mapDimension];

		// top right
		map[mapDimension][0] = Math.random(1.0);
		tr = map[mapDimension][0];

		// bottom right
		map[mapDimension][mapDimension] = Math.random(1.0);
		br = map[mapDimension][mapDimension]

		// Center
		map[mapDimension / 2][mapDimension / 2] = map[0][0] + map[0][mapDimension] + map[mapDimension][0] + map[mapDimension][mapDimension] / 4;
		map[mapDimension / 2][mapDimension / 2] = normalize(map[mapDimension / 2][mapDimension / 2]);
		center = map[mapDimension / 2][mapDimension / 2];

		map[mapDimension / 2][mapDimension] = bl + br + center / 3;
		map[mapDimension / 2][0] = tl + tr + center / 3;
		map[mapDimension][mapDimension / 2] = tr + br + center / 3;
		map[0][mapDimension / 2] = tl + bl + center / 3;

		// Call displacment
		midpointDisplacment(mapDimension);

		// Draw everything after the terrain vals are generated
		drawMap(mapDimension, "canvas", map);
	}

  return cvs
};
