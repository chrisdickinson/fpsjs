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
    name        : "Deathmatch mission"
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
          , color       : [1, 0.8, 0.8]
          , x           : -5
          , y           : -5
          , h           : 5
          , w           : 10
          , r0          : 0
          , r1          : 0
        })
      , instant('Wall', {
            program     : 'wall_program'
          , texture_0   : 'wall_texture_0'
          , texture_1   : 'wall_texture_1'
          , model       : 'wall_model'
          , color       : [1, 1, 0.8]
          , x           : -15 
          , y           : -5
          , h           : 5
          , w           : 10
          , r0          : 90..degrees()
          , r1          : 0
        })
      , instant('Wall', {
            program     : 'wall_program'
          , texture_0   : 'wall_texture_0'
          , texture_1   : 'wall_texture_1'
          , model       : 'wall_model'
          , color       : [0.8, 1, 0.8]
          , x           : -5 
          , y           : 5 
          , h           : 5
          , w           : 10
          , r0          : 180..degrees()
          , r1          : 0
        })
      , instant('Wall', {
            program     : 'wall_program'
          , texture_0   : 'wall_texture_0'
          , texture_1   : 'wall_texture_1'
          , model       : 'wall_model'
          , color       : [0.8, 1, 1]
          , x           : -5  
          , y           : 5
          , h           : 10
          , w           : 10
          , r0          : 270..degrees() 
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
