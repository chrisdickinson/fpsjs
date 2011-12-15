#!/usr/bin/env node

var fs = require('fs')
  , path = require('path')
  , watch = fs.watchFile
  , spawn = require('child_process').spawn
  , WORKING_DIR = path.join(__dirname, 'entries')
  , OUTPUT_DIR = path.join(__dirname, 'posts')
  , showdown = require('showdown').Showdown
  , highlight = require('./media/js/highlight')
  , tpl = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8')
  , converter = new showdown.converter

var insert_tpl = function(data) {
  var start = tpl.indexOf('<!--ins-->')
    , end = tpl.indexOf('<!--/ins-->')
    , html = [].slice.call(tpl)

  html.splice.apply(html, [start, end-start].concat([].slice.call(data)))
  return html.join('')
}

var contents = function(ready) {
  var ls = spawn('ls', [WORKING_DIR])
    , output = []
    , gather = output.push.bind(output)
    , trim = "".trim.call.bind("".trim)

  ls.stdout.on('data', gather)

  ls.on('exit', function(err) {
    output = output.join('').split('\n').filter(function(item) {
      return item.trim().length > 0
    }).map(trim)

    ready(output)
  })
}

setInterval(function() {
  contents(function(files) {
    files.forEach(function(file) {
      var data = insert_tpl(converter.makeHtml(fs.readFileSync(path.join(WORKING_DIR, file), 'utf8')
                   .replace(/ -- /g, ' &mdash; ')))
        , target = path.join(OUTPUT_DIR, file.replace('.md', '').replace('_', '/'))
      spawn('mkdir', ['-p', target])
        .on('exit', function(code) {
          fs.writeFileSync(path.join(target, 'index.html'), data)
        })
    })
  })
}, 100)

