const cors = require('cors')
const { instrument } = require("@socket.io/admin-ui");
const express = require('express')
const app = express()
require('dotenv').config()
// const CLIENT_URL = process.env.CLIENT_URL
// const PORT = process.env.PORT

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
        // const updatedPlayerData = rooms[room].participants.map((player, index) => {
        //     return {
        //         socketID: player.socketID,
        //         role: playerData[index].role,
        //         character: playerData[index].character,
        //         hand: playerData[index].hand,
        //         attacks: playerData[index].attacks,
        //         health: playerData[index].health,
        //         honourPoints: playerData[index].honourPoints
        //     }
        // })
        // const shogun = updatedPlayerData.find(participant => participant.role.role === 'Shogun')

        const updatedPlayerData = rooms[room].participants
        const shogun = rooms[room].participants.find(participant => participant.role.role === 'Shogun')
        io.in(room).emit('setTurn', shogun)
        io.in(room).emit('initGameState', updatedPlayerData)
    })

    socket.on('updateGameState', (data, room) => {
        // rooms[room].participants.map((player, index) => {
        //     player.hand = playerData[index].hand
        // })
        socket.to(room).emit('updateGameState', data)
    })

    socket.on('attacked', (selectedPlayer, room) => {
        socket.to(selectedPlayer).emit('attacked')
        io.in(room).emit('switchTurn', selectedPlayer)
    })

    socket.on('setTurnBack', (currentPlayer) => {
        console.log(currentPlayer)
        io.to(currentPlayer.socketID).emit('setTurnBack', currentPlayer)
    })

    socket.on('newTurn', (newTurn, room) => {
        io.in(room).emit('newTurn', newTurn)
    })


    socket.on('battlecryPlayed', (room, playersData) => {
        socket.to(room).emit('battlecryPlayed', playersData)
    })
    socket.on('jujitsuPlayed', (room, playersData) => {
        socket.to(room).emit('jujitsuPlayed', playersData)
    })


})



