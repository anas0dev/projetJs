//var socket = io.connect('http://localhost:3600');

window.onload = main;

var socket;

var map, context;
var player, players = [];
var foods = [];
var mouse, mouseBis, mouseIsMoving = false;
var frameLoop;

//var global = require('./global');

var distMouse;
var gameOver = false;


var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

var cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;


function main() {
	
	socket = io.connect('http://localhost:3600');
	
	map = createMap();
	context = map.getContext("2d");
	
	/* for(let i = 0; i < 100; i++){
		foods[i] = new Circle();
	} */
	
	socket.on('newGame', function(data){
		players = data.players;
		for(let i = 0; i < players.length; i++)
			if(players[i].id === data.id)
					player = new Player(players[i].id, players[i].color, players[i].x, players[i].y);
		for(let i = 0; i < data.foods.length; i++)
			foods[i] = new Circle(data.foods[i].id, data.foods[i].x, data.foods[i].y);
	});
	
	socket.on('newPlayer', function(data){
		players.push(data.player);
		for(let i = 0; i < data.foods.length; i++)
			foods[i] = new Circle(data.foods[i].id, data.foods[i].x, data.foods[i].y);
	});
	
	socket.on('updatePlayers', function(data){
				//console.log(data.player.id);

		for(let i = 0; i < players.length; i++){
			if(players[i].id === data.player.id){
				players[i].x = data.player.x;
				players[i].y = data.player.y;
				players[i].mass = data.player.mass;
				players[i].radius = data.player.radius;
				break;
			}
		}
	});
	
	socket.on('updateFoods', function(data){
		//console.log(data.food);
		if(data.player.id !== player.name){
			for(let i = 0; i < foods.length; i++){
				if(foods[i].id === data.food){
					foods.splice(i, 1);
					break;
				}
			}
		}
	});
	
	socket.on('playerDied', function(data){
		if(data.idPlayerEating !== player.name){
			for(let i = 0; i < players.length; i++){
				if(players[i].id === data.idPlayerDied){
					players.splice(i, 1);
					break;
				}
			}
		}
	});
	
	socket.on('gameOver', function(){
		//window.alert('Game Over');
		gameOver = true;
		//player = undefined;
		//cancelAnimationFrame(frameLoop);
	});
	
	socket.on('playerDisconnect', function(data){
		for(let i = 0; i < players.length; i++){
			if(players[i].id === data.player){
				players.splice(i, 1);
				break;
			}
		}
	});

	//player = new Player("anas");
	
	frameLoop = requestAnimationFrame(onFrame);
	
}

//var eating;

function onFrame(){
	frameLoop = requestAnimationFrame(onFrame);
	//if(player.inMoving)
	
	if(player !== undefined){
		
		context.clearRect(0, 0, global.mapWidth, global.mapHeight);
		// clearArc(player.position.x, player.position.y, player.radius+1);
		// for(let i = 0; i < players.length; i++){
			// if(players[i].id !== player.name)
				// clearArc(players[i].x, players[i].y, players[i].radius+1);
		// }
		

		player.inMoving = false;
		if(!gameOver){
			player.move();
		
			//eating = false;
			for(let i = 0; i < foods.length; i++){
				if(player.distanceToCircle(foods[i]) < player.getRadius - 2){
					player.eatCircle(foods[i]);
					//clearArc(foods[i].position.x, foods[i].position.y, foods[i].radius+1);
					
					socket.emit('eatCircle', {
						player : player.name,
						playerMass : player.mass,
						playerRadius : player.radius,
						playerX : player.position.x,
						playerY : player.position.y,
						food : foods[i]
					});
					foods.splice(i, 1);
					//eating = true;
				}
			}
			
			for(let i = 0; i < players.length; i++){
				if(players[i].id !== player.name){
					if(player.position.distanceToVector(new Vector(players[i].x, players[i].y)) < player.radius - players[i].radius * 0.1 
						&& player.mass > players[i].mass /* + (players[i].mass * 0.5) */){
						player.eatPlayer(players[i]);
						
						socket.emit('eatPlayer', {
							playerDied : players[i].id,
							playerMass : player.mass,
							playerRadius : player.radius,
							playerX : player.position.x,
							playerY : player.position.y
						});
						
						players.splice(i, 1);
					}
				}
			}
			
			// context.translate(1, 1);
			if(player.inMoving){
				socket.emit('playerMove', {
					id : player.name,
					x : player.position.x,
					y : player.position.y
				});
			}
		}
		
		drawGrid();
		
		for(let i = 0; i < foods.length; i++){
			drawCircle(foods[i]);
		}
		
		for(let i = 0; i < players.length; i++){
			if(players[i].id !== player.name)
				drawEnemy(players[i]);
		}
		if(!gameOver)
			drawPlayer(player);
		else
			drawGameOver();
	}
}



