export const INITIAL_DIRECTION = "right";
export const DIFFICULTIES = {
  easy: {
    key: "easy",
    label: "Easy",
    boardSize: 8,
    tickMs: 190,
    fixedObstacles: [],
    movingObstacles: [],
  },
  medium: {
    key: "medium",
    label: "Medium",
    boardSize: 12,
    tickMs: 120,
    fixedObstacles: [
      { x: 4, y: 2 },
      { x: 4, y: 3 },
      { x: 4, y: 4 },
      { x: 7, y: 7 },
      { x: 8, y: 7 },
      { x: 9, y: 7 },
      { x: 2, y: 9 },
      { x: 3, y: 9 },
    ],
    movingObstacles: [],
  },
  hard: {
    key: "hard",
    label: "Hard",
    boardSize: 16,
    tickMs: 128,
    fixedObstacles: [
      { x: 5, y: 3 },
      { x: 5, y: 4 },
      { x: 5, y: 5 },
      { x: 10, y: 4 },
      { x: 10, y: 5 },
      { x: 10, y: 6 },
      { x: 3, y: 11 },
      { x: 4, y: 11 },
      { x: 11, y: 12 },
      { x: 12, y: 12 },
    ],
    movingObstacles: [
      { position: { x: 7, y: 2 }, direction: "down", length: 3 },
      { position: { x: 12, y: 10 }, direction: "left", length: 3 },
    ],
  },
};

const DELTAS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITES = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

export function createInitialSnake() {
  return [
    { x: 2, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 0 },
  ];
}

export function getCellKey(position) {
  return `${position.x},${position.y}`;
}

export function createInitialState(difficultyKey = "medium", random = Math.random) {
  const difficulty = DIFFICULTIES[difficultyKey] || DIFFICULTIES.medium;
  const snake = createInitialSnake().map((segment) => ({
    ...segment,
    y: Math.min(segment.y + Math.floor(difficulty.boardSize / 2), difficulty.boardSize - 1),
  }));
  const fixedObstacles = difficulty.fixedObstacles.map(clonePosition);
  const movingObstacles = difficulty.movingObstacles.map((obstacle) => ({
    position: clonePosition(obstacle.position),
    direction: obstacle.direction,
    length: obstacle.length ?? 1,
  }));
  const movingObstacleCells = movingObstacles.flatMap(getMovingObstacleCells);
  const occupied = [
    ...snake,
    ...fixedObstacles,
    ...movingObstacleCells,
  ];

  return {
    difficulty: difficulty.key,
    difficultyLabel: difficulty.label,
    boardSize: difficulty.boardSize,
    tickMs: difficulty.tickMs,
    snake,
    direction: INITIAL_DIRECTION,
    queuedDirection: INITIAL_DIRECTION,
    fixedObstacles,
    movingObstacles,
    movingObstacleCells,
    food: placeFood(occupied, difficulty.boardSize, random),
    score: 0,
    isGameOver: false,
    isPaused: true,
    hasStarted: false,
  };
}

export function queueDirection(state, nextDirection) {
  if (!DELTAS[nextDirection]) {
    return state;
  }

  const activeDirection = state.queuedDirection || state.direction;
  if (state.snake.length > 1 && OPPOSITES[activeDirection] === nextDirection) {
    return state;
  }

  return {
    ...state,
    queuedDirection: nextDirection,
  };
}

export function togglePause(state) {
  if (state.isGameOver || !state.hasStarted) {
    return state;
  }

  return {
    ...state,
    isPaused: !state.isPaused,
  };
}

export function restartGame(difficultyKey = "medium", random = Math.random) {
  return createInitialState(difficultyKey, random);
}

export function advanceGame(state, random = Math.random) {
  if (state.isPaused || state.isGameOver) {
    return state;
  }

  const direction = state.queuedDirection || state.direction;
  const head = state.snake[0];
  const delta = DELTAS[direction];
  const nextHead = { x: head.x + delta.x, y: head.y + delta.y };
  const movedObstacles = moveObstacles(state, nextHead);
  const movingObstacleCells = movedObstacles.flatMap(getMovingObstacleCells);
  const obstacleCells = [...state.fixedObstacles, ...movingObstacleCells];

  if (isOutOfBounds(nextHead, state.boardSize)) {
    return {
      ...state,
      direction,
      movingObstacles: movedObstacles,
      movingObstacleCells,
      isGameOver: true,
      isPaused: true,
    };
  }

  if (obstacleCells.some((obstacle) => positionsEqual(obstacle, nextHead))) {
    return {
      ...state,
      direction,
      movingObstacles: movedObstacles,
      movingObstacleCells,
      isGameOver: true,
      isPaused: true,
    };
  }

  const grows = positionsEqual(nextHead, state.food);
  const nextSnake = [nextHead, ...state.snake];

  if (!grows) {
    nextSnake.pop();
  }

  if (hasSelfCollision(nextSnake)) {
    return {
      ...state,
      direction,
      movingObstacles: movedObstacles,
      movingObstacleCells,
      isGameOver: true,
      isPaused: true,
    };
  }

  if (nextSnake.some((segment) => obstacleCells.some((cell) => positionsEqual(cell, segment)))) {
    return {
      ...state,
      direction,
      movingObstacles: movedObstacles,
      movingObstacleCells,
      isGameOver: true,
      isPaused: true,
    };
  }

  const occupied = [
    ...nextSnake,
    ...state.fixedObstacles,
    ...movingObstacleCells,
  ];

  return {
    ...state,
    snake: nextSnake,
    direction,
    queuedDirection: direction,
    movingObstacles: movedObstacles,
    movingObstacleCells,
    food: grows ? placeFood(occupied, state.boardSize, random) : state.food,
    score: grows ? state.score + 1 : state.score,
    hasStarted: true,
  };
}

export function startGame(state) {
  return {
    ...state,
    isPaused: false,
    hasStarted: true,
  };
}

export function placeFood(occupiedCells, boardSize, random = Math.random) {
  const occupied = new Set(occupiedCells.map(getCellKey));
  const freeCells = [];

  for (let y = 0; y < boardSize; y += 1) {
    for (let x = 0; x < boardSize; x += 1) {
      const position = { x, y };
      if (!occupied.has(getCellKey(position))) {
        freeCells.push(position);
      }
    }
  }

  if (freeCells.length === 0) {
    return null;
  }

  const index = Math.floor(random() * freeCells.length);
  return freeCells[index];
}

export function positionsEqual(a, b) {
  return Boolean(a && b) && a.x === b.x && a.y === b.y;
}

export function isOutOfBounds(position, boardSize) {
  return (
    position.x < 0 ||
    position.y < 0 ||
    position.x >= boardSize ||
    position.y >= boardSize
  );
}

export function hasSelfCollision(snake) {
  const seen = new Set();

  for (const segment of snake) {
    const key = getCellKey(segment);
    if (seen.has(key)) {
      return true;
    }
    seen.add(key);
  }

  return false;
}

export function clonePosition(position) {
  return { x: position.x, y: position.y };
}

export function moveObstacles(state, nextHead) {
  if (!state.movingObstacles.length) {
    return state.movingObstacles;
  }

  const occupied = new Set([
    ...state.fixedObstacles.map(getCellKey),
    ...(state.food ? [getCellKey(state.food)] : []),
  ]);
  const nextHeadKey = getCellKey(nextHead);

  return state.movingObstacles.map((obstacle, index) => {
    const attempted = getNextObstaclePosition(obstacle);
    const attemptedCells = getMovingObstacleCells(attempted);
    const otherObstacles = state.movingObstacles
      .filter((_, otherIndex) => otherIndex !== index)
      .flatMap(getMovingObstacleCells);
    const blocked = (
      attemptedCells.some((cell) => isOutOfBounds(cell, state.boardSize)) ||
      attemptedCells.some((cell) => occupied.has(getCellKey(cell)) && getCellKey(cell) !== nextHeadKey) ||
      attemptedCells.some((cell) => otherObstacles.some((item) => positionsEqual(item, cell)))
    );

    if (!blocked) {
      return attempted;
    }

    const reversed = {
      ...obstacle,
      direction: OPPOSITES[obstacle.direction],
    };
    const retry = getNextObstaclePosition(reversed);
    const retryCells = getMovingObstacleCells(retry);
    const retryBlocked = (
      retryCells.some((cell) => isOutOfBounds(cell, state.boardSize)) ||
      retryCells.some((cell) => occupied.has(getCellKey(cell)) && getCellKey(cell) !== nextHeadKey) ||
      retryCells.some((cell) => otherObstacles.some((item) => positionsEqual(item, cell)))
    );

    return retryBlocked ? reversed : retry;
  });
}

function getNextObstaclePosition(obstacle) {
  const delta = DELTAS[obstacle.direction];
  return {
    position: {
      x: obstacle.position.x + delta.x,
      y: obstacle.position.y + delta.y,
    },
    direction: obstacle.direction,
    length: obstacle.length,
  };
}

export function getMovingObstacleCells(obstacle) {
  const oppositeDelta = DELTAS[OPPOSITES[obstacle.direction]];
  const cells = [];

  for (let index = 0; index < (obstacle.length ?? 1); index += 1) {
    cells.push({
      x: obstacle.position.x + oppositeDelta.x * index,
      y: obstacle.position.y + oppositeDelta.y * index,
    });
  }

  return cells;
}
