var connect = require('connect')
  , crypto = require('crypto')
  , fs = require('fs')
  , urlparse = require('url').parse
  , paperboy = require('paperboy')
  , path = require('path')
  , root = path.join(__dirname, '..')
  , io = require('socket.io')
  , map = {}
  , port = !isNaN(process.argv[process.argv.length-1]) ? ~~process.argv[process.argv.length-1] : 8000 
  , server
  , game = require('./game')
  , plate = require('plate')

var list = new plate.Template(fs.readFileSync(path.join(__dirname, 'templates', 'list.html'), 'utf8'))
  , detail = new plate.Template(fs.readFileSync(path.join(__dirname, 'templates', 'detail.html'), 'utf8'))
  , login = new plate.Template(fs.readFileSync(path.join(__dirname, 'templates', 'login.html'), 'utf8'))

server = connect.createServer(
  connect.cookieParser()
, connect.session({secret:'lolol'})  
, connect.bodyParser()  
, function(req, resp) {
  var url = urlparse(req.url, true)
  // serve media...
  if(/^\/media\//.test(url.pathname)) {
    paperboy.deliver(root, req, resp)
  } else {
    if(!req.session.screenname && !(req.body || {}).screenname) {
      return login.render({next:url.pathname}, function(err, data) {
        resp.writeHead(200, {'Content-Type':'text/html'})
        resp.end(data)
      })
    } else if((req.body || {}).screenname) {
      req.session.screenname = req.body.screenname
      if(req.body.next) {
        resp.writeHead(302, {Location:req.body.next})
        return resp.end()
      }
    }

    if(/^\/create\//.test(url.pathname) && req.method === 'POST') {
      game.create(null, req, resp)
    } else if(/^\/games\//.test(url.pathname)) {
      game.join(detail, req, resp, url.pathname.split('/').slice(-1)[0])
    } else {
      game.list(list, req, resp)
    }
  }
})

io = io.listen(server)
io.configure(function() {
  io.set('log level', 0)
  io.set('loglevel', 0)
})

server.listen(port)

console.log('listening on '+port)

io.sockets.on('connection', function(socket) {
  socket.on('join', function(data) {
    game.socket_join(
        data.data.screenname
      , data.data.threads.SERVER_UUID
      , data.data.threads.CLIENT_UUID
      , socket
      , data.ack
    )
  })
})
