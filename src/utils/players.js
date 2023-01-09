const players = [];

// Add a player to the game
const addPlayer = ({ id, playerName, room }) => {
  if (!playerName || !room) {
    return {
      error: new Error('Please enter a player name and room!')
    };
  }

  playerName = playerName.trim().toLowerCase();
  room = room.trim().toLowerCase();

  const existingPlayer = players.find((player) => player.room === room && player.playerName === playerName);

  if (existingPlayer) {
    return {
      error: new Error('Player name is in use! Please try another one.')
    };
  }

  const newPlayer = { id, playerName, room };
  players.push(newPlayer);

  return { newPlayer };
};

// Get a player by id
const getPlayer = (id) => {
  const player = players.find((player) => player.id === id);

  if (!player) {
    return {
      error: new Error('Player not found!')
    };
  }

  return { player };
};

// Get all players in the room
const getAllPlayers = (room) => {
  return players.filter((player) => player.room === room);
};

// Remove a player by id
const removePlayer = (id) => {
  return players.find((player, index) => {
    if (player.id === id) {
      return players.splice(index, 1)[0];
    }
    return false;
  });
};

module.exports = {
  addPlayer,
  getAllPlayers,
  getPlayer,
  removePlayer
};
