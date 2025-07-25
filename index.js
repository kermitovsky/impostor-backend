const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // pozwól na połączenia z dowolnego origin (możesz ograniczyć do Netlify)
  }
});

const PORT = process.env.PORT || 3000;

let rooms = {};

io.on('connection', (socket) => {
    console.log('Nowe połączenie', socket.id);

    socket.on('createRoom', (roomCode) => {
        if (!rooms[roomCode]) {
            rooms[roomCode] = { players: [] };
            console.log(`Utworzono pokój: ${roomCode}`);
        }
        socket.join(roomCode);
    });

    socket.on('joinRoom', ({ roomCode, playerName }) => {
        if (rooms[roomCode]) {
            rooms[roomCode].players.push({ id: socket.id, name: playerName });
            socket.join(roomCode);
            console.log(`${playerName} dołączył do pokoju ${roomCode}`);
            io.to(roomCode).emit('playerList', rooms[roomCode].players);
        }
    });

    socket.on('startGame', (roomCode) => {
        if (rooms[roomCode]) {
            const players = rooms[roomCode].players;
            if (players.length === 0) return;

            const impostorIndex = Math.floor(Math.random() * players.length);
            const secretWord = getRandomWord();

            players.forEach((player, index) => {
                if (index === impostorIndex) {
                    io.to(player.id).emit('role', { role: 'impostor' });
                } else {
                    io.to(player.id).emit('role', { role: 'player', word: secretWord });
                }
            });

            console.log(`Gra w pokoju ${roomCode} rozpoczęta. Słowo: ${secretWord}`);
        }
    });

    socket.on('disconnect', () => {
        console.log('Rozłączono:', socket.id);
        // Usuwanie gracza z pokoi i emitowanie nowej listy
        for (const roomCode in rooms) {
            const players = rooms[roomCode].players;
            const index = players.findIndex(p

