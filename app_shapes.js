// Shapes app
// @author Barinov Vlad <vvbarinov@gmail.com>
// TODO: persistent object and session store (Redis?)

var users = {};
var objects = {};
var sessions = {};
var objId = 0;

var Moniker = require('moniker');
var colors = Moniker.generator([__dirname + '/lib/dicts/colors']);

// User creation
var createUser = function () {
	var user = {
        name: Moniker.choose(),
        color: colors.choose()
    };

    users[user.name] = user;

    return user;
}

var run = function (server, sessionMiddleware) {
	// Wire up socket.io
	var io = require('socket.io')(server); 
	
	io
		.use(function (socket, next) {
		    sessionMiddleware(socket.request, socket.request.res, next);
		})
		.on('connection', function (socket) {
			try {
				socket.user = setUser();	
			} catch (e) {
				console.error(e.message);
				return;
			}
			
			// welcome user and feed data
			socket.emit('login', socket.user);	
			io.emit('user joined', getUsersData());
			socket.emit('list', objects);
			
			// user closed socket
		    socket.on('disconnect', function () {
		        unsetUser(socket.user);
		        io.emit('user leaved', getUsersData());
			});

		    // new object
		    socket.on('new', function (data) {
		    	var obj = createObject(data);

		    	socket.emit('new obj', obj);
		        socket.broadcast.emit('new obj', obj);

		        log('New shape at (' + obj.x + ':' + obj.y + ') by ' + obj.username);
		    });

		    // move object
		    socket.on('move', function (data) {
		    	// TODO: check if object has proper owner
		    	 
		    	// update props
		    	if (objects[data.id]) {
		    		var obj = objects[data.id];

		    		obj.x = data.x;
		    		obj.y = data.y;

		    		objects[data.id] = obj;

		    		// emit to all, except the sender
					socket.broadcast.emit('moving obj', obj);
		    	}	
		    });

		    socket.on('clear', function() {
		    	clearUserObjects();
		    	io.emit('list', objects);

		    	log('User ' + socket.user.name + ' deleted all objects');		    	
		    });

		    function createObject(data) {
				var obj = {
					id: ++objId,
					x: data.x,
					y: data.y,
					color: data.color || socket.user.color,
					username: socket.user.name
				};

				objects[objId] = obj;

				return obj;
			}

			function setUser() {
				var user = socket.request.session.user;

				if (!user) {
					throw new Error('Cant find user in session.');
				}

				if (!sessions[user.name]) {
					sessions[user.name] = {
						name: user.name,
						sockets: 1
					};

					log('User ' + user.name + ' joined ');
				} else {
					sessions[user.name].sockets += 1;
				}
				
		    	return user;
			}

			function unsetUser(user) {
				sessions[user.name].sockets -= 1;
				if (sessions[user.name].sockets <= 0) {
					log('User ' + user.name + ' leaved');
					delete sessions[user.name];
				}
			}

			function getUsersData() {
				return {
					username: socket.user.name,
					users: sessions || {},
					total: Object.keys(sessions).length || 0
				};
			}

			function clearUserObjects() {
				for (var s in objects) {
					if (socket.user.name === objects[s].username) {
						delete objects[s];
					}
				}
			}

			function log(msg) {
				console.log((new Date).toISOString() + ' :: ' + msg);
			}
	});
}

exports.user = createUser;
exports.run = run;