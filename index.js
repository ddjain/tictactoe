var express = require('express');
var socket = require('socket.io');


var app = express();
var rooms = {};
app.use(express.static('./client'))
//process.env.PORT ||
var server = app.listen(4000, function () {
    console.log("Server started on port 4000 || " + process.env.PORT)
})

var io = socket(server);
io.on("connection", function (socket) {
    console.log("Connected on " + socket.id);

    socket.on("createRoom", function (data) {
        var roomName = data.roomName;
        if (rooms[roomName] == undefined) {
            socket.join(roomName);
            rooms[roomName] = {};
            rooms[roomName].playerCount = 1
            rooms[roomName].player1 = socket.id;
            socket.emit('onRoomCreateSuccess', { msg: "New Room Created & Joined successfully", name: roomName })
            console.log(rooms);
        }
        else {
            socket.emit('onRoomCreateError', { msg: "Room Already Exsist" })
        }
    })

    socket.on("joinRoom", function (data) {
        var roomName = data.roomName;
        if (rooms[roomName] != undefined) {
            if (rooms[roomName].player1 == socket.id || rooms[roomName].player2 == socket.id) {
                socket.emit('onRoomJoinError', { msg: "You'r already Joined this room" })
                return
            }
            if (rooms[roomName].playerCount <= 2) {
                socket.join(roomName);
                rooms[roomName].playerCount++;
                rooms[roomName].player2 = socket.id;
                socket.emit('onRoomJoinSuccess', { msg: "Room Joined successfully", name: roomName })
                io.to(rooms[roomName].player1).emit('OnRoomJoined', 'Player2 Joined the room');
            }
            else {
                socket.emit('onRoomJoinError', { msg: "Room already full" })
            }
        }
        else {
            socket.emit('onRoomJoinError', { msg: "Room Not Found" })
        }
        console.log(rooms);
    })

    socket.on("updateGame", function (data) {
        console.log("******************REFRESH GAME************************** " + data.game.roomName + " ****")
        io.to(data.game.roomName).emit('refreshGame', data);
    });

    socket.on("gameWin", function (data) {
        io.to(data.game.roomName).emit('onGameWin', data.game);
    });

    socket.on("disconnect", function () {
        console.log("***************" + socket.id + " Is disconnected *******************");
        console.log(socket.rooms);
    })

})