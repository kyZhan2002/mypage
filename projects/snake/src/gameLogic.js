export const BOARD_SIZE = 16;
export const INITIAL_DIRECTION = "right";
export const TICK_MS = 140;

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
    { x: 2, y: 8 },
    { x: 1, y: 8 },
    { x: 0, y: 8 },
  ];
}

export function getCellKey(position) {
  return `${position.x},${position.y}`;
}

export function createInitialState(random = Math.random) {
  const snake = createInitialSnake();
  return {
    boardSize: BOARD_SIZE,
    snake,
    direction: INITIAL_DIRECTION,
    queuedDirection: INITIAL_DIRECTION,
    food: placeFood(snake, BOARD_SIZE, random),
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

export function restartGame(random = Math.random) {
  return createInitialState(random);
}

export function advanceGame(state, random = Math.random) {
  if (state.isPaused || state.isGameOver) {
    return state;
  }

  const direction = state.queuedDirection || state.direction;
  const head = state.snake[0];
  const delta = DELTAS[direction];
  const nextHead = { x: head.x + delta.x, y: head.y + delta.y };

  if (isOutOfBounds(nextHead, state.boardSize)) {
    return {
      ...state,
      direction,
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
      isGameOver: true,
      isPaused: true,
    };
  }

  return {
    ...state,
    snake: nextSnake,
    direction,
    queuedDirection: direction,
    food: grows ? placeFood(nextSnake, state.boardSize, random) : state.food,
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

export function placeFood(snake, boardSize, random = Math.random) {
  const occupied = new Set(snake.map(getCellKey));
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
