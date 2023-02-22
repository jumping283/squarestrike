const socket = io();
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
const keystate = [];
var code;
var plNum;
var team;
var playing = 0;
var plName = "";

canvas.width = 1600;
canvas.height = 900;



document.addEventListener('keydown', e => {
  e.preventDefault();  
  if (!keystate[e.keyCode]) {
    if(playing == 1){
      keystate[e.keyCode] = true;
      movement();
    }
    if(playing == 0){
      if(e.key === "Backspace"){
        plName = plName.slice(0, -1); 
      } else if(e.key === "Enter"){
        socket.emit('name', {name: plName});
        playing = 1;
      } else {
        plName = plName.concat(e.key);
        console.log(plName);
      }
    }  
  }
});
document.addEventListener('keyup', e => {
  e.preventDefault();
  delete keystate[e.keyCode];
  movement();
})
document.addEventListener('mousedown', e => {
  var bx = e.clientX / window.innerWidth;
  var by = e.clientY / window.innerHeight;
  if(playing == 1){
    socket.emit('shoot', {
      x: bx * 1600,
      y: by * 900,
      pl: plNum
    }, false);
  }
})





var movementUpdate = setInterval(movement, 1000 / 30);

socket.on('code', function(data){
  code = data.code;
  plNum = data.plNum;
  team = data.team;
  console.log(team);
});

function movement(){
  let x = 0,
  y = 0;

  if (keystate[87]) y--;
  if (keystate[65]) x--;
  if (keystate[83]) y++;
  if (keystate[68]) x++;

  if(code != undefined && plNum != undefined && playing == 1){
    socket.emit('movement', {
      code: code,
      team: team,
      plNum: plNum,
      x: x,
      y: y
    });
  }
}



socket.on('data', function(data){
  drawScreen(data.players[plNum][5], data.players[plNum][6], data.players[plNum][7], data.players[plNum][8]);
  for(var i in data.map){
    var map = data.map[i];
    drawMap(map[1], map[2], map[3], map[4], map[5]);
  }
  for(var i in data.players){
    var thisPl = data.players[i];
    drawPlayers(thisPl[5], thisPl[2], thisPl[3], thisPl[4]+1, thisPl[6], thisPl[8]);
  }
  for(var i in data.bullets){
    var b = data.bullets[i];
    drawBullets(b[0], b[1]);
  }
});



function drawScreen(name, health, reload, score){
  if(playing == 0){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.font = "40px Arial";
    ctx.fillText("Multiplayer Game 2", 800, 200);
    ctx.fillStyle = "#333";
    ctx.fillRect(0, 350, canvas.width, 100);
    ctx.fillStyle = "white";
    ctx.font = "25px Arial";
    ctx.fillText("Name: ", 400, 410);
    ctx.textAlign = "left";
    ctx.fillText(plName, 450, 410);
  }
  if(playing == 1){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 10;
    ctx.strokeStyle = "#222";
    ctx.moveTo(0, 0);
    ctx.fillRect(0, 0, 300, 100);
    ctx.lineTo(350, 0);
    ctx.lineTo(320, 70);
    ctx.lineTo(0, 70);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.textAlign = "left";
    ctx.fillText(name, 20, 40, 150);
    ctx.font = "44px Arial";
    ctx.fillText(score, 365, 60);
    ctx.fillStyle = "red";
    ctx.fillRect(180, 15, health * 1.3, 13);
    ctx.fillStyle = "blue";
    ctx.fillRect(180, 40, reload * 16.25, 13);
  }
}

function drawMap(x, y, w, h, c){
  if(playing == 1){
    ctx.fillStyle = c;
    ctx.fillRect(x, y, w, h);
  }
}

function drawPlayers(name, x, y, team, health, score){
  if(playing == 1){
    ctx.fillStyle = "hsl(" + team*180 + ", 100%, 50%";
    ctx.fillRect(x, y, 20, 20)
    //ctx.fillStyle = "hsl(" + color + ", 100%, 50%)";
    //ctx.fillRect(x + 7, y + 7, 6, 6);
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "white";
    ctx.fillText(name, x + 10, y - 18);
    ctx.fillText(score, x + 10, y + 15);
    ctx.fillRect(x - 10, y - 10.5, 40, 5);
    ctx.fillStyle = "red";
    ctx.fillRect(x - 9.45, y - 10, health * 0.375, 4);
  }
}

function drawBullets(x, y){
  if(playing == 1){
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, 2 * Math.PI);
    ctx.strokeStyle = "orange";
    ctx.closePath();
    ctx.stroke();
  }
}