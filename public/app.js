$(function() {
	var socket = io.connect(window.location.hostname);

	var $scr = $('#screen');
	var $welcome = $('.welcome');
	var $users = $('#users');
	var $usersNum = $('#users-num');
	var $btn = $('#new-shape');
	var $delBtn = $('#delete-all');

	var user;

	$btn.on('click', function(e) {
		var objParams = {
			x: 50,
			y: 50
		};

		socket.emit('new', objParams);
	});

	$delBtn.on('click', function() {
		socket.emit('clear');
	});

	// user logged in
	socket.on('login', function(userData) {
		user = userData;
		$welcome.find('span').text(user.name);
	});

	// get all shapes
	socket.on('list', function(objects) {
		renderAll(objects);
	});

	// someone added new shape
	socket.on('new obj', function(data) {
		addObj(data);
	});

	// someone moving the object
	socket.on('moving obj', function(data) {
		updateObj(data);
	});

	// welcome a new user
	socket.on('user joined', function(data) {
		updateUsers(data);
	});

	// bye, user
	socket.on('user leaved', function(data) {
		updateUsers(data);
	});

	// error
	socket.on('error', function(reason) {
		console.error('Unable to connect Socket.IO', reason);
	});

	function updateUsers(data) {
		$users.html('');

		for (var n in data.users) {
			$users.append($('<li>').text(data.users[n].name));	
		}

		if (data.total == 1) {
			$usersNum.text('There is ' + data.total + ' user online');
		} else {
			$usersNum.text('There are ' + data.total + ' users online');
		}
	}

	function renderAll(objects) {
		$scr.removeLayers();
		$scr.clearCanvas();

		for (var o in objects) addObj(objects[o]);
	}

	function addObj(objData) {
		if (!user) return;

		var isDraggable = (user.name === objData.username) ? true : false;

		$scr.drawRect({
			layer: true,
			name: 'layer_' + objData.id,
			data: {
				id: objData.id,
				username: objData.username
			},
			draggable: isDraggable,
			bringToFront: true,
			fromCenter: false,
			fillStyle: objData.color,
			strokeStyle: '#666',
  			strokeWidth: 2,
			x: objData.x,
			y: objData.y,
			width: 50,
			height: 50,
			drag: function(layer) {
			    moveObj(layer);
			}
		});

		console.log('Draw obj ' + objData.id + ' (' + objData.x + ':' + objData.y + ')');
	};

	function moveObj(obj) {
		socket.emit('move', {
			id: obj.data.id,
			x: obj.x,
			y: obj.y
		});
	};

	function updateObj(obj) {
		$scr.setLayer('layer_' + obj.id, {
			x: obj.x,
			y: obj.y
		}).drawLayers();
	};
});