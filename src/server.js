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
app.set('views', path.join(__dirname,'views'));

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
	  socket.on('shoot', function(data){
	  	var Nball = data;
	  	data.owner_id = socket.id;
	  	balls.push(Nball);
	  });
	  socket.on('move', function(data){
	  	/*console.log(players[socket.id].x);*/
	  	players[socket.id].x = data.x;
	  	players[socket.id].y = data.y;
	  	players[socket.id].angle = data.angle;
	  	io.emit('update-player', players);
	  });
});

function ServerGameLoop(){
	for (var i = 0; i < balls.length; i++) {
		var b = balls[i];
		b.x += b.speedX;
		b.y += b.speedY;

		for(var i in players){
			if(b.owner_id != i){
				var dx = players[i].x - b.x;
				var dy = players[i].y - b.y;
				var dist = Math.sqrt(dx * dx + dy*dy);
				if(dist < 70){
					io.emit('hit', i);
				}
			}
		}
		/*if(b.sprite.x < -10 || b.sprite.x > 1000 || b.sprite.y < -10 || b.sprite.y > 1000){
			balls.splice(i,1);
			i--;
		}*/
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
