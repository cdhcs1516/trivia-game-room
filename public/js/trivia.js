const socket = io();

const urlSearchParams = new URLSearchParams(window.location.search);
const playerName = urlSearchParams.get('playerName');
const room = urlSearchParams.get('room');

// Display welcome header for the player
const mainHeadingTemplate = document.querySelector('#main-heading-template').innerHTML;

const welcomeHeadingHTML = Handlebars.compile(mainHeadingTemplate);

document.querySelector('main').insertAdjacentHTML(
  'afterBegin',
  welcomeHeadingHTML({
    playerName
  })
);

socket.emit('join', { playerName, room }, (error) => {
  if (error) {
    alert(error);
    location.href = '/';
  }
});

// show message in chat section
const showMessageInChats = ({ playerName, text, createdAt }) => {
  const chatMessages = document.querySelector('.chat__messages');
  const messageTemplate = document.querySelector('#message-template').innerHTML;

  const template = Handlebars.compile(messageTemplate);

  const html = template({
    playerName,
    text,
    createdAt: moment(createdAt).format('h:mm a')
  });

  chatMessages.insertAdjacentHTML('afterBegin', html);
}

// Listen to message from the server
socket.on('message', ({ playerName, text, createdAt }) => {
  showMessageInChats({
    playerName,
    text,
    createdAt
  });
});

// Listen to game info update
socket.on('room', ({ room, players, numberOfPlayers }) => {
  const gameInfo = document.querySelector('.game-info');
  const gameInfoTemplate = document.querySelector('#game-info-template').innerHTML;
  const template = Handlebars.compile(gameInfoTemplate);

  const html = template({
    room,
    players,
    numberOfPlayers
  });
  gameInfo.innerHTML = html;
});

// Chat section
const chatForm = document.querySelector('.chat__form');

chatForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const chatFormInput = chatForm.querySelector('.chat__message');
  const chatFormBtn = chatForm.querySelector('.chat__submit-btn');

  chatFormBtn.setAttribute('disabled', 'disabled');

  const message = event.target.elements.message.value;

  socket.emit('sendMessage', message, (error) => {
    chatForm.removeAttribute('disabled');
    chatFormInput.value = '';
    chatFormInput.focus();

    if (error) return alert(error);
  })
});

// Start game
const getQuestionBtn = document.querySelector('.trivia__question-btn');
getQuestionBtn.addEventListener('click', (event) => {
  event.preventDefault();

  socket.emit('getQuestion', null, (error) => {
    if (error) return alert(error);
  });
});

// Show question
socket.on('sendQuestion', ({ playerName, createdAt, question, answers }) => {
  getQuestionBtn.setAttribute('disabled', 'disabled');

  const questionSection = document.querySelector('.trivia__question');
  const questionTemplate = document.querySelector('#trivia-question-template').innerHTML;
  const template = Handlebars.compile(questionTemplate);
  questionSection.innerHTML = template({
    playerName,
    createdAt: moment(createdAt).format('h:mm a'),
    question,
    answers
  });

  const triviaSubmitBtn = document.querySelector('.trivia__submit-btn');
  triviaSubmitBtn.removeAttribute('disabled'); 
});

// Submit answer
const triviaForm = document.querySelector('.trivia__form');
const triviaSubmitBtn = document.querySelector('.trivia__submit-btn');
triviaForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const submittedAnswer = event.target.elements.answer.value;
  if (submittedAnswer === '') return;

  const triviaAnswer = document.querySelector('.trivia__answer');

  triviaSubmitBtn.setAttribute('disabled', 'disabled');

  socket.emit('sendAnswer', submittedAnswer, (error) => {
    triviaAnswer.value = '';
    triviaAnswer.focus();

    if (error) return alert(error.message);
  });
});

const revealAnswerBtn = document.querySelector('.trivia__answer-btn');
socket.on('receiveAnswer', ({ playerName, text, createdAt, isRoundOver}) => {
  showMessageInChats({
    playerName,
    text,
    createdAt
  });

  if (isRoundOver) {
    revealAnswerBtn.removeAttribute('disabled');
  }
});

revealAnswerBtn.addEventListener('click', (event) => {
  event.preventDefault();

  socket.emit('getCorrectAnswer', null, (error) => {
    if (error) return alert(error.message);
  })
});

socket.on('sendCorrectAnswer', ({ correctAnswer }) => {  
  const answersSection = document.querySelector('.trivia__answers');
  const correctAnswerTemplate = document.querySelector('#trivia-answer-template').innerHTML;
  const template = Handlebars.compile(correctAnswerTemplate);
  answersSection.insertAdjacentHTML('beforeEnd', template({
    text: correctAnswer
  }));

  revealAnswerBtn.setAttribute('disabled', 'disabled');
  getQuestionBtn.removeAttribute('disabled');
  triviaSubmitBtn.removeAttribute('disabled');
});