module.exports = function(server) {
	var io = require('socket.io')(server);

	io.on('connection', function(socket) {
		/*socket.on('newEvent', function(){
			socket.broadcast.emit('newEvent');
		});*/
	});
}