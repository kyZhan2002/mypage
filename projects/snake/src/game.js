import {
  BOARD_SIZE,
  TICK_MS,
  advanceGame,
  createInitialState,
  getCellKey,
  queueDirection,
  restartGame,
  startGame,
  togglePause,
} from "./gameLogic.js";

const boardElement = document.querySelector("#board");
const scoreElement = document.querySelector("#score");
const statusElement = document.querySelector("#status");
const pauseButton = document.querySelector("#pause-button");
const restartButton = document.querySelector("#restart-button");
const controlButtons = document.querySelectorAll("[data-direction]");

const KEY_TO_DIRECTION = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  W: "up",
  a: "left",
  A: "left",
  s: "down",
  S: "down",
  d: "right",
  D: "right",
};

let state = createInitialState();

function renderBoard() {
  const snakeCells = new Set(state.snake.map(getCellKey));
  const headKey = getCellKey(state.snake[0]);
  const foodKey = state.food ? getCellKey(state.food) : "";

  boardElement.innerHTML = "";

  for (let y = 0; y < BOARD_SIZE; y += 1) {
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      const cell = document.createElement("div");
      const key = `${x},${y}`;
      cell.className = "cell";

      if (snakeCells.has(key)) {
        cell.classList.add("snake");
      }

      if (key === headKey) {
        cell.classList.add("head");
      }

      if (key === foodKey) {
        cell.classList.add("food");
      }

      boardElement.append(cell);
    }
  }
}

function renderStatus() {
  if (state.isGameOver) {
    statusElement.textContent = "Game over. Restart to play again.";
    pauseButton.textContent = "Pause";
    return;
  }

  if (!state.hasStarted) {
    statusElement.textContent = "Press Start or use an arrow key to begin.";
    pauseButton.textContent = "Start";
    return;
  }

  if (state.isPaused) {
    statusElement.textContent = "Paused.";
    pauseButton.textContent = "Resume";
    return;
  }

  statusElement.textContent = "Collect food and avoid the walls or yourself.";
  pauseButton.textContent = "Pause";
}

function render() {
  scoreElement.textContent = String(state.score);
  renderStatus();
  renderBoard();
}

function applyDirection(nextDirection) {
  state = queueDirection(state, nextDirection);
  if (!state.hasStarted && !state.isGameOver) {
    state = startGame(state);
  }
  render();
}

document.addEventListener("keydown", (event) => {
  const nextDirection = KEY_TO_DIRECTION[event.key];

  if (!nextDirection) {
    if (event.key === " ") {
      event.preventDefault();
      state = togglePause(state);
      render();
    }
    return;
  }

  event.preventDefault();
  applyDirection(nextDirection);
});

pauseButton.addEventListener("click", () => {
  state = state.hasStarted ? togglePause(state) : startGame(state);
  render();
});

restartButton.addEventListener("click", () => {
  state = restartGame();
  render();
});

for (const button of controlButtons) {
  button.addEventListener("click", () => {
    const nextDirection = button.getAttribute("data-direction");
    if (nextDirection) {
      applyDirection(nextDirection);
    }
  });
}

setInterval(() => {
  state = advanceGame(state);
  render();
}, TICK_MS);

render();
