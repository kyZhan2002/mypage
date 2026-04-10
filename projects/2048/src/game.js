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
let nextTileId = 1;

let state = createInitialState(Number(boardSizeElement.value));

function createInitialState(size) {
  const board = createEmptyBoard(size);
  let nextBoard = addRandomTile(board).board;
  nextBoard = addRandomTile(nextBoard).board;

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

function createTile(value) {
  const id = nextTileId;
  nextTileId += 1;
  return { id, value };
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
    return {
      board: board.map((line) => [...line]),
      spawnedTile: null,
    };
  }

  const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const value = Math.random() < 0.9 ? 2 : 4;
  const nextBoard = board.map((line) => [...line]);
  const tile = createTile(value);
  nextBoard[row][col] = tile;
  return {
    board: nextBoard,
    spawnedTile: { ...tile, row, col },
  };
}

function slideLine(line, axis, index, reverse = false) {
  const tiles = [];
  const length = line.length;

  for (let offset = 0; offset < length; offset += 1) {
    const tile = line[offset];
    if (!tile) {
      continue;
    }

    const actualOffset = reverse ? length - 1 - offset : offset;
    tiles.push({
      ...tile,
      sourceRow: axis === "row" ? index : actualOffset,
      sourceCol: axis === "row" ? actualOffset : index,
    });
  }

  const merged = [];
  let scoreGained = 0;
  const animations = [];

  for (let offset = 0; offset < tiles.length; offset += 1) {
    const current = tiles[offset];
    const next = tiles[offset + 1];

    if (next && current.value === next.value) {
      const mergedValue = current.value * 2;
      const mergedTile = {
        id: current.id,
        value: mergedValue,
      };
      const destination = merged.length;
      const targetOffset = reverse ? length - 1 - destination : destination;
      const targetRow = axis === "row" ? index : targetOffset;
      const targetCol = axis === "row" ? targetOffset : index;

      animations.push({
        id: current.id,
        value: mergedValue,
        fromRow: current.sourceRow,
        fromCol: current.sourceCol,
        toRow: targetRow,
        toCol: targetCol,
      });
      animations.push({
        id: next.id,
        value: next.value,
        fromRow: next.sourceRow,
        fromCol: next.sourceCol,
        toRow: targetRow,
        toCol: targetCol,
      });

      merged.push(mergedTile);
      scoreGained += mergedValue;
      offset += 1;
    } else {
      const destination = merged.length;
      const targetOffset = reverse ? length - 1 - destination : destination;
      const targetRow = axis === "row" ? index : targetOffset;
      const targetCol = axis === "row" ? targetOffset : index;

      animations.push({
        id: current.id,
        value: current.value,
        fromRow: current.sourceRow,
        fromCol: current.sourceCol,
        toRow: targetRow,
        toCol: targetCol,
      });

      merged.push({
        id: current.id,
        value: current.value,
      });
    }
  }

  while (merged.length < line.length) {
    merged.push(0);
  }

  return { line: merged, scoreGained, animations };
}

function transpose(board) {
  return board[0].map((_, colIndex) => board.map((row) => row[colIndex]));
}

function boardsEqual(first, second) {
  return first.every((row, rowIndex) =>
    row.every(
      (cell, colIndex) =>
        (cell?.value ?? 0) === (second[rowIndex][colIndex]?.value ?? 0),
    ),
  );
}

function applyMove(board, direction) {
  let scoreGained = 0;
  const animations = [];
  const size = board.length;
  const nextBoard = createEmptyBoard(size);

  if (direction === "left" || direction === "right") {
    for (let rowIndex = 0; rowIndex < size; rowIndex += 1) {
      const sourceLine = direction === "right"
        ? [...board[rowIndex]].reverse()
        : [...board[rowIndex]];
      const result = slideLine(sourceLine, "row", rowIndex, direction === "right");
      scoreGained += result.scoreGained;
      animations.push(...result.animations);
      nextBoard[rowIndex] =
        direction === "right" ? [...result.line].reverse() : result.line;
    }
  } else {
    for (let colIndex = 0; colIndex < size; colIndex += 1) {
      const column = board.map((row) => row[colIndex]);
      const sourceLine = direction === "down" ? [...column].reverse() : column;
      const result = slideLine(sourceLine, "col", colIndex, direction === "down");
      scoreGained += result.scoreGained;
      animations.push(...result.animations);
      const nextColumn =
        direction === "down" ? [...result.line].reverse() : result.line;

      for (let rowIndex = 0; rowIndex < size; rowIndex += 1) {
        nextBoard[rowIndex][colIndex] = nextColumn[rowIndex];
      }
    }
  }

  return { board: nextBoard, scoreGained, animations };
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
  if (value > 2048) {
    return "tile tile-super";
  }

  return `tile tile-${value}`;
}

function animateTiles(tileLayer, animationFrame) {
  if (!animationFrame) {
    return;
  }

  requestAnimationFrame(() => {
    for (const tile of tileLayer.children) {
      tile.classList.add("active");
    }
  });
}

function renderBoard(animationFrame = null) {
  const size = state.size;
  boardElement.style.gridTemplateColumns = `repeat(${state.size}, minmax(0, 1fr))`;
  boardElement.innerHTML = "";

  const background = document.createElement("div");
  background.className = "board-background";
  background.style.gridTemplateColumns = `repeat(${size}, minmax(0, 1fr))`;

  for (let index = 0; index < size * size; index += 1) {
    const cell = document.createElement("div");
    cell.className = "cell empty";
    background.append(cell);
  }

  const tileLayer = document.createElement("div");
  tileLayer.className = "tile-layer";

  const gap = 8;
  const tileSize = `calc((100% - ${(size - 1) * gap}px) / ${size})`;

  for (const row of state.board) {
    for (const tile of row) {
      if (!tile) {
        continue;
      }

      const { row: targetRow, col: targetCol, fromRow, fromCol, isSpawn } =
        animationFrame?.tiles.get(tile.id) ?? {};
      const finalRow = targetRow ?? findTilePosition(tile.id).row;
      const finalCol = targetCol ?? findTilePosition(tile.id).col;
      const tileElement = document.createElement("div");
      tileElement.className = tileClass(tile.value);
      tileElement.textContent = String(tile.value);
      tileElement.style.width = tileSize;
      tileElement.style.height = tileSize;
      tileElement.style.top = `calc(${finalRow} * (${tileSize} + ${gap}px))`;
      tileElement.style.left = `calc(${finalCol} * (${tileSize} + ${gap}px))`;

      if (isSpawn) {
        tileElement.classList.add("entering");
      } else if (
        fromRow !== undefined &&
        fromCol !== undefined &&
        (fromRow !== finalRow || fromCol !== finalCol)
      ) {
        tileElement.classList.add("moving");
        tileElement.style.setProperty(
          "--from-x",
          `calc((${fromCol - finalCol}) * (${tileSize} + ${gap}px))`,
        );
        tileElement.style.setProperty(
          "--from-y",
          `calc((${fromRow - finalRow}) * (${tileSize} + ${gap}px))`,
        );
      }

      tileLayer.append(tileElement);
    }
  }

  boardElement.append(background, tileLayer);
  animateTiles(tileLayer, animationFrame);
}

function findTilePosition(tileId) {
  for (let rowIndex = 0; rowIndex < state.board.length; rowIndex += 1) {
    for (let colIndex = 0; colIndex < state.board[rowIndex].length; colIndex += 1) {
      const tile = state.board[rowIndex][colIndex];
      if (tile?.id === tileId) {
        return { row: rowIndex, col: colIndex };
      }
    }
  }

  return { row: 0, col: 0 };
}

function render(animationFrame = null) {
  scoreElement.textContent = String(state.score);
  bestScoreElement.textContent = String(getBestScore());
  updateStatus();
  renderBoard(animationFrame);
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

  const { board: boardWithNewTile, spawnedTile } = addRandomTile(result.board);
  const nextScore = state.score + result.scoreGained;
  const hasWon =
    state.hasWon ||
    boardWithNewTile.some((row) => row.some((tile) => (tile?.value ?? 0) >= 2048));
  const isGameOver = !canMove(boardWithNewTile);

  state = {
    ...state,
    board: boardWithNewTile,
    score: nextScore,
    hasWon,
    isGameOver,
  };

  updateBestScore(nextScore);
  const animationTiles = new Map();

  for (const movement of result.animations) {
    const tile = boardWithNewTile
      .flat()
      .find((candidate) => candidate && candidate.id === movement.id);

    if (tile) {
      animationTiles.set(tile.id, {
        row: movement.toRow,
        col: movement.toCol,
        fromRow: movement.fromRow,
        fromCol: movement.fromCol,
      });
    }
  }

  if (spawnedTile) {
    animationTiles.set(spawnedTile.id, {
      row: spawnedTile.row,
      col: spawnedTile.col,
      isSpawn: true,
    });
  }

  render({ tiles: animationTiles });
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
