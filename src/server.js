//constantes globales du serveur
const express = require('express');
const path = require('path');
const session = require('express-session');
const task = require('./routes/task');
const request = require('request');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const cookieParser = require('cookie-parser');

//Variables globales du serveur
var players = {};
var balls = [];
var users = [];
var userN;


	app.use(cookieParser());
app.set('port', process.env.PORT || 3000);
//Pour etablir la façon de render les templates
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');
//Pour savoir l'addresse des templates
app.set('views', path.join(__dirname,'views'));
app.use(express.json());
app.use(session({secret:'shhh'}))


//Routes
app.get('/', (req, res, next) => {
	res.render('index',{
		Title: "ship.io"
	});
});

app.post('/data', (req, res) =>{
	userN = req.body.user;
	users.push(userN);
})

app.get('/goGame',(req, res) => {
	//res.redirect('/game');
	if (users.indexOf(userN) > -1) {
		console.log("user:", userN);
		res.render('dino',{ 
			user: userN
		});	
	}else {
		res.redirect('/');
	}
});

//socket IO
io.sockets.on('connection', function(socket){
 	//console.log("New client has connected with id:", socket.id);
	  
	  socket.on('new-player', function (data) {
		//console.log("new player has state", data);
	    players[socket.id] = data;
	    players[socket.id].username = userN;
	    console.log(players);
	    io.emit('update-player', players);
	  });
	  
	  socket.on('disconnect', function(){
	  	var index = users.indexOf(players[socket.id].username);
	  	users.splice(index,1);
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

	  socket.on("touch", function(data){
	  	socket.emit('msg',"<li>"+ players[data.shoot].username +" a touché "+players[data.fired].username+"</li>");
	  	socket.broadcast.emit('msg', "<li>"+players[data.shoot].username +" a touché "+players[data.fired].username+"</li>");
	  	players[data.shoot].score +=1;
	  });

	  socket.on('message', function(msg){
	  	socket.emit('message',"<li class='left clearfix'><span class='chat-img pull-left'><img src='https://icon-icons.com/icons2/706/PNG/512/cruise-ship_icon-icons.com_61851.png' alt='User Avatar' class='img-circle'/></span><div class='chat-body clearfix'><div class='header'><strong class='primary-font'>"+players[socket.id].username+":</strong></div><p>"+msg+"</p></div></li");
	  	socket.broadcast.emit('message',"<li class='left clearfix'><span class='chat-img pull-left'><img src='https://icon-icons.com/icons2/706/PNG/512/cruise-ship_icon-icons.com_61851.png' alt='User Avatar' class='img-circle'/></span><div class='chat-body clearfix'><div class='header'><strong class='primary-font'>"+players[socket.id].username+":</strong></div><p>"+msg+"</p></div></li>");
	  })
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
