// const cors = require('cors')
const { instrument } = require("@socket.io/admin-ui");
const express = require('express')
const app = express()
require('dotenv').config()
const CLIENT_URL = process.env.CLIENT_URL
const PORT = process.env.PORT
const io = require("socket.io")(3001, {
    cors: {
        origin: ['https://admin.socket.io/', CLIENT_URL]
    }
})

instrument(io, { auth: false })


const rooms = {}

io.on('connection', socket => {
    console.log(`Here : ${socket.id}`)

    socket.on('createRoom', (room) => {
        socket.join(room)
        rooms[room] = {
            participants: [socket.id],
        }
        console.log(`${socket.id} created room ${room} with ${rooms[room].participants.length} participant(s)`);
    })

    socket.on('joinRoom', room => {
        if (rooms[room] && rooms[room].participants.length < 8) {
            socket.join(room);
            rooms[room].participants.push(socket.id);
            console.log(`${socket.id} joined room ${room} with ${rooms[room].participants.length}`);
        } else {
            const message = 'Room does not exist or is full'
            socket.emit('errorMessage', message);
        }
    });
})

app.listen(PORT, () => {
    console.log(`we live on ${3001}`)
})


