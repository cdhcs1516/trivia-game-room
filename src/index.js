const express = require('express');
const http = require('http');
const path = require('path');
const socketio = require('socket.io');

const {
  addPlayer,
  getAllPlayers,
  getPlayer,
  removePlayer
} = require('./utils/players');
const {
  getGameStatus,
  setGameStatus,
  setGame
} = require('./utils/games');
const formatMessage = require('./utils/formatMessage');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 8080;
const publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirectoryPath));

io.on('connection', (socket) => {
  console.log('A new player is connected.');

  socket.on('join', ({ playerName, room }, cb) => {
    const { error, newPlayer } = addPlayer({ id: socket.id, playerName, room });

    if (error) return cb(error.message);
    cb();

    socket.join(newPlayer.room);
    socket.emit('message', formatMessage('Admin', 'Welcome!'));

    socket.broadcast
      .to(newPlayer.room)
      .emit('message', formatMessage('Admin', `${newPlayer.playerName} has joined the game!`));
  
    // Emit a 'room' event to all players to update the game info
    const currPlayers = getAllPlayers(newPlayer.room);
    io.in(newPlayer.room).emit('room', {
      room: newPlayer.room,
      players: currPlayers,
      numberOfPlayers: currPlayers.length
    });
  });

  socket.on('disconnect', () => {
    console.log('A player is disconnected.');

    const disconnectedPlayer = removePlayer(socket.id);

    if (disconnectedPlayer) {
      const { playerName, room } = disconnectedPlayer;
      io.in(room).emit(
        'message',
        formatMessage('Admin', `Player ${playerName} has left!`)
      );

      const currPlayers = getAllPlayers(room);
      io.in(room).emit(
        'room',
        {
          room,
          players: currPlayers,
          numberOfPlayers: currPlayers.length
        }
      );
    }
  });

  socket.on('sendMessage', (message, cb) => {
    const { error, player } = getPlayer(socket.id);

    if (error) return cb(error.message);

    if (player) {
      io.in(player.room).emit('message', formatMessage(player.playerName, message));
      cb();
    }
  });

  socket.on('getQuestion', async (request, cb) => {
    const { error, player } = getPlayer(socket.id);
    if (error) return cb (error.message);
    
    if (player) {
      const { error, game } = await setGame();
      if (error) return cb(error.message);

      io.to(player.room).emit('sendQuestion', {
        playerName: player.playerName,
        ...game.prompt
      });
    }
  });

  socket.on('sendAnswer', (answer, cb) => {
    const { error, player } = getPlayer(socket.id);

    if (error) return cb(error);

    const { isRoundOver} = setGameStatus({
      event: 'sendAnswer',
      playerId: player.id,
      answer,
      room: player.room
    });

    io.to(player.room).emit('receiveAnswer', {
      ...formatMessage('Admin', `Player ${player.playerName} submits an answer.`),
      isRoundOver
    });

    cb();
  });

  socket.on('getCorrectAnswer', (request, cb) => {
    const { error, player } = getPlayer(socket.id);
    
    if (error) return cb(error);

    const { correctAnswer } = getGameStatus({
      event: 'getAnswer'
    });

    if (!correctAnswer) return cb(new Error('Cannot get correct answer now!'));
    
    io.to(player.room).emit('sendCorrectAnswer', { correctAnswer });

    cb();
  });
});

server.listen(port, () => {
  console.log(`Server is up on port ${port}.`);
});