const boardElement = document.querySelector("#board");
const scoreElement = document.querySelector("#score");
const bestScoreElement = document.querySelector("#best-score");
const statusElement = document.querySelector("#status");
const boardSizeElement = document.querySelector("#board-size");
const startButton = document.querySelector("#start-button");
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

const BEST_SCORE_KEY = "game-2048-best-score";

let state = createInitialState(Number(boardSizeElement.value));

function createInitialState(size) {
  const board = createEmptyBoard(size);
  let nextBoard = addRandomTile(board);
  nextBoard = addRandomTile(nextBoard);

  return {
    size,
    board: nextBoard,
    score: 0,
    hasStarted: false,
    isGameOver: false,
    hasWon: false,
  };
}

function createEmptyBoard(size) {
  return Array.from({ length: size }, () => Array(size).fill(0));
}

function addRandomTile(board) {
  const emptyCells = [];

  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board.length; col += 1) {
      if (board[row][col] === 0) {
        emptyCells.push({ row, col });
      }
    }
  }

  if (emptyCells.length === 0) {
    return board.map((line) => [...line]);
  }

  const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const value = Math.random() < 0.9 ? 2 : 4;
  const nextBoard = board.map((line) => [...line]);
  nextBoard[row][col] = value;
  return nextBoard;
}

function slideLine(line) {
  const compacted = line.filter((value) => value !== 0);
  const merged = [];
  let scoreGained = 0;

  for (let index = 0; index < compacted.length; index += 1) {
    const current = compacted[index];
    const next = compacted[index + 1];

    if (current !== 0 && current === next) {
      const mergedValue = current * 2;
      merged.push(mergedValue);
      scoreGained += mergedValue;
      index += 1;
    } else {
      merged.push(current);
    }
  }

  while (merged.length < line.length) {
    merged.push(0);
  }

  return { line: merged, scoreGained };
}

function transpose(board) {
  return board[0].map((_, colIndex) => board.map((row) => row[colIndex]));
}

function boardsEqual(first, second) {
  return first.every((row, rowIndex) =>
    row.every((cell, colIndex) => cell === second[rowIndex][colIndex]),
  );
}

function applyMove(board, direction) {
  let workingBoard = board.map((row) => [...row]);
  let rotated = false;
  let reversed = false;

  if (direction === "up" || direction === "down") {
    workingBoard = transpose(workingBoard);
    rotated = true;
  }

  if (direction === "right" || direction === "down") {
    workingBoard = workingBoard.map((row) => [...row].reverse());
    reversed = true;
  }

  let scoreGained = 0;
  let nextBoard = workingBoard.map((row) => {
    const result = slideLine(row);
    scoreGained += result.scoreGained;
    return result.line;
  });

  if (reversed) {
    nextBoard = nextBoard.map((row) => [...row].reverse());
  }

  if (rotated) {
    nextBoard = transpose(nextBoard);
  }

  return { board: nextBoard, scoreGained };
}

function canMove(board) {
  for (const direction of ["up", "down", "left", "right"]) {
    if (!boardsEqual(board, applyMove(board, direction).board)) {
      return true;
    }
  }

  return false;
}

function getBestScore() {
  const bestScore = window.localStorage.getItem(BEST_SCORE_KEY);
  return bestScore ? Number(bestScore) : 0;
}

function updateBestScore(nextScore) {
  const bestScore = Math.max(getBestScore(), nextScore);
  window.localStorage.setItem(BEST_SCORE_KEY, String(bestScore));
  bestScoreElement.textContent = String(bestScore);
}

function updateStatus() {
  if (!state.hasStarted) {
    statusElement.textContent = "Choose a board size and press Start Game.";
    return;
  }

  if (state.isGameOver) {
    statusElement.textContent = "No more valid moves. Press Restart to try again.";
    return;
  }

  if (state.hasWon) {
    statusElement.textContent = "2048 reached. Keep going for a bigger tile if you want.";
    return;
  }

  statusElement.textContent = "Use arrow keys or WASD to combine matching tiles.";
}

function tileClass(value) {
  if (value === 0) {
    return "cell empty";
  }

  if (value > 2048) {
    return "cell tile-super";
  }

  return `cell tile-${value}`;
}

function renderBoard() {
  boardElement.style.gridTemplateColumns = `repeat(${state.size}, minmax(0, 1fr))`;
  boardElement.innerHTML = "";

  for (const row of state.board) {
    for (const value of row) {
      const cell = document.createElement("div");
      cell.className = tileClass(value);
      cell.textContent = value === 0 ? "" : String(value);
      boardElement.append(cell);
    }
  }
}

function render() {
  scoreElement.textContent = String(state.score);
  bestScoreElement.textContent = String(getBestScore());
  updateStatus();
  renderBoard();
}

function resetGame() {
  state = createInitialState(Number(boardSizeElement.value));
  render();
}

function startGame() {
  state = createInitialState(Number(boardSizeElement.value));
  state.hasStarted = true;
  render();
}

function move(direction) {
  if (!state.hasStarted || state.isGameOver) {
    return;
  }

  const result = applyMove(state.board, direction);
  if (boardsEqual(state.board, result.board)) {
    return;
  }

  const boardWithNewTile = addRandomTile(result.board);
  const nextScore = state.score + result.scoreGained;
  const hasWon = state.hasWon || boardWithNewTile.some((row) => row.some((value) => value >= 2048));
  const isGameOver = !canMove(boardWithNewTile);

  state = {
    ...state,
    board: boardWithNewTile,
    score: nextScore,
    hasWon,
    isGameOver,
  };

  updateBestScore(nextScore);
  render();
}

document.addEventListener("keydown", (event) => {
  const direction = KEY_TO_DIRECTION[event.key];
  if (!direction) {
    return;
  }

  event.preventDefault();
  move(direction);
});

startButton.addEventListener("click", () => {
  startGame();
});

restartButton.addEventListener("click", () => {
  resetGame();
  state.hasStarted = true;
  render();
});

boardSizeElement.addEventListener("change", () => {
  resetGame();
});

for (const button of controlButtons) {
  button.addEventListener("click", () => {
    const direction = button.getAttribute("data-direction");
    if (direction) {
      move(direction);
    }
  });
}

render();
