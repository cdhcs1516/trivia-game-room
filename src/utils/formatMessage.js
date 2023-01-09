module.exports = (playerName, text) => ({
  playerName,
  text,
  createdAt: new Date().getTime()
});