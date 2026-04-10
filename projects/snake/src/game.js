import {
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
const difficultySelect = document.querySelector("#difficulty-select");
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

let state = createInitialState(difficultySelect.value);
let gameLoopId = null;

function renderBoard() {
  const snakeCells = new Set(state.snake.map(getCellKey));
  const headKey = getCellKey(state.snake[0]);
  const foodKey = state.food ? getCellKey(state.food) : "";
  const fixedObstacleCells = new Set(state.fixedObstacles.map(getCellKey));
  const movingObstacleCells = new Set(
    state.movingObstacles.map((obstacle) => getCellKey(obstacle.position)),
  );

  boardElement.innerHTML = "";
  boardElement.style.gridTemplateColumns = `repeat(${state.boardSize}, minmax(0, 1fr))`;

  for (let y = 0; y < state.boardSize; y += 1) {
    for (let x = 0; x < state.boardSize; x += 1) {
      const cell = document.createElement("div");
      const key = `${x},${y}`;
      cell.className = "cell";

      if (fixedObstacleCells.has(key)) {
        cell.classList.add("obstacle");
      }

      if (movingObstacleCells.has(key)) {
        cell.classList.add("moving-obstacle");
      }

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
    statusElement.textContent = `${state.difficultyLabel} mode game over. Restart to play again.`;
    pauseButton.textContent = "Pause";
    return;
  }

  if (!state.hasStarted) {
    statusElement.textContent = `Choose a difficulty and press Start. ${state.difficultyLabel} mode is ready.`;
    pauseButton.textContent = "Start";
    return;
  }

  if (state.isPaused) {
    statusElement.textContent = "Paused.";
    pauseButton.textContent = "Resume";
    return;
  }

  statusElement.textContent = getStatusCopy(state.difficulty);
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

function getStatusCopy(difficultyKey) {
  if (difficultyKey === "easy") {
    return "Collect food and avoid the walls or yourself.";
  }

  if (difficultyKey === "medium") {
    return "Avoid walls, yourself, and the fixed obstacles.";
  }

  return "Avoid walls, yourself, and both fixed and moving obstacles.";
}

function resetLoop() {
  if (gameLoopId !== null) {
    window.clearTimeout(gameLoopId);
  }

  const tick = () => {
    state = advanceGame(state);
    render();
    gameLoopId = window.setTimeout(tick, state.tickMs);
  };

  gameLoopId = window.setTimeout(tick, state.tickMs);
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
  state = restartGame(difficultySelect.value);
  render();
});

difficultySelect.addEventListener("change", () => {
  state = createInitialState(difficultySelect.value);
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

resetLoop();
render();
