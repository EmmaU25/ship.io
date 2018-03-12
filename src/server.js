//constantes globales du serveur
const cors = require('cors');
const express = require('express');
const path = require('path');
const session = require('express-session');

const route = require('./routes/index');
const task = require('./routes/task');
/*const parse = require('body-parser');*/
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

//parametres
app.set('port', process.env.PORT || 3000);
//Pour etablir la façon de render les templates
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');
//Pour savoir l'addresse des templates
app.set('views/', path.join(__dirname,'views'));

//middlewares
app.use(cors());
app.use(express.json());
app.use(session({secret:'shhh'}));
//socket IO
var players = {};
var balls = [];
io.sockets.on('connection', function(socket){
 	console.log("New client has connected with id:", socket.id);
	  
	  socket.on('new-player', function (data) {
		console.log("new player has state", data);
	    players[socket.id] = data;
	    io.emit('update-player', players);
	  });
	  
	  socket.on('disconnect', function(){
	  	delete players[socket.id];
	  });
	  socket.on('move', function(data){
	  	/*console.log(players[socket.id].x);*/
	  	players[socket.id].x = data.x;
	  	players[socket.id].y = data.y;
	  	players[socket.id].angle = data.angle;
	  	io.emit('update-player', players);
	  });

	  socket.on('shoot', function(data){
	  	if(players[socket.id] == undefined) return;
	  	var new_ball = data;
	  	data.owner_id = socket.id;
	  	balls.push(new_ball);
	  });
});

function ServerGameLoop(){
	for (var i = 0; i < balls.length; i++) {
		var bullet = balls[i];
		bullet.x += bullet.speed_x;
		bullet.y += bullet.speed_y;

		if(bullet.x < -10 || bullet.x > 1000 || bullet.y < -10 || bullet.y > 1000){
			balls.splice(i,1);
			i--;
		}
	}
	io.emit('balls-update', balls);
}
setInterval(ServerGameLoop,16);
//routes
app.use(route);
app.use(task);

server.listen(app.get('port'), () => {
	console.log(' server on port', app.get('port'));
});
