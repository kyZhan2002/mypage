const canvas = document.querySelector("#game-canvas");
const context = canvas.getContext("2d");
const scoreElement = document.querySelector("#score");
const livesElement = document.querySelector("#lives");
const levelElement = document.querySelector("#level");
const powerElement = document.querySelector("#power");
const statusElement = document.querySelector("#status");
const startButton = document.querySelector("#start-button");
const restartButton = document.querySelector("#restart-button");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const PADDLE_WIDTH = 78;
const PADDLE_HEIGHT = 10;
const PADDLE_SPEED = 340;
const BALL_RADIUS = 6;
const BASE_BALL_SPEED = 230;
const POWER_UP_SPEED = 96;
const BRICK_HEIGHT = 14;
const BRICK_PADDING = 4;
const BRICK_OFFSET_TOP = 40;
const BRICK_OFFSET_LEFT = 14;
const MULTI_BALL_DROP_RATE = 0.12;
const DOUBLE_HIT_DROP_RATE = 0.045;
const DOUBLE_HIT_DURATION = 20;

const BRICK_COLORS = {
  1: "#eee4cf",
  2: "#e3cca4",
  3: "#d6b176",
  4: "#c99258",
  5: "#bb7746",
  6: "#ae603e",
  7: "#9f5137",
  8: "#8f4532",
  9: "#7a392d",
  10: "#652d28",
};

const LEVELS = [
  {
    name: "Warm-Up Wall",
    layout: [
      [0, 0, 1, 1, 2, 2, 1, 1, 0, 0],
      [0, 1, 2, 2, 3, 3, 2, 2, 1, 0],
      [1, 2, 2, 3, 4, 4, 3, 2, 2, 1],
      [1, 1, 2, 2, 3, 3, 2, 2, 1, 1],
      [0, 0, 1, 1, 2, 2, 1, 1, 0, 0],
    ],
  },
  {
    name: "Sky Lanes",
    layout: [
      [2, 0, 2, 4, 0, 0, 4, 2, 0, 2],
      [3, 0, 3, 5, 0, 0, 5, 3, 0, 3],
      [4, 0, 4, 6, 0, 0, 6, 4, 0, 4],
      [5, 1, 5, 7, 2, 2, 7, 5, 1, 5],
      [6, 2, 6, 8, 3, 3, 8, 6, 2, 6],
      [7, 3, 7, 9, 4, 4, 9, 7, 3, 7],
    ],
  },
  {
    name: "Side Channel",
    layout: [
      [0, 4, 4, 5, 6, 6, 5, 4, 4, 0],
      [0, 5, 0, 0, 7, 7, 0, 0, 5, 0],
      [0, 6, 0, 0, 8, 8, 0, 0, 6, 0],
      [0, 7, 0, 0, 9, 9, 0, 0, 7, 0],
      [0, 8, 8, 0, 10, 10, 0, 8, 8, 0],
      [0, 0, 0, 0, 4, 4, 0, 0, 0, 0],
    ],
  },
  {
    name: "Fortress",
    layout: [
      [0, 0, 6, 6, 7, 7, 6, 6, 0, 0],
      [0, 7, 8, 0, 0, 0, 0, 8, 7, 0],
      [6, 8, 9, 5, 0, 0, 5, 9, 8, 6],
      [6, 0, 10, 6, 4, 4, 6, 10, 0, 6],
      [6, 8, 9, 5, 0, 0, 5, 9, 8, 6],
      [0, 7, 8, 0, 3, 3, 0, 8, 7, 0],
      [0, 0, 6, 6, 7, 7, 6, 6, 0, 0],
    ],
  },
];

let animationId = null;
let lastTimestamp = 0;
const input = { left: false, right: false };
const state = createInitialState();

function createInitialState() {
  return {
    score: 0,
    lives: 3,
    levelIndex: 0,
    levelName: LEVELS[0].name,
    isRunning: false,
    isGameOver: false,
    isWin: false,
    powerTimer: 0,
    paddle: {
      x: (WIDTH - PADDLE_WIDTH) / 2,
      y: HEIGHT - 28,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT,
    },
    balls: [createBall()],
    bricks: createBricks(0),
    powerUps: [],
  };
}

function createBall() {
  return {
    x: WIDTH / 2,
    y: HEIGHT - 44,
    vx: 0,
    vy: 0,
    radius: BALL_RADIUS,
    isLaunched: false,
  };
}

function launchBall(ball, direction = 1) {
  ball.vx = BASE_BALL_SPEED * 0.72 * direction;
  ball.vy = -BASE_BALL_SPEED;
  ball.isLaunched = true;
}

function createBricks(levelIndex) {
  const level = LEVELS[levelIndex];
  const rows = level.layout.length;
  const cols = Math.max(...level.layout.map((row) => row.length));
  const totalGaps = (cols - 1) * BRICK_PADDING;
  const availableWidth = WIDTH - BRICK_OFFSET_LEFT * 2 - totalGaps;
  const brickWidth = availableWidth / cols;
  const bricks = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const durability = level.layout[row][col] ?? 0;
      if (durability <= 0) {
        continue;
      }

      bricks.push({
        x: BRICK_OFFSET_LEFT + col * (brickWidth + BRICK_PADDING),
        y: BRICK_OFFSET_TOP + row * (BRICK_HEIGHT + BRICK_PADDING),
        width: brickWidth,
        height: BRICK_HEIGHT,
        hitsRemaining: durability,
      });
    }
  }

  return bricks;
}

function resetGame() {
  const nextState = createInitialState();
  Object.assign(state, nextState);
  statusElement.textContent = "Press Start to launch the ball. Arrow keys or mouse move the paddle.";
  render();
}

function loadLevel(levelIndex, keepScore = true, keepLives = true) {
  state.levelIndex = levelIndex;
  state.levelName = LEVELS[levelIndex].name;
  state.bricks = createBricks(levelIndex);
  state.powerUps = [];
  state.balls = [createBall()];
  state.powerTimer = 0;
  state.isRunning = false;
  state.isGameOver = false;
  state.isWin = false;
  if (!keepScore) {
    state.score = 0;
  }
  if (!keepLives) {
    state.lives = 3;
  }
  statusElement.textContent = `Level ${levelIndex + 1}: ${state.levelName}. Press Start to launch.`;
}

function startGame() {
  if (state.isGameOver || state.isWin) {
    resetGame();
  }

  state.isRunning = true;
  for (const ball of state.balls) {
    if (!ball.isLaunched) {
      launchBall(ball, Math.random() > 0.5 ? 1 : -1);
    }
  }
  if (state.powerTimer > 0) {
    statusElement.textContent = `Double Hit active. ${state.levelName} in progress.`;
  } else {
    statusElement.textContent = `${state.levelName} in progress. Gold adds balls, red adds double hit power.`;
  }
  ensureAnimation();
}

function ensureAnimation() {
  if (animationId === null) {
    lastTimestamp = 0;
    animationId = window.requestAnimationFrame(step);
  }
}

function stopAnimation() {
  if (animationId !== null) {
    window.cancelAnimationFrame(animationId);
    animationId = null;
  }
}

function step(timestamp) {
  if (!lastTimestamp) {
    lastTimestamp = timestamp;
  }

  const deltaSeconds = Math.min((timestamp - lastTimestamp) / 1000, 0.02);
  lastTimestamp = timestamp;

  update(deltaSeconds);
  render();

  if (state.isRunning) {
    animationId = window.requestAnimationFrame(step);
  } else {
    stopAnimation();
  }
}

function update(deltaSeconds) {
  movePaddle(deltaSeconds);
  updateBalls(deltaSeconds);
  updatePowerUps(deltaSeconds);

  if (state.powerTimer > 0) {
    state.powerTimer = Math.max(0, state.powerTimer - deltaSeconds);
    if (state.powerTimer === 0 && state.isRunning) {
      statusElement.textContent = `${state.levelName} in progress. Double Hit expired.`;
    }
  }

  syncScoreboard();
}

function movePaddle(deltaSeconds) {
  if (input.left) {
    state.paddle.x -= PADDLE_SPEED * deltaSeconds;
  }
  if (input.right) {
    state.paddle.x += PADDLE_SPEED * deltaSeconds;
  }

  state.paddle.x = Math.max(0, Math.min(WIDTH - state.paddle.width, state.paddle.x));

  for (const ball of state.balls) {
    if (!ball.isLaunched) {
      ball.x = state.paddle.x + state.paddle.width / 2;
      ball.y = state.paddle.y - ball.radius - 2;
    }
  }
}

function updateBalls(deltaSeconds) {
  for (const ball of state.balls) {
    if (!ball.isLaunched) {
      continue;
    }

    ball.x += ball.vx * deltaSeconds;
    ball.y += ball.vy * deltaSeconds;

    if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= WIDTH) {
      ball.vx *= -1;
      ball.x = Math.max(ball.radius, Math.min(WIDTH - ball.radius, ball.x));
    }

    if (ball.y - ball.radius <= 0) {
      ball.vy *= -1;
      ball.y = ball.radius;
    }

    handlePaddleCollision(ball);
    handleBrickCollision(ball);
  }

  state.balls = state.balls.filter((ball) => ball.y - ball.radius <= HEIGHT);

  if (state.balls.length === 0) {
    handleLifeLost();
  }

  if (state.bricks.every((brick) => brick.hitsRemaining <= 0)) {
    advanceLevel();
  }
}

function handlePaddleCollision(ball) {
  const paddle = state.paddle;
  const withinX = ball.x + ball.radius >= paddle.x && ball.x - ball.radius <= paddle.x + paddle.width;
  const withinY = ball.y + ball.radius >= paddle.y && ball.y - ball.radius <= paddle.y + paddle.height;

  if (!withinX || !withinY || ball.vy <= 0) {
    return;
  }

  const hitRatio = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
  ball.vx = BASE_BALL_SPEED * hitRatio;
  ball.vy = -Math.max(BASE_BALL_SPEED * 0.75, Math.abs(ball.vy));
  ball.y = paddle.y - ball.radius - 1;
}

function handleBrickCollision(ball) {
  for (const brick of state.bricks) {
    if (brick.hitsRemaining <= 0) {
      continue;
    }

    const nearestX = clamp(ball.x, brick.x, brick.x + brick.width);
    const nearestY = clamp(ball.y, brick.y, brick.y + brick.height);
    const dx = ball.x - nearestX;
    const dy = ball.y - nearestY;

    if (dx * dx + dy * dy > ball.radius * ball.radius) {
      continue;
    }

    const damage = state.powerTimer > 0 ? 2 : 1;
    brick.hitsRemaining = Math.max(0, brick.hitsRemaining - damage);
    state.score += 10 * damage;

    if (Math.abs(dx) > Math.abs(dy)) {
      ball.vx *= -1;
    } else {
      ball.vy *= -1;
    }

    if (brick.hitsRemaining <= 0) {
      state.score += 10;
      maybeDropPowerUp(brick);
    }

    return;
  }
}

function maybeDropPowerUp(brick) {
  const roll = Math.random();
  let type = null;

  if (roll < DOUBLE_HIT_DROP_RATE) {
    type = "double-hit";
  } else if (roll < DOUBLE_HIT_DROP_RATE + MULTI_BALL_DROP_RATE) {
    type = "multi-ball";
  }

  if (!type) {
    return;
  }

  state.powerUps.push({
    type,
    x: brick.x + brick.width / 2,
    y: brick.y + brick.height / 2,
    size: 12,
    vy: POWER_UP_SPEED,
  });
}

function updatePowerUps(deltaSeconds) {
  const paddle = state.paddle;

  state.powerUps = state.powerUps.filter((powerUp) => {
    powerUp.y += powerUp.vy * deltaSeconds;

    const caught =
      powerUp.x >= paddle.x &&
      powerUp.x <= paddle.x + paddle.width &&
      powerUp.y + powerUp.size >= paddle.y &&
      powerUp.y - powerUp.size <= paddle.y + paddle.height;

    if (caught) {
      if (powerUp.type === "multi-ball") {
        addExtraBall();
      } else {
        activateDoubleHit();
      }
      return false;
    }

    return powerUp.y - powerUp.size <= HEIGHT;
  });
}

function addExtraBall() {
  const ball = createBall();
  ball.x = state.paddle.x + state.paddle.width / 2;
  ball.y = state.paddle.y - ball.radius - 2;
  launchBall(ball, Math.random() > 0.5 ? 1 : -1);
  state.balls.push(ball);
  statusElement.textContent = "Extra ball collected.";
}

function activateDoubleHit() {
  state.powerTimer = DOUBLE_HIT_DURATION;
  statusElement.textContent = "Double Hit activated for 20 seconds.";
}

function handleLifeLost() {
  state.lives -= 1;

  if (state.lives <= 0) {
    state.isRunning = false;
    state.isGameOver = true;
    statusElement.textContent = "Game over. Restart to try again.";
    return;
  }

  state.balls = [createBall()];
  state.powerUps = [];
  state.powerTimer = 0;
  state.isRunning = false;
  statusElement.textContent = `Life lost. ${state.lives} left. Press Start to relaunch.`;
}

function advanceLevel() {
  state.isRunning = false;
  state.powerUps = [];
  state.powerTimer = 0;

  if (state.levelIndex === LEVELS.length - 1) {
    state.isWin = true;
    statusElement.textContent = "All levels cleared. Restart to play again.";
    return;
  }

  loadLevel(state.levelIndex + 1);
}

function syncScoreboard() {
  scoreElement.textContent = String(state.score);
  livesElement.textContent = String(state.lives);
  levelElement.textContent = `${state.levelIndex + 1}`;
  powerElement.textContent = state.powerTimer > 0 ? `${Math.ceil(state.powerTimer)}s` : "-";
}

function drawBall(ball) {
  context.beginPath();
  context.fillStyle = state.powerTimer > 0 ? "#b0463c" : "#8f6a4b";
  context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  context.fill();
}

function drawPaddle() {
  context.fillStyle = "#355e3b";
  context.fillRect(state.paddle.x, state.paddle.y, state.paddle.width, state.paddle.height);
}

function drawBricks() {
  for (const brick of state.bricks) {
    if (brick.hitsRemaining <= 0) {
      continue;
    }

    context.fillStyle = BRICK_COLORS[brick.hitsRemaining];
    context.fillRect(brick.x, brick.y, brick.width, brick.height);
    context.strokeStyle = "rgba(36, 31, 22, 0.12)";
    context.strokeRect(brick.x, brick.y, brick.width, brick.height);

    context.fillStyle = brick.hitsRemaining >= 6 ? "#fffaf2" : "#241f16";
    context.font = "10px Avenir Next, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(
      String(brick.hitsRemaining),
      brick.x + brick.width / 2,
      brick.y + brick.height / 2 + 0.5,
    );
  }
}

function drawPowerUps() {
  for (const powerUp of state.powerUps) {
    context.fillStyle = powerUp.type === "double-hit" ? "#c64b3f" : "#c9a33d";
    context.beginPath();
    context.arc(powerUp.x, powerUp.y, powerUp.size / 2, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#fffaf2";
    context.font = "9px Avenir Next, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(powerUp.type === "double-hit" ? "2" : "+", powerUp.x, powerUp.y + 0.5);
  }
}

function drawLevelBanner() {
  context.fillStyle = "rgba(36, 31, 22, 0.55)";
  context.font = "11px Avenir Next, sans-serif";
  context.textAlign = "left";
  context.textBaseline = "top";
  context.fillText(`Level ${state.levelIndex + 1}: ${state.levelName}`, 12, HEIGHT - 18);
}

function render() {
  context.clearRect(0, 0, WIDTH, HEIGHT);
  context.fillStyle = "#faf6ee";
  context.fillRect(0, 0, WIDTH, HEIGHT);

  drawBricks();
  drawPaddle();
  drawPowerUps();
  for (const ball of state.balls) {
    drawBall(ball);
  }
  drawLevelBanner();
  syncScoreboard();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
    input.left = true;
  }

  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
    input.right = true;
  }

  if (event.key === " " && !state.isRunning && !state.isGameOver && !state.isWin) {
    event.preventDefault();
    startGame();
  }
});

document.addEventListener("keyup", (event) => {
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
    input.left = false;
  }

  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
    input.right = false;
  }
});

canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = WIDTH / rect.width;
  const mouseX = (event.clientX - rect.left) * scaleX;
  state.paddle.x = clamp(mouseX - state.paddle.width / 2, 0, WIDTH - state.paddle.width);
});

startButton.addEventListener("click", () => {
  startGame();
});

restartButton.addEventListener("click", () => {
  state.isRunning = false;
  stopAnimation();
  resetGame();
});

render();
