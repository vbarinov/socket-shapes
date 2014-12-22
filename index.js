// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var session = require('express-session');

var sessionMiddleware = session({
	secret: 'ad09j493nv-30kfing53h32ud@',
	cookie: { maxAge: 60000*60*24*365 },
	resave: false,
  	saveUninitialized: true
});

// load shapes app
var shapesApp = require('./app_shapes');
shapesApp.run(server, sessionMiddleware);


// Routing
app
	.use(express.static(__dirname + '/public'))
	.use(sessionMiddleware)
	.get('/', function (req, res) {
		// TODO: inject app.user
		if (!req.session.user) req.session.user = shapesApp.user();

		res.sendFile(__dirname + '/public/main.html');
	})
	.use(function(req, res, next){
		res.status(404).send('Sorry can\'t find that!');
	});

var port = process.env.PORT || 3000;
server.listen(port, function () {
	console.log('Server listening at port %d', port);
});