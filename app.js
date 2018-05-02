require('./entity');
require('./database');
//Connect to database

var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/',function(req, res) {
    res.sendFile(__dirname + '/client/index.html');
});
app.use('/client',express.static(__dirname + '/client'));

serv.listen(8080);
console.log("Server started.");

SOCKET_LIST = {};

var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
    socket.id = Math.random();
    SOCKET_LIST[socket.id] = socket;

    socket.on('logIn',function(data){
        Database.isValidPassword(data,function(res){
            if(!res)
                 return socket.emit('signInResponse',{success:false});
                Player.onConnect(socket, data.username);
                socket.emit('signInResponse',{success:true});
        });
    });
    socket.on('signUp',function(data){
        Database.isUsernameTaken(data,function(res){
            if(res){
                socket.emit('signUpResponse',{success:false});
            } else {
                Database.addUser(data,function(){
                    socket.emit('signUpResponse',{success:true});
                });
            }
        });
    });

    socket.on('disconnect',function(){
        delete SOCKET_LIST[socket.id];
        Player.onDisconnect(socket);
    });

});

setInterval(function(){
    var packs = Entity.getFrameData();
    for(var i in SOCKET_LIST){
        var socket = SOCKET_LIST[i];
        socket.emit('init',packs.initPack);
        socket.emit('update',packs.updatePack);
        socket.emit('remove',packs.removePack);
    }

},1000/25);
