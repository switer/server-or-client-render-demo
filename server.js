'use strict';

var express = require('express')
var path = require('path')
var fs = require('fs')
var app = express()
var colors = require('colors')
var hdbs = require('handlebars')

/**
 *  static folder
 **/
app.use(express.static(path.join(__dirname, './views')))

var components = {}
function engine (view, root) {
	var index = 0
	return view.replace(/\{%([\s\S]+?)%\}/gm, function (m, n) {
		var cid = root + '.' + index++
		n = n.trim()
		var pairs = n.split(/\s+/)
		var attrs = {}
		pairs.forEach(function (a) {
			a = a.match(/^(\w+?)="(.*?)"$/)
			attrs[a[1]] = a[2]
		})
		var component = attrs.component
		var componentTpl = components[component]
		if (!componentTpl) {
			componentTpl = fs.readFileSync(path.join('./components', component, component + '.tpl'), 'utf-8')
			components[component] = componentTpl
		}
		var content = engine(componentTpl, cid)
		return '<div class="' + (attrs.class || '') + '" cid="' + cid + '">' + content + '</div>'
	})
}
app.get('/ab', function (req, res) {
	res.send('ok')
})

var layout = fs.readFileSync('./layout.html', 'utf-8')
var views = {}
app.get('/p/:page', function (req, res) {

	var serverSide = req.query.server

	var page = req.params.page
	var data = {
		title: page,
		name: 'submit'
	}
	var view = views[page]
	if (!view) {
		view = fs.readFileSync('./views/' + page + '.tpl', 'utf-8')
		views[page] = view
	}
	view = engine(view, page)
	res.send(layout.replace('{% view %}', function (m) {
		if (serverSide) {
			return hdbs.compile(view)(data)
		}

		return '<div cid="' + page + '"><script>$content</script></div>'.replace('$content', function () {
			function run (tpl, cid, data) {
				var view = Handlebars.compile(tpl)(data)
				document.querySelector('[cid="' + cid + '"]').innerHTML = view
			}
			return '(' + run.toString() + ')($tpl, $cid, $data)'
						.replace('$tpl', JSON.stringify(view))
						.replace('$cid', '"' + page + '"')
						.replace('$data', JSON.stringify(data))
		})
	}))
})

/**
 *  server and port
 **/
var port = process.env.PORT || 1024
app.listen(port, function () {
    console.log('Server is listen on port', String(port).blue)
    
})