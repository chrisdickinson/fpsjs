var ENTRY_PATH = '/entries/'

function add_class(el, classname) {
  el.classList.add(classname)
}

function remove_class(el, classname) {
  el.classList.remove(classname)
}

function xhr_get(loc, ready) {
  var xhr = new XMLHttpRequest
  xhr.open('GET', loc)
  xhr.onreadystatechange = function xhr_respond () {
    if(xhr.readyState === 4) {
      ready(xhr.status === 200 ? null : new Error('Could not fetch '+loc), xhr.responseText)
    }
  }
  xhr.send(null)
}

function md_get(entry, ready) {
  var loc = ENTRY_PATH + entry + '.md'
    , converter = md_get.converter

  xhr_get(loc, function(err, text) {
    if(err) return ready(err)

    ready(null, converter.makeHtml(text.replace(/ -- /g, ' &mdash; ')))
  })
}

md_get.converter = new Showdown.converter()

function decorate_entry(entry, ready) {
  var target = decorate_entry.temporary
    , links
    , code
    , el
    , i

  if(decorate_entry.cache[entry]) {
    return ready(null, decorate_entry.cache[entry])
  }

  md_get(entry, function(err, html) {
    if(err) return ready(err)

    target.innerHTML = html
    links = target.getElementsByTagName('a')

    for(i = 0; el = links[i]; ++i) {
      el.addEventListener('click', click_link, true)
    }

    code = target.getElementsByTagName('code')

    for(i = 0; el = code[i]; ++i) {
      hljs.highlightBlock(el, '  ')
    }

    setTimeout(function() {
      decorate_entry.cache[entry] = [].slice.call(target.children)
      ready(null, [].slice.call(target.children))
    }, 100)
  })
}
decorate_entry.temporary = document.createElement('div')
decorate_entry.cache = {}

function click_link(ev) {
  var el = this
    , href = el.href.replace(window.location, '')
    , target = click_link.target
    , temporary = click_link.temporary

  if(href.charAt(0) === '#') {
    ev.preventDefault()
    
    add_class(target, 'loading')
    decorate_entry(href.slice(1), function(err, elements) {
      remove_class(target, 'loading')
      if(err) return ready(err)

      target.innerHTML = ''
      for(var i = 0, el; el = elements[i]; ++i) {
        target.appendChild(elements[i])
      }

      [].slice.call(target.getElementsByTagName('script')).forEach(function(script) {
        if(script.innerText)
          script = new Function('return function() { try { '+script.innerText+' } catch(err) {} }')()()
      })

      push_history(href.slice(1))
    })
  } else {
  }
}

click_link.target = document.getElementById('container')

function push_history(loc) {
  history.pushState(loc, loc.replace('_', '/'), loc)
}

addEventListener('popstate', function(ev) {
  var loc = ev.state
  if(loc) {
    add_class(click_link.target, 'loading')
    decorate_entry(ev.state.replace(/\//g, '_'), function(err, elements) {
      remove_class(click_link.target, 'loading')
      if(err) return
      
      click_link.target.innerHTML = ''
      for(var i = 0, el; el = elements[i]; ++i) {
        click_link.target.appendChild(el)
      }
    })  
  } else {
    add_class(click_link.target, 'loading')
    click_link.target.innerHTML = ''
    for(var i = 0, el; el = base_data[i]; ++i) {
      click_link.target.appendChild(el)
    }
    remove_class(click_link.target, 'loading')
  }
})

var links = document.body.getElementsByTagName('a')
  , base_data = [].slice.call(click_link.target.children)

for(var i = 0, el; el = links[i]; ++i)
  links[i].addEventListener('click', click_link, true)
