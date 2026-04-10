const canvas = document.querySelector("#game-canvas");
const context = canvas.getContext("2d");
const scoreElement = document.querySelector("#score");
const livesElement = document.querySelector("#lives");
const statusElement = document.querySelector("#status");
const startButton = document.querySelector("#start-button");
const restartButton = document.querySelector("#restart-button");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const PADDLE_WIDTH = 64;
const PADDLE_HEIGHT = 10;
const PADDLE_SPEED = 320;
const BALL_RADIUS = 6;
const BASE_BALL_SPEED = 220;
const POWER_UP_SPEED = 96;
const BRICK_ROWS = 6;
const BRICK_COLUMNS = 8;
const BRICK_WIDTH = 34;
const BRICK_HEIGHT = 14;
const BRICK_PADDING = 4;
const BRICK_OFFSET_TOP = 40;
const BRICK_OFFSET_LEFT = 12;
const MULTI_BALL_DROP_RATE = 0.12;

const BRICK_COLORS = {
  1: "#e7d8b5",
  2: "#d9ba83",
  3: "#d48f5e",
  4: "#be6848",
  5: "#934632",
};

let animationId = null;
let lastTimestamp = 0;
const input = { left: false, right: false };
const state = createInitialState();

function createInitialState() {
  return {
    score: 0,
    lives: 3,
    isRunning: false,
    isGameOver: false,
    isWin: false,
    paddle: {
      x: (WIDTH - PADDLE_WIDTH) / 2,
      y: HEIGHT - 28,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT,
    },
    balls: [createBall()],
    bricks: createBricks(),
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
  const speedX = BASE_BALL_SPEED * 0.72 * direction;
  ball.vx = speedX;
  ball.vy = -BASE_BALL_SPEED;
  ball.isLaunched = true;
}

function createBricks() {
  const bricks = [];

  for (let row = 0; row < BRICK_ROWS; row += 1) {
    for (let column = 0; column < BRICK_COLUMNS; column += 1) {
      const durability = row < 2 ? 1 + row : Math.min(5, 2 + row - Math.floor(Math.random() * 2));
      bricks.push({
        x: BRICK_OFFSET_LEFT + column * (BRICK_WIDTH + BRICK_PADDING),
        y: BRICK_OFFSET_TOP + row * (BRICK_HEIGHT + BRICK_PADDING),
        width: BRICK_WIDTH,
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
  statusElement.textContent = "Break the bricks and catch rare gold drops for extra balls.";
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
    state.isRunning = false;
    state.isWin = true;
    statusElement.textContent = "Board cleared. Restart to play another round.";
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

    brick.hitsRemaining -= 1;
    state.score += 10;

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
  if (Math.random() > MULTI_BALL_DROP_RATE) {
    return;
  }

  state.powerUps.push({
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
      addExtraBall();
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
  state.isRunning = false;
  statusElement.textContent = `Life lost. ${state.lives} left. Press Start to relaunch.`;
}

function syncScoreboard() {
  scoreElement.textContent = String(state.score);
  livesElement.textContent = String(state.lives);
}

function drawBall(ball) {
  context.beginPath();
  context.fillStyle = "#8f6a4b";
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

    context.fillStyle = brick.hitsRemaining >= 4 ? "#fffaf2" : "#241f16";
    context.font = "10px Avenir Next, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(String(brick.hitsRemaining), brick.x + brick.width / 2, brick.y + brick.height / 2 + 0.5);
  }
}

function drawPowerUps() {
  for (const powerUp of state.powerUps) {
    context.fillStyle = "#c9a33d";
    context.beginPath();
    context.arc(powerUp.x, powerUp.y, powerUp.size / 2, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#fffaf2";
    context.font = "9px Avenir Next, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("+", powerUp.x, powerUp.y + 0.5);
  }
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
