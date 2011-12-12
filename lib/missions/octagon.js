exports.assets = {
  textures    : {
      wall_texture_0  :"/media/img/wall_0.png"
    , wall_texture_1  :"/media/img/wall_1.png"
    , sky_texture     :"/media/img/sky.jpg"
    , ground_texture  :"/media/img/wall_1.png"
    , player_texture  :"/media/img/player.png"
  }
  , programs    : {
      wall_program    : {
        fs:"/media/shaders/wall.fs"
      , vs:"/media/shaders/wall.vs"             
      }
      , billboard_program : {
        fs:"/media/shaders/billboard.fs"
      , vs:"/media/shaders/billboard.vs"
      }
    /*, sky_program     : {
        fs:"/media/shaders/sky.fs"
      , vs:"/media/shaders/sky.vs"
      }
    , ground_program  : {
        fs:"/media/shaders/ground.fs"
      , vs:"/media/shaders/ground.vs"
      }*/
  }
  , models      : {
      wall_model      : "/media/models/wall.model"
  } 
}

exports.meta = {
    name        : "Octagonal Mission"
  , win_score   : 15
}

exports.load = function(instant, asset) {
  return {
    walls:[

        instant('Wall', {
            program     : 'wall_program'
          , texture_0   : 'wall_texture_0'
          , texture_1   : 'wall_texture_1'
          , model       : 'wall_model'
          , color       : [0, 0, 0]
          , x           : 0
          , y           : 0
          , h           : 10
          , w           : 10
          , r0          : 0
          , r1          : 0
        })
        , instant('Wall', {
            program     : 'wall_program'
          , texture_0   : 'wall_texture_0'
          , texture_1   : 'wall_texture_1'
          , model       : 'wall_model'
          , color       : [0.125, 0.125, 0.125]
          , x           : 10
          , y           : 0
          , h           : 10
          , w           : 10
          , r0          : 0.125
          , r1          : 0
        })
        , instant('Wall', {
            program     : 'wall_program'
          , texture_0   : 'wall_texture_0'
          , texture_1   : 'wall_texture_1'
          , model       : 'wall_model'
          , color       : [0.25, 0.25, 0.25]
          , x           : 15
          , y           : -8.660254037844386
          , h           : 10
          , w           : 10
          , r0          : 0.25
          , r1          : 0
        })
        , instant('Wall', {
            program     : 'wall_program'
          , texture_0   : 'wall_texture_0'
          , texture_1   : 'wall_texture_1'
          , model       : 'wall_model'
          , color       : [0.375, 0.375, 0.375]
          , x           : 10.000000000000002
          , y           : -17.32050807568877
          , h           : 10
          , w           : 10
          , r0          : 0.375
          , r1          : 0
        })
        , instant('Wall', {
            program     : 'wall_program'
          , texture_0   : 'wall_texture_0'
          , texture_1   : 'wall_texture_1'
          , model       : 'wall_model'
          , color       : [0.5, 0.5, 0.5]
          , x           : 1.7763568394002505e-15
          , y           : -17.32050807568877
          , h           : 10
          , w           : 10
          , r0          : 0.5
          , r1          : 0
        })
        , instant('Wall', {
            program     : 'wall_program'
          , texture_0   : 'wall_texture_0'
          , texture_1   : 'wall_texture_1'
          , model       : 'wall_model'
          , color       : [0.625, 0.625, 0.625]
          , x           : -5.000000000000003
          , y           : -8.660254037844387
          , h           : 10
          , w           : 10
          , r0          : 0.625
          , r1          : 0
        })
        , instant('Wall', {
            program     : 'wall_program'
          , texture_0   : 'wall_texture_0'
          , texture_1   : 'wall_texture_1'
          , model       : 'wall_model'
          , color       : [0.75, 0.75, 0.75]
          , x           : -1.7763568394002505e-15
          , y           : -1.7763568394002505e-15
          , h           : 10
          , w           : 10
          , r0          : 0.75
          , r1          : 0
        })
        , instant('Wall', {
            program     : 'wall_program'
          , texture_0   : 'wall_texture_0'
          , texture_1   : 'wall_texture_1'
          , model       : 'wall_model'
          , color       : [0.875, 0.875, 0.875]
          , x           : 9.999999999999998
          , y           : 6.728558682445041e-16
          , h           : 10
          , w           : 10
          , r0          : 0.875
          , r1          : 0
        })

    ],
    spawn:[
        instant('Spawnpoint', {
            x:-6.41
          , y:3.68
          , r0:230..degrees()
        })
      , instant('Spawnpoint', {
            x:-13.5
          , y:-2.7
          , r0:51..degrees()
        })
    ]
  }
}
