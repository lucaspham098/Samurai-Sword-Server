// const cors = require('cors')
const { instrument } = require("@socket.io/admin-ui");
const express = require('express')
const app = express()
require('dotenv').config()
const CLIENT_URL = process.env.CLIENT_URL
const PORT = process.env.PORT

const io = require("socket.io")(PORT, {
    cors: {
        origin: ["https://admin.socket.io/", CLIENT_URL]
    }
})

instrument(io, { auth: false })


const rooms = {}


io.on('connection', socket => {
    console.log(`Here : ${socket.id}`)

    socket.on('createRoom', (room) => {
        if (!rooms[room]) {
            socket.join(room)
            rooms[room] = {
                participants: [socket.id],
            }
            console.log(`${socket.id} created room ${room}`);
            socket.emit('joinedRoom')
        } else {
            socket.emit('joinCreatedRoom')
        }

    })

    socket.on('joinRoom', room => {
        socket.join(room)
        rooms[room].participants.push(socket.id);
        console.log(`${socket.id} joined room ${room} with ${rooms[room].participants.length}`)
        socket.emit('joinedRoom')
    })

    socket.on('findRoom', room => {
        if (rooms[room] && rooms[room].participants.length < 7) {
            socket.emit('navToLobby')
        } else {
            const message = 'Room does not exist or is full'
            socket.emit('errorMessage', message);
        }
    });

    socket.on('askForPlayers', room => {
        if (rooms[room]) {
            const players = rooms[room].participants.map((player) => {
                return player
            })
            io.in(room).emit('players', players)
        }
    })

    socket.on('disconnect', () => {
        Object.keys(rooms).forEach((room) => {
            const participants = rooms[room].participants;
            const participantIndex = participants.indexOf(socket.id);
            if (participantIndex !== -1) {
                participants.splice(participantIndex, 1);
                console.log(`${socket.id} left room ${room}`);
            }
        });
    });

    socket.on('startGame', room => {
        io.in(room).emit('gameStarted')
    })

    socket.on('initGameState', data => {
        console.log('recieve from the client')
        console.log(data)
        io.in(data.room).emit('initGameState', data)
    })
})



