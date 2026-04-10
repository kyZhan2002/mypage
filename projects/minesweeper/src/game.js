const boardElement = document.querySelector("#board");
const minesLeftElement = document.querySelector("#mines-left");
const timerElement = document.querySelector("#timer");
const bestTimeElement = document.querySelector("#best-time");
const statusElement = document.querySelector("#status");
const difficultySelect = document.querySelector("#difficulty-select");
const newGameButton = document.querySelector("#new-game-button");

const DIFFICULTIES = {
  beginner: { label: "Beginner", rows: 9, cols: 9, mines: 10 },
  intermediate: { label: "Intermediate", rows: 16, cols: 16, mines: 40 },
  expert: { label: "Expert", rows: 16, cols: 30, mines: 99 },
};

let timerId = null;
let state = createInitialState(difficultySelect.value);

function createInitialState(difficultyKey) {
  const difficulty = DIFFICULTIES[difficultyKey];
  return {
    difficultyKey,
    difficulty,
    board: createBoard(difficulty.rows, difficulty.cols),
    flagsLeft: difficulty.mines,
    seconds: 0,
    hasStarted: false,
    isGameOver: false,
    isWin: false,
  };
}

function createBoard(rows, cols) {
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => ({
      row,
      col,
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      adjacentMines: 0,
    })),
  );
}

function bestTimeKey(difficultyKey) {
  return `minesweeper-best-${difficultyKey}`;
}

function getBestTime(difficultyKey) {
  const value = window.localStorage.getItem(bestTimeKey(difficultyKey));
  return value ? Number(value) : null;
}

function setBestTime(difficultyKey, seconds) {
  const current = getBestTime(difficultyKey);
  if (current === null || seconds < current) {
    window.localStorage.setItem(bestTimeKey(difficultyKey), String(seconds));
  }
}

function updateBestTime() {
  const best = getBestTime(state.difficultyKey);
  bestTimeElement.textContent = best === null ? "-" : String(best);
}

function startTimer() {
  stopTimer();
  timerId = window.setInterval(() => {
    state.seconds += 1;
    timerElement.textContent = String(state.seconds);
  }, 1000);
}

function stopTimer() {
  if (timerId !== null) {
    window.clearInterval(timerId);
    timerId = null;
  }
}

function neighbors(row, col) {
  const cells = [];

  for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
    for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
      if (rowOffset === 0 && colOffset === 0) {
        continue;
      }

      const nextRow = row + rowOffset;
      const nextCol = col + colOffset;

      if (
        nextRow >= 0 &&
        nextRow < state.difficulty.rows &&
        nextCol >= 0 &&
        nextCol < state.difficulty.cols
      ) {
        cells.push({ row: nextRow, col: nextCol });
      }
    }
  }

  return cells;
}

function placeMines(firstRow, firstCol) {
  const protectedCells = new Set(
    [{ row: firstRow, col: firstCol }, ...neighbors(firstRow, firstCol)].map(
      ({ row, col }) => `${row},${col}`,
    ),
  );
  const candidates = [];

  for (let row = 0; row < state.difficulty.rows; row += 1) {
    for (let col = 0; col < state.difficulty.cols; col += 1) {
      const key = `${row},${col}`;
      if (!protectedCells.has(key)) {
        candidates.push({ row, col });
      }
    }
  }

  for (let index = candidates.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [candidates[index], candidates[swapIndex]] = [candidates[swapIndex], candidates[index]];
  }

  for (let index = 0; index < state.difficulty.mines; index += 1) {
    const { row, col } = candidates[index];
    state.board[row][col].isMine = true;
  }

  for (let row = 0; row < state.difficulty.rows; row += 1) {
    for (let col = 0; col < state.difficulty.cols; col += 1) {
      state.board[row][col].adjacentMines = neighbors(row, col).filter(
        ({ row: nextRow, col: nextCol }) => state.board[nextRow][nextCol].isMine,
      ).length;
    }
  }
}

function revealCell(row, col) {
  const cell = state.board[row][col];

  if (cell.isRevealed || cell.isFlagged || state.isGameOver) {
    return;
  }

  if (!state.hasStarted) {
    placeMines(row, col);
    state.hasStarted = true;
    startTimer();
  }

  cell.isRevealed = true;

  if (cell.isMine) {
    cell.isExploded = true;
    state.isGameOver = true;
    revealAllMines();
    stopTimer();
    statusElement.textContent = `${state.difficulty.label} game over. Press New Game to try again.`;
    render();
    return;
  }

  if (cell.adjacentMines === 0) {
    floodReveal(row, col);
  }

  if (checkWin()) {
    state.isGameOver = true;
    state.isWin = true;
    stopTimer();
    setBestTime(state.difficultyKey, state.seconds);
    statusElement.textContent = `${state.difficulty.label} cleared in ${state.seconds}s.`;
  }

  render();
}

function floodReveal(startRow, startCol) {
  const queue = [{ row: startRow, col: startCol }];
  const seen = new Set([`${startRow},${startCol}`]);

  while (queue.length > 0) {
    const current = queue.shift();

    for (const neighbor of neighbors(current.row, current.col)) {
      const key = `${neighbor.row},${neighbor.col}`;
      const cell = state.board[neighbor.row][neighbor.col];

      if (seen.has(key) || cell.isRevealed || cell.isFlagged || cell.isMine) {
        continue;
      }

      cell.isRevealed = true;
      seen.add(key);

      if (cell.adjacentMines === 0) {
        queue.push(neighbor);
      }
    }
  }
}

function revealAllMines() {
  for (const row of state.board) {
    for (const cell of row) {
      if (cell.isMine) {
        cell.isRevealed = true;
      }
    }
  }
}

function toggleFlag(row, col) {
  const cell = state.board[row][col];

  if (cell.isRevealed || state.isGameOver) {
    return;
  }

  if (cell.isFlagged) {
    cell.isFlagged = false;
    state.flagsLeft += 1;
  } else if (state.flagsLeft > 0) {
    cell.isFlagged = true;
    state.flagsLeft -= 1;
  }

  render();
}

function checkWin() {
  for (const row of state.board) {
    for (const cell of row) {
      if (!cell.isMine && !cell.isRevealed) {
        return false;
      }
    }
  }

  return true;
}

function resetGame() {
  stopTimer();
  state = createInitialState(difficultySelect.value);
  render();
}

function cellText(cell) {
  if (!cell.isRevealed) {
    return cell.isFlagged ? "F" : "";
  }

  if (cell.isMine) {
    return "•";
  }

  return cell.adjacentMines === 0 ? "" : String(cell.adjacentMines);
}

function render() {
  boardElement.innerHTML = "";
  boardElement.style.gridTemplateColumns = `repeat(${state.difficulty.cols}, 22px)`;

  for (const row of state.board) {
    for (const cell of row) {
      const cellButton = document.createElement("button");
      cellButton.type = "button";
      cellButton.className = "cell";
      cellButton.setAttribute("role", "gridcell");
      cellButton.textContent = cellText(cell);

      if (cell.isRevealed) {
        cellButton.classList.add("revealed");
      }

      if (cell.isFlagged) {
        cellButton.classList.add("flagged");
      }

      if (cell.isMine && cell.isRevealed) {
        cellButton.classList.add("mine");
      }

      if (cell.isExploded) {
        cellButton.classList.add("exploded");
      }

      if (cell.isRevealed && cell.adjacentMines > 0 && !cell.isMine) {
        cellButton.classList.add(`number-${cell.adjacentMines}`);
      }

      cellButton.addEventListener("click", () => {
        revealCell(cell.row, cell.col);
      });

      cellButton.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        toggleFlag(cell.row, cell.col);
      });

      boardElement.append(cellButton);
    }
  }

  minesLeftElement.textContent = String(state.flagsLeft);
  timerElement.textContent = String(state.seconds);
  updateBestTime();

  if (!state.isGameOver && !state.hasStarted) {
    statusElement.textContent = `Choose ${state.difficulty.label} and reveal a safe tile to begin.`;
  } else if (!state.isGameOver) {
    statusElement.textContent = `Clear all mines on ${state.difficulty.label}.`;
  }
}

difficultySelect.addEventListener("change", () => {
  resetGame();
});

newGameButton.addEventListener("click", () => {
  resetGame();
});

render();
