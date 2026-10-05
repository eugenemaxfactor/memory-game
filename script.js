'use strict';

const CARDS_DATA_URL = './cards.json';
const LEADERBOARD_STORAGE_KEY = 'memory-game-results';
const LEADERBOARD_LIMIT = 10;
const CARD_TYPES = [];

const cardDeck = [];

const gameState = {
  openedCards: [],
  moves: 0,
  matchedPairs: 0,
  isBoardLocked: false,
  isGameFinished: false,
  closeCardsTimerId: null,
};

function addCardPairToDeck(cardType) {
  cardDeck.push(
    { ...cardType, cardId: `${cardType.id}-1` },
    { ...cardType, cardId: `${cardType.id}-2` }
  );
}

function createCardDeck() {
  cardDeck.length = 0;

  CARD_TYPES.forEach(addCardPairToDeck);

  return cardDeck;
}

function shuffleDeck(deck) {
  for (let currentIndex = deck.length - 1; currentIndex > 0; currentIndex -= 1) {
    const randomIndex = Math.floor(Math.random() * (currentIndex + 1));
    const currentCard = deck[currentIndex];

    deck[currentIndex] = deck[randomIndex];
    deck[randomIndex] = currentCard;
  }

  return deck;
}

function createElement(tagName, className, textContent) {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (textContent) {
    element.textContent = textContent;
  }

  return element;
}

function createImage(className, src, alt) {
  const image = document.createElement('img');

  image.className = className;
  image.src = src;
  image.alt = alt;

  return image;
}

function getCardImage(card) {
  return card.querySelector('.card__image');
}

function showCardImage(card, src, alt) {
  const image = getCardImage(card);

  image.src = src;
  image.alt = alt;
}

function createCard(cardData) {
  const card = createElement('button', 'card');
  const cardImage = createImage('card__image', cardData.backImage, '');

  card.type = 'button';
  card.dataset.cardId = cardData.cardId;
  card.dataset.cardType = cardData.id;
  card.dataset.cardLabel = cardData.label;
  card.dataset.cardImage = cardData.image;
  card.dataset.cardBackImage = cardData.backImage;
  card.addEventListener('click', handleCardClick);
  card.append(cardImage);

  return card;
}

function openCard(card) {
  showCardImage(card, card.dataset.cardImage, card.dataset.cardLabel);
  card.classList.add('card--opened');
}

function closeCard(card) {
  showCardImage(card, card.dataset.cardBackImage, '');
  card.classList.remove('card--opened');
}

function isCardOpened(card) {
  return card.classList.contains('card--opened');
}

function rememberOpenedCard(card) {
  gameState.openedCards.push(card);
}

function isBoardLocked() {
  return gameState.isBoardLocked;
}

function isGameFinished() {
  return gameState.isGameFinished;
}

function lockBoardIfTwoCardsOpened() {
  if (gameState.openedCards.length === 2) {
    gameState.isBoardLocked = true;
  }
}

function areOpenedCardsMatched() {
  const firstCard = gameState.openedCards[0];
  const secondCard = gameState.openedCards[1];

  return firstCard.dataset.cardType === secondCard.dataset.cardType;
}

function markCardAsMatched(card) {
  card.classList.add('card--matched');
}

function markOpenedCardsAsMatched() {
  gameState.openedCards.forEach(markCardAsMatched);
}

function resetOpenedCards() {
  gameState.openedCards = [];
}

function unlockBoard() {
  gameState.isBoardLocked = false;
}

function closeOpenedCards() {
  gameState.openedCards.forEach(closeCard);
  resetOpenedCards();
  unlockBoard();
  gameState.closeCardsTimerId = null;
}

function closeUnmatchedCards() {
  gameState.closeCardsTimerId = setTimeout(closeOpenedCards, 1000);
}

function updateMovesCounter() {
  const movesCounter = document.querySelector('.score-panel__moves');

  movesCounter.textContent = `Moves: ${gameState.moves}`;
}

function updatePairsCounter() {
  const pairsCounter = document.querySelector('.score-panel__pairs');

  pairsCounter.textContent = `Pairs: ${gameState.matchedPairs} / ${CARD_TYPES.length}`;
}

function updateVictoryMessage() {
  const victoryMessage = document.querySelector('.modal__moves');

  victoryMessage.textContent = `Moves: ${gameState.moves}`;
}

function readLeaderboardResults() {
  const savedResults = localStorage.getItem(LEADERBOARD_STORAGE_KEY);

  if (savedResults === null) {
    return [];
  }

  return JSON.parse(savedResults);
}

function writeLeaderboardResults(results) {
  localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(results));
}

function createCurrentResult() {
  return {
    moves: gameState.moves,
    date: new Date().toISOString(),
  };
}

function compareResultsByMoves(firstResult, secondResult) {
  return firstResult.moves - secondResult.moves;
}

function saveCurrentResult() {
  const results = readLeaderboardResults();
  const currentResult = createCurrentResult();

  results.push(currentResult);
  results.sort(compareResultsByMoves);
  writeLeaderboardResults(results.slice(0, LEADERBOARD_LIMIT));
}

function clearLeaderboardList() {
  const leaderboardList = document.querySelector('.leaderboard-list');

  leaderboardList.replaceChildren();
}

function formatResultDate(result) {
  const date = new Date(result.date);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}.${month}.${year}`;
}

function formatResultText(result, index) {
  return `${index + 1}. ${result.moves} moves - ${formatResultDate(result)}`;
}

function renderLeaderboardResult(result, index) {
  const leaderboardList = document.querySelector('.leaderboard-list');
  const resultItem = createElement('li', 'leaderboard-list__item', formatResultText(result, index));

  leaderboardList.append(resultItem);
}

function renderLeaderboardResults() {
  const results = readLeaderboardResults();
  const emptyMessage = document.querySelector('.leaderboard-empty');

  clearLeaderboardList();
  emptyMessage.hidden = results.length > 0;
  results.forEach(renderLeaderboardResult);
}

function resetGameState() {
  gameState.openedCards = [];
  gameState.moves = 0;
  gameState.matchedPairs = 0;
  gameState.isBoardLocked = false;
  gameState.isGameFinished = false;
  gameState.closeCardsTimerId = null;
}

function clearCloseCardsTimer() {
  if (gameState.closeCardsTimerId !== null) {
    clearTimeout(gameState.closeCardsTimerId);
    gameState.closeCardsTimerId = null;
  }
}

function clearBoard() {
  const board = document.querySelector('.game__board');

  board.replaceChildren();
}

function startNewGame() {
  closeVictoryModal();
  clearCloseCardsTimer();
  resetGameState();
  updateMovesCounter();
  updatePairsCounter();
  clearBoard();
  renderCards();
}

function openVictoryModal() {
  const victoryModal = document.querySelector('.modal');

  updateVictoryMessage();
  victoryModal.hidden = false;
  document.body.classList.add('page--modal-open');
}

function closeVictoryModal() {
  const victoryModal = document.querySelector('.modal');

  victoryModal.hidden = true;
  document.body.classList.remove('page--modal-open');
}

function isVictoryModalOpen() {
  const victoryModal = document.querySelector('.modal');

  return !victoryModal.hidden;
}

function openLeaderboardModal() {
  const leaderboardModal = document.querySelector('.leaderboard-modal');

  renderLeaderboardResults();
  leaderboardModal.hidden = false;
  document.body.classList.add('page--modal-open');
}

function closeLeaderboardModal() {
  const leaderboardModal = document.querySelector('.leaderboard-modal');

  leaderboardModal.hidden = true;
  document.body.classList.remove('page--modal-open');
}

function isLeaderboardModalOpen() {
  const leaderboardModal = document.querySelector('.leaderboard-modal');

  return !leaderboardModal.hidden;
}

function handleModalBackdropClick(event) {
  if (event.target === event.currentTarget) {
    closeVictoryModal();
  }
}

function handleLeaderboardBackdropClick(event) {
  if (event.target === event.currentTarget) {
    closeLeaderboardModal();
  }
}

function handleDocumentKeydown(event) {
  if (event.key !== 'Escape') {
    return;
  }

  if (isVictoryModalOpen()) {
    closeVictoryModal();
  }

  if (isLeaderboardModalOpen()) {
    closeLeaderboardModal();
  }
}

function increaseMovesIfTwoCardsOpened() {
  if (gameState.openedCards.length === 2) {
    gameState.moves += 1;
    updateMovesCounter();
  }
}

function increaseMatchedPairs() {
  gameState.matchedPairs += 1;
  updatePairsCounter();
}

function finishGame() {
  gameState.isGameFinished = true;
  gameState.isBoardLocked = true;
  saveCurrentResult();
  openVictoryModal();
}

function finishGameIfAllPairsMatched() {
  if (gameState.matchedPairs === CARD_TYPES.length) {
    finishGame();
  }
}

function processOpenedCards() {
  if (gameState.openedCards.length !== 2) {
    return;
  }

  if (areOpenedCardsMatched()) {
    markOpenedCardsAsMatched();
    increaseMatchedPairs();
    finishGameIfAllPairsMatched();
    resetOpenedCards();
    if (!isGameFinished()) {
      unlockBoard();
    }
    return;
  }

  closeUnmatchedCards();
}

function handleCardClick(event) {
  const card = event.currentTarget;

  if (isBoardLocked()) {
    return;
  }

  if (isGameFinished()) {
    return;
  }

  if (isCardOpened(card)) {
    return;
  }

  openCard(card);
  rememberOpenedCard(card);
  increaseMovesIfTwoCardsOpened();
  lockBoardIfTwoCardsOpened();
  processOpenedCards();
}

function addCardToBoard(cardData) {
  const board = document.querySelector('.game__board');
  const card = createCard(cardData);

  board.append(card);
}

function renderCards() {
  const deck = createCardDeck();
  const shuffledDeck = shuffleDeck(deck);

  shuffledDeck.forEach(addCardToBoard);
}

function saveLoadedCardType(cardType) {
  CARD_TYPES.push(cardType);
}

function saveLoadedCardTypes(cardTypes) {
  CARD_TYPES.length = 0;
  cardTypes.forEach(saveLoadedCardType);
}

function loadCardTypes() {
  return fetch(CARDS_DATA_URL)
    .then(parseCardTypesResponse)
    .then(saveLoadedCardTypes);
}

function parseCardTypesResponse(response) {
  return response.json();
}

function createHeader() {
  const header = createElement('header', 'app__header');
  const title = createElement('h1', 'app__title', 'Memory Game');
  const scorePanel = createScorePanel();
  const actions = createElement('div', 'app__actions');
  const newGameButton = createElement('button', 'button', 'New Game');
  const leaderboardButton = createElement('button', 'button', 'Leaderboard');

  newGameButton.classList.add('new-game-button');
  newGameButton.addEventListener('click', startNewGame);
  leaderboardButton.classList.add('leaderboard-button');
  leaderboardButton.addEventListener('click', openLeaderboardModal);
  actions.append(newGameButton, leaderboardButton);
  header.append(title, scorePanel, actions);

  return header;
}

function createScorePanel() {
  const scorePanel = createElement('section', 'score-panel');
  const movesCounter = createElement('p', 'score-panel__item score-panel__moves', 'Moves: 0');
  const pairsCounter = createElement('p', 'score-panel__item score-panel__pairs', `Pairs: 0 / ${CARD_TYPES.length}`);

  scorePanel.append(movesCounter, pairsCounter);

  return scorePanel;
}

function createGameArea() {
  const game = createElement('main', 'game');
  const board = createElement('div', 'game__board');

  game.append(board);

  return game;
}

function createModal(className, titleText, handleBackdropClick) {
  const modal = createElement('div', className);
  const content = createElement('div', 'modal__content');
  const title = createElement('h2', 'modal__title', titleText);
  const actions = createElement('div', 'modal__actions');

  modal.hidden = true;
  modal.addEventListener('click', handleBackdropClick);
  content.append(title);
  modal.append(content);

  return {
    modal,
    content,
    actions,
  };
}

function createVictoryModal() {
  const modalElements = createModal('modal', 'You won!', handleModalBackdropClick);
  const message = createElement('p', 'modal__message', 'Moves: 0');
  const newGameButton = createElement('button', 'button', 'New Game');
  const closeButton = createElement('button', 'button', 'Close');

  message.classList.add('modal__moves');
  newGameButton.classList.add('new-game-button');
  newGameButton.addEventListener('click', startNewGame);
  closeButton.classList.add('modal__close');
  closeButton.addEventListener('click', closeVictoryModal);
  modalElements.actions.append(newGameButton, closeButton);
  modalElements.content.append(message, modalElements.actions);

  return modalElements.modal;
}

function createLeaderboardModal() {
  const modalElements = createModal('modal leaderboard-modal', 'Leaderboard', handleLeaderboardBackdropClick);
  const message = createElement('p', 'modal__message leaderboard-empty', 'No results yet');
  const leaderboardList = createElement('ol', 'leaderboard-list');
  const closeButton = createElement('button', 'button', 'Close');

  closeButton.classList.add('modal__close');
  closeButton.addEventListener('click', closeLeaderboardModal);
  modalElements.actions.append(closeButton);
  modalElements.content.append(message, leaderboardList, modalElements.actions);

  return modalElements.modal;
}

function renderApp() {
  const app = createElement('div', 'app');
  const header = createHeader();
  const game = createGameArea();
  const victoryModal = createVictoryModal();
  const leaderboardModal = createLeaderboardModal();

  app.append(header, game, victoryModal, leaderboardModal);
  document.body.append(app);
  document.addEventListener('keydown', handleDocumentKeydown);
  renderCards();
}

function renderAppAfterCardTypesLoaded() {
  renderApp();
}

function startApp() {
  loadCardTypes().then(renderAppAfterCardTypesLoaded);
}

startApp();
