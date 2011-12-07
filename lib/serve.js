var http = require('http')
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

server = http.createServer(function(req, resp) {
  var url = urlparse(req.url, true)
  console.log(req.method + ' - ' +url.pathname)

  // serve media...
  if(/^\/media\//.test(url.pathname)) {
    paperboy.deliver(root, req, resp)
  } else if(/^\/create\//.test(url.pathname) && req.method === 'POST') {
    game.create(null, req, resp)
  } else if(/^\/games\//.test(url.pathname)) {
    game.join(detail, req, resp, url.pathname.split('/').slice(-1)[0])
  } else {
    game.list(list, req, resp)
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
    console.log('JOIN', data.data.SERVER_UUID)
    game.socket_join(data.data.SERVER_UUID, data.data.CLIENT_UUID, socket, data.ack)
  })

  socket.on('ping', function(ping) {
    console.log('ping in '+(Date.now() - ping)+'ms')
  })

  socket.on('update', function(update) {

  })
})
