const cors = require('cors')
const { instrument } = require("@socket.io/admin-ui");
const express = require('express')
const app = express()
require('dotenv').config()

app.use(cors());

const io = require("socket.io")(process.env.PORT, {
    cors: {
        origin: "*"
    }
})

instrument(io, { auth: false })


const rooms = {}


io.on('connection', socket => {
    console.log(`Here : ${socket.id}`)

    socket.on('createRoom', (room, name) => {
        if (!rooms[room]) {
            socket.join(room)
            rooms[room] = {
                participants: [
                    {
                        name: name,
                        socketID: socket.id,
                        role: '',
                        character: '',
                        hand: [],
                        attacks: 1,
                        health: 0,
                        honourPoints: 0,
                        focus: 0,
                        armor: 0,
                        fastDraw: 0,
                        bushido: false
                    }
                ],
            }
            console.log(`${socket.id} created room ${room}`);
            socket.emit('joinedRoom')
        } else {
            socket.emit('joinCreatedRoom')
        }

    })

    socket.on('joinRoom', (room, name) => {
        socket.join(room)
        rooms[room].participants.push({
            name: name,
            socketID: socket.id,
            role: {},
            character: {},
            hand: [],
            attacks: 1,
            health: 0,
            honourPoints: 0,
            focus: 0,
            armor: 0,
            fastDraw: 0,
            bushido: false,
            harmless: false

        });
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
            const participantIndex = participants.findIndex(participant => participant.socketID === socket.id);
            if (participantIndex !== -1) {
                participants.splice(participantIndex, 1);
                console.log(`${socket.id} left room ${room}`);
            }
        });
    });

    socket.on('3PlayerStartGame', room => {
        io.in(room).emit('3PlayerGameStarted')
    })

    socket.on('4PlayerStartGame', room => {
        io.in(room).emit('4PlayerGameStarted')
    })
    socket.on('5PlayerStartGame', room => {
        io.in(room).emit('5PlayerGameStarted')
    })
    socket.on('6PlayerStartGame', room => {
        io.in(room).emit('6PlayerGameStarted')
    })
    socket.on('7PlayerStartGame', room => {
        io.in(room).emit('7PlayerGameStarted')
    })

    socket.on('initGameState', (playerData, room) => {
        console.log(playerData)
        rooms[room].participants.map((player, index) => {
            // player.socketID = player.socketID
            player.role = playerData[index].role
            player.character = playerData[index].character
            player.hand = playerData[index].hand
            player.attacks = playerData[index].attacks
            player.health = playerData[index].health
            player.honourPoints = playerData[index].honourPoints
        })
        const updatedPlayerData = rooms[room].participants
        const shogun = rooms[room].participants.find(participant => participant.role.role === 'Shogun')
        io.in(room).emit('setTurn', shogun)
        io.in(room).emit('initGameState', updatedPlayerData)
    })

    socket.on('updateGameState', (data, room) => {

        socket.to(room).emit('updateGameState', data)
    })

    socket.on('attacked', (selectedPlayer, room) => {
        socket.to(selectedPlayer).emit('attacked')
        io.in(room).emit('switchTurn', selectedPlayer)
    })

    socket.on('setTurnBack', (currentPlayer, data) => {
        console.log(currentPlayer)
        io.to(currentPlayer.socketID).emit('setTurnBack', currentPlayer, data)
    })

    socket.on('newTurn', (newTurn, room) => {
        io.in(room).emit('newTurn', newTurn)
    })

    socket.on('battlecryPlayed', (playerSocketID, battlecryJujitsuArray) => {
        io.to(playerSocketID).emit('battlecryPlayed', battlecryJujitsuArray)
    })
    socket.on('jujitsuPlayed', (playerSocketID, battlecryJujitsuArray) => {
        io.to(playerSocketID).emit('jujitsuPlayed', battlecryJujitsuArray)
    })

    socket.on('closeBattlecryJujitsuModule', room => {
        socket.to(room).emit('closeBattlecryJujitsuModule')
    })

})



