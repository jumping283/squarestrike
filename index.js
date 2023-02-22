const express = require('express');
const app = express();
const serv = require('http').Server(app);
const fs = require('fs');

app.get('/', function(req, res){
  res.sendFile(__dirname + '/client/index.html');
  console.log("express connection");
});
app.use('/client', express.static(__dirname + '/client'));

serv.listen(3005);
console.log("server started");

var players = [];
var bullets = [];
var id = 0;
var speed = 8;
const map = JSON.parse(fs.readFileSync("map.json"));

function team(x){return(x % 2)};

const io = require('socket.io')(serv, {});

io.sockets.on('connection', function(socket){
  const thisId = id;
  players.push([Math.random(), id, team(id) * 1480 + 50, 440, team(id) + 1, "", 100, 8, 0]);
  socket.emit('code', {
    code: players[id][0],
    team: players[id][4],
    plNum: id
  });
  socket.on('name', function(data){
    console.log(data.name);
    players[thisId][5] = data.name;
  })

  socket.on('movement', function(data){
    if(players[data.plNum] != undefined){
      if(players[data.plNum][0] == data.code){
        players[data.plNum][2] += data.x * speed;
        players[data.plNum][3] += data.y * speed;
      }
      collisions(data.plNum, data.x, data.y, data.team);
    }
  });

  socket.on('shoot', function(data){
    if(players[data.pl] != undefined){
      if(players[data.pl][7] > 0){
      players[data.pl][7]--;
      console.log(data.x, data.y)
      shoot(data.x, data.y, data.pl);
      } else {
        players[data.pl][7] = 0;
      }
    }
  });

  socket.on('disconnect', () => {
    players[thisId][2] = -1000;
  });

  id++;
});

function collisions(num, x, y, plTeam){
  if(players[num][2] < 0 && players[num][2] > -speed * 5){
    players[num][2] = 0;
  }
  if(players[num][2] > 1580){
    players[num][2] = 1580;
  }
  if(players[num][3] < 0){
    players[num][3] = 0;
  }
  if(players[num][3] > 880){
    players[num][3] = 880;
  }

  for(var i in map.data){
    var plX = players[num][2];
    var plY = players[num][3];
    var blX = map.data[i][1];
    var blY = map.data[i][2];
    var blW = map.data[i][3];
    var blH = map.data[i][4];

    //if block type is yes
    if(map.data[i][0] == 1 || map.data[i][0] == plTeam + 1){
      //collisions on sides of player
      if(plY < blY + blH && plY + 20 > blY){
        if(plX + 20 > blX && plX < blX + blW){
          players[num][2] -= x * speed;
        }
      }

      //collisions on top and bottom of player
      if(plX < blX + blW && plX + 20 > blX){
        if(plY + 20 > blY && plY < blY + blH){
          players[num][3] -= y * speed;
        }
      }
    }

    //reload space
    if(map.data[i][0] == -plTeam + 4 || map.data[i][0] == 4){
      if(plY > blY && plY + 20 < blY + blH){
        if(plX > blX && plX + 20 < blX + blW){
          players[num][7] = 8;
          if(players[num][6] < 99.95){
            players[num][6] += 1/20;
          }
        }
      }
    }
  }
}

function shoot(bulletX, bulletY, plId){
  this.thisPl = players[plId];
  this.bx = bulletX - thisPl[2];
  this.by = bulletY - thisPl[3];
  this.length = Math.sqrt(bx * bx + by * by);
  this.bulx = bx / length;
  this.buly = by / length;
  bullets.push([this.thisPl[2], this.thisPl[3], this.bulx, this.buly, thisPl[1]]);
}

function bulletCollision(){
  for(var i in bullets){

    //update bullet position
    bullets[i][0] += bullets[i][2] * 30;
    bullets[i][1] += bullets[i][3] * 30;
    if(bullets[i][0] != -1000){

      //if shooting map
      for(var j in map.data){
        var blkX = map.data[j][1];
        var blkY = map.data[j][2];
        var blkW = map.data[j][3];
        var blkH = map.data[j][4];
        if(bullets[i][0] + 10 > blkX && bullets[i][0] - 10 < blkX + blkW && map.data[j][0] != 4){
          if(bullets[i][1] + 10 > blkY && bullets[i][1] - 10 < blkY + blkH){
            bullets[i][0] = -1000;
            bullets[i][1] = 0;
            bullets[i][2] = 0;
            bullets[i][3] = 0;
          }
        }
      }

      //if shooting player
      for(var k in players){
        var px = players[k];
        if(bullets[i][0] + 10 > px[2] && bullets[i][0] < px[2] + 20){
          if(bullets[i][1] + 10 > px[3] && bullets[i][1] < px[3] + 20){
            if(players[k][1] != bullets[i][4]){
              bullets[i][0] = -1000;
              bullets[i][1] = 0;
              bullets[i][2] = 0;
              bullets[i][3] = 0;
              px[6] -= 35;
              if(px[6] <= 0){
                px[6] = 100;
                px[7] = 8;
                px[2] = team(px[1]) * 1480 + 50;
                px[3] = 440;
                players[bullets[i][4]][8]++;
              }
            }
          }
        }
      }
    }

    //if shooting border
    if(bullets[i][0] < 0 || bullets[i][0] > 1600){
      bullets[i][0] = -1000;
      bullets[i][1] = 0;
      bullets[i][2] = 0;
      bullets[i][3] = 0;
    }
    if(bullets[i][1] < 0 || bullets[i][1] > 900){
      bullets[i][0] = -1000;
      bullets[i][1] = 0;
      bullets[i][2] = 0;
      bullets[i][3] = 0;
    }
  }
}

function sendData(){
  io.sockets.emit('data', {
    players: players,
    bullets: bullets,
    map: map.data
  });
}

var update = setInterval(() => {
  bulletCollision();
  sendData();
}, 1000/30);

function newUpdates(){
  c
}