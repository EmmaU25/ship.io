//constantes globales du serveur
const express = require('express');
const path = require('path');
const session = require('express-session');
const task = require('./routes/task');
const request = require('request');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

app.set('port', process.env.PORT || 3000);
//Pour etablir la façon de render les templates
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');
//Pour savoir l'addresse des templates
app.set('views', path.join(__dirname,'views'));
app.use(express.json());

//Routes
app.get('/', (req, res, next) => {
	res.render('index',{
		Title: "ship.io"
	});
});

app.post('/data', (req, res) =>{
	var user = req.body.user;
	console.log("user:", user);
})

app.get('/goGame',(req, res) => {
	//res.redirect('/game');
	res.render('dino',{ 

	});
});

//socket IO
var players = {};
var balls = [];
io.sockets.on('connection', function(socket){
 	//console.log("New client has connected with id:", socket.id);
	  
	  socket.on('new-player', function (data) {
		//console.log("new player has state", data);
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
		
		for(var id in players){
			if(bullet.owner_id != id){
				var dx = players[id].x - bullet.x;
				var dy = players[id].y - bullet.y;
				var dist = Math.sqrt(dx *dx + dy*dy);
				if(dist < 70){
					io.emit('hit', id);
				}
			}
		}
		if(bullet.x < -10 || bullet.x > 1000 || bullet.y < -10 || bullet.y > 1000){
			balls.splice(i,1);
			i--;
		}
	}
	io.emit('balls-update', balls);
}
setInterval(ServerGameLoop,16);

app.use(task);

server.listen(app.get('port'), () => {
	console.log('server on port', app.get('port'));
});
