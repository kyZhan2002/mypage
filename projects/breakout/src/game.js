const canvas = document.querySelector("#game-canvas");
const context = canvas.getContext("2d");
const scoreElement = document.querySelector("#score");
const currencyElement = document.querySelector("#currency-score");
const bestScoreElement = document.querySelector("#best-score");
const livesElement = document.querySelector("#lives");
const levelElement = document.querySelector("#level");
const powerElement = document.querySelector("#power");
const statusElement = document.querySelector("#status");
const levelSelect = document.querySelector("#level-select");
const startButton = document.querySelector("#start-button");
const restartButton = document.querySelector("#restart-button");
const buyPaddleButton = document.querySelector("#buy-paddle");
const buyPowerButton = document.querySelector("#buy-power");
const buyLifeButton = document.querySelector("#buy-life");
const buyLuckButton = document.querySelector("#buy-luck");
const shopPaddleDetail = document.querySelector("#shop-paddle-detail");
const shopPowerDetail = document.querySelector("#shop-power-detail");
const shopLifeDetail = document.querySelector("#shop-life-detail");
const shopLuckDetail = document.querySelector("#shop-luck-detail");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const PADDLE_WIDTH = 78;
const PADDLE_HEIGHT = 10;
const PADDLE_SPEED = 340;
const BALL_RADIUS = 6;
const BASE_BALL_SPEED = 230;
const POWER_UP_SPEED = 96;
const LIGHTNING_BALL_SPEED = 280;
const BRICK_HEIGHT = 14;
const BRICK_PADDING = 4;
const BRICK_OFFSET_LEFT = 14;
const MULTI_BALL_DROP_RATE = 0.15;
const DOUBLE_HIT_DROP_RATE = 0.06;
const SAFETY_NET_DROP_RATE = 0.06;
const LIGHTNING_DROP_RATE = 0.04;
const DOUBLE_HIT_DURATION = 20;
const SAFETY_NET_DURATION = 25;
const BEST_SCORE_KEY = "breakout-best-score";
const CURRENCY_KEY = "breakout-currency-score";
const UNLOCKED_LEVEL_KEY = "breakout-unlocked-level";
const UPGRADE_STATE_KEY = "breakout-upgrades";
const PADDLE_UPGRADE_COST = 3000;
const POWER_UPGRADE_COST = 5000;
const LIFE_UPGRADE_COST = 5000;
const LUCK_UPGRADE_COST = 5000;
const PADDLE_UPGRADE_CAP = 5;
const POWER_UPGRADE_CAP = 5;
const LUCK_UPGRADE_CAP = 4;

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
    offsetTop: 52,
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
    offsetTop: 30,
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
    offsetTop: 82,
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
    offsetTop: 44,
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
  {
    name: "Twin Arches",
    offsetTop: 68,
    layout: [
      [0, 0, 3, 4, 0, 0, 4, 3, 0, 0],
      [0, 4, 5, 6, 0, 0, 6, 5, 4, 0],
      [3, 5, 7, 8, 2, 2, 8, 7, 5, 3],
      [4, 0, 8, 9, 0, 0, 9, 8, 0, 4],
      [5, 0, 9, 10, 0, 0, 10, 9, 0, 5],
      [4, 3, 7, 8, 6, 6, 8, 7, 3, 4],
    ],
  },
  {
    name: "Needle Gate",
    offsetTop: 92,
    layout: [
      [8, 0, 0, 9, 10, 10, 9, 0, 0, 8],
      [7, 0, 0, 8, 0, 0, 8, 0, 0, 7],
      [6, 5, 0, 7, 0, 0, 7, 0, 5, 6],
      [5, 4, 3, 6, 2, 2, 6, 3, 4, 5],
      [4, 0, 0, 5, 0, 0, 5, 0, 0, 4],
      [3, 2, 2, 4, 6, 6, 4, 2, 2, 3],
      [2, 0, 0, 3, 5, 5, 3, 0, 0, 2],
    ],
  },
];

let animationId = null;
let lastTimestamp = 0;
const input = { left: false, right: false };
const state = createInitialState();

function createInitialState() {
  const unlockedLevel = getUnlockedLevel();
  const upgrades = getUpgradeState();
  return {
    score: 0,
    currency: getCurrency(),
    lives: 3,
    levelIndex: 0,
    levelName: LEVELS[0].name,
    unlockedLevel,
    upgrades,
    isRunning: false,
    isPaused: false,
    isGameOver: false,
    isWin: false,
    doubleHitTimer: 0,
    safetyNetTimer: 0,
    paddle: {
      x: (WIDTH - getPaddleWidth(upgrades)) / 2,
      y: HEIGHT - 28,
      width: getPaddleWidth(upgrades),
      height: PADDLE_HEIGHT,
    },
    balls: [createBall()],
    lightningBalls: [],
    bricks: createBricks(0),
    powerUps: [],
  };
}

function getUnlockedLevel() {
  const stored = window.localStorage.getItem(UNLOCKED_LEVEL_KEY);
  if (!stored) {
    return 0;
  }
  return Math.max(0, Math.min(LEVELS.length - 1, Number(stored)));
}

function getCurrency() {
  const stored = window.localStorage.getItem(CURRENCY_KEY);
  return stored ? Number(stored) : 0;
}

function setCurrency(value) {
  const nextValue = Math.max(0, Math.floor(value));
  window.localStorage.setItem(CURRENCY_KEY, String(nextValue));
  state.currency = nextValue;
}

function setUnlockedLevel(levelIndex) {
  const nextUnlocked = Math.max(getUnlockedLevel(), levelIndex);
  window.localStorage.setItem(UNLOCKED_LEVEL_KEY, String(nextUnlocked));
  state.unlockedLevel = nextUnlocked;
}

function getUpgradeState() {
  const stored = window.localStorage.getItem(UPGRADE_STATE_KEY);
  if (!stored) {
    return { paddleLevels: 0, powerLevels: 0, luckLevels: 0 };
  }

  try {
    const parsed = JSON.parse(stored);
    return {
      paddleLevels: Number(parsed.paddleLevels) || 0,
      powerLevels: Number(parsed.powerLevels) || 0,
      luckLevels: Number(parsed.luckLevels) || 0,
    };
  } catch {
    return { paddleLevels: 0, powerLevels: 0, luckLevels: 0 };
  }
}

function persistUpgradeState() {
  window.localStorage.setItem(UPGRADE_STATE_KEY, JSON.stringify(state.upgrades));
}

function getBestScore() {
  const stored = window.localStorage.getItem(BEST_SCORE_KEY);
  return stored ? Number(stored) : 0;
}

function updateBestScore() {
  const bestScore = Math.max(getBestScore(), state.score);
  window.localStorage.setItem(BEST_SCORE_KEY, String(bestScore));
  bestScoreElement.textContent = String(bestScore);
}

function getPaddleWidth(upgrades = state.upgrades) {
  return PADDLE_WIDTH * (1 + upgrades.paddleLevels * 0.1);
}

function currentDamage() {
  return 1 + state.upgrades.powerLevels + (state.doubleHitTimer > 0 ? 1 : 0);
}

function currentDropBonus() {
  return state.upgrades.luckLevels * 0.03;
}

function awardScore(points) {
  state.score += points;
  setCurrency(state.currency + points);
}

function spendCurrency(cost) {
  if (state.currency < cost) {
    return false;
  }

  setCurrency(state.currency - cost);
  return true;
}

function clampPaddlePosition() {
  state.paddle.x = clamp(state.paddle.x, 0, WIDTH - state.paddle.width);
}

function applyPaddleUpgrade() {
  const centerX = state.paddle.x + state.paddle.width / 2;
  state.paddle.width = getPaddleWidth();
  state.paddle.x = centerX - state.paddle.width / 2;
  clampPaddlePosition();
}

function purchasePaddleUpgrade() {
  if (state.upgrades.paddleLevels >= PADDLE_UPGRADE_CAP) {
    statusElement.textContent = "Paddle length is already at max level.";
    render();
    return;
  }

  if (!spendCurrency(PADDLE_UPGRADE_COST)) {
    return;
  }

  state.upgrades.paddleLevels += 1;
  persistUpgradeState();
  applyPaddleUpgrade();
  statusElement.textContent = "Paddle upgraded. Permanent length increased by 10%.";
  render();
}

function purchasePowerUpgrade() {
  if (state.upgrades.powerLevels >= POWER_UPGRADE_CAP) {
    statusElement.textContent = "Ball power is already at max level.";
    render();
    return;
  }

  if (!spendCurrency(POWER_UPGRADE_COST)) {
    return;
  }

  state.upgrades.powerLevels += 1;
  persistUpgradeState();
  statusElement.textContent = "Ball power upgraded. Permanent damage increased by 1.";
  render();
}

function purchaseLife() {
  if (!spendCurrency(LIFE_UPGRADE_COST)) {
    return;
  }

  state.lives += 1;

  if (state.isGameOver) {
    state.isGameOver = false;
    state.isWin = false;
    state.isPaused = false;
    state.balls = [createBall()];
    state.powerUps = [];
    state.lightningBalls = [];
    state.doubleHitTimer = 0;
    state.safetyNetTimer = 0;
    statusElement.textContent = "Extra life purchased. Press Start to relaunch.";
  } else {
    statusElement.textContent = `Extra life purchased. Lives: ${state.lives}.`;
  }

  render();
}

function purchaseLuckUpgrade() {
  if (state.upgrades.luckLevels >= LUCK_UPGRADE_CAP) {
    statusElement.textContent = "Drop rate boost is already at max level.";
    render();
    return;
  }

  if (!spendCurrency(LUCK_UPGRADE_COST)) {
    return;
  }

  state.upgrades.luckLevels += 1;
  persistUpgradeState();
  statusElement.textContent = "Luck upgraded. All power-up drop rates increased by 0.03.";
  render();
}

function populateLevelSelect() {
  levelSelect.innerHTML = "";
  for (let index = 0; index < LEVELS.length; index += 1) {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = `Level ${index + 1}: ${LEVELS[index].name}`;
    option.disabled = index > state.unlockedLevel;
    levelSelect.append(option);
  }
  levelSelect.value = String(state.levelIndex);
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
  const offsetTop = level.offsetTop ?? 52;
  const bricks = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const durability = level.layout[row][col] ?? 0;
      if (durability <= 0) {
        continue;
      }

      bricks.push({
        x: BRICK_OFFSET_LEFT + col * (brickWidth + BRICK_PADDING),
        y: offsetTop + row * (BRICK_HEIGHT + BRICK_PADDING),
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
  state.paddle.width = getPaddleWidth();
  state.paddle.x = (WIDTH - state.paddle.width) / 2;
  populateLevelSelect();
  statusElement.textContent = "Press Start to launch the ball. Arrow keys or mouse move the paddle.";
  render();
}

function loadLevel(levelIndex, keepScore = true, keepLives = true) {
  state.levelIndex = levelIndex;
  state.levelName = LEVELS[levelIndex].name;
  state.bricks = createBricks(levelIndex);
  state.powerUps = [];
  state.balls = [createBall()];
  state.lightningBalls = [];
  state.doubleHitTimer = 0;
  state.safetyNetTimer = 0;
  state.paddle.width = getPaddleWidth();
  state.paddle.x = (WIDTH - state.paddle.width) / 2;
  state.isRunning = false;
  state.isPaused = false;
  state.isGameOver = false;
  state.isWin = false;
  if (!keepScore) {
    state.score = 0;
  }
  if (!keepLives) {
    state.lives = 3;
  }
  populateLevelSelect();
  statusElement.textContent = `Level ${levelIndex + 1}: ${state.levelName}. Press Start to launch.`;
}

function startGame() {
  if (state.isGameOver || state.isWin) {
    resetGame();
  }

  state.isRunning = true;
  state.isPaused = false;
  for (const ball of state.balls) {
    if (!ball.isLaunched) {
      launchBall(ball, Math.random() > 0.5 ? 1 : -1);
    }
  }
  statusElement.textContent = `${state.levelName} in progress. Gold adds balls, red adds double hit, green adds a safety net, blue adds lightning.`;
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

  if (!state.isPaused) {
    update(deltaSeconds);
  }
  render();

  if (state.isRunning || state.isPaused) {
    animationId = window.requestAnimationFrame(step);
  } else {
    stopAnimation();
  }
}

function update(deltaSeconds) {
  movePaddle(deltaSeconds);
  updateBalls(deltaSeconds);
  updateLightningBalls(deltaSeconds);
  updatePowerUps(deltaSeconds);

  if (state.doubleHitTimer > 0) {
    state.doubleHitTimer = Math.max(0, state.doubleHitTimer - deltaSeconds);
  }
  if (state.safetyNetTimer > 0) {
    state.safetyNetTimer = Math.max(0, state.safetyNetTimer - deltaSeconds);
  }

  syncScoreboard();
  updateBestScore();
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
    handleSafetyNet(ball);
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

    const damage = currentDamage();
    brick.hitsRemaining = Math.max(0, brick.hitsRemaining - damage);
    awardScore(10 * damage);

    if (Math.abs(dx) > Math.abs(dy)) {
      ball.vx *= -1;
    } else {
      ball.vy *= -1;
    }

    if (brick.hitsRemaining <= 0) {
      awardScore(10);
      maybeDropPowerUp(brick);
    }

    return;
  }
}

function handleSafetyNet(ball) {
  if (state.safetyNetTimer <= 0 || ball.vy <= 0) {
    return;
  }

  const netY = HEIGHT - 6;
  if (ball.y + ball.radius >= netY) {
    ball.y = netY - ball.radius;
    ball.vy = -Math.abs(ball.vy);
    if (Math.abs(ball.vx) < 36) {
      ball.vx = ball.vx >= 0 ? 36 : -36;
    }
  }
}

function maybeDropPowerUp(brick) {
  const roll = Math.random();
  let type = null;

  const dropBonus = currentDropBonus();
  const lightningThreshold = LIGHTNING_DROP_RATE + dropBonus;
  const safetyThreshold = lightningThreshold + SAFETY_NET_DROP_RATE + dropBonus;
  const doubleHitThreshold = safetyThreshold + DOUBLE_HIT_DROP_RATE + dropBonus;
  const multiBallThreshold = doubleHitThreshold + MULTI_BALL_DROP_RATE + dropBonus;

  if (roll < lightningThreshold) {
    type = "lightning";
  } else if (roll < safetyThreshold) {
    type = "safety-net";
  } else if (roll < doubleHitThreshold) {
    type = "double-hit";
  } else if (roll < multiBallThreshold) {
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
      } else if (powerUp.type === "double-hit") {
        activateDoubleHit();
      } else if (powerUp.type === "lightning") {
        activateLightningVolley();
      } else {
        activateSafetyNet();
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
  state.doubleHitTimer = DOUBLE_HIT_DURATION;
  statusElement.textContent = "Double Hit activated for 20 seconds.";
}

function activateSafetyNet() {
  state.safetyNetTimer = SAFETY_NET_DURATION;
  statusElement.textContent = "Safety net activated for 25 seconds.";
}

function activateLightningVolley() {
  const originX = state.paddle.x + state.paddle.width / 2;
  const originY = state.paddle.y - 4;
  const count = 15;
  const startAngle = Math.PI + Math.PI / 12;
  const endAngle = (2 * Math.PI) - Math.PI / 12;

  for (let index = 0; index < count; index += 1) {
    const ratio = count === 1 ? 0.5 : index / (count - 1);
    const angle = startAngle + (endAngle - startAngle) * ratio;
    state.lightningBalls.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * LIGHTNING_BALL_SPEED,
      vy: Math.sin(angle) * LIGHTNING_BALL_SPEED,
      radius: 3,
    });
  }

  statusElement.textContent = "Lightning volley released.";
}

function updateLightningBalls(deltaSeconds) {
  const nextLightningBalls = [];

  for (const ball of state.lightningBalls) {
    ball.x += ball.vx * deltaSeconds;
    ball.y += ball.vy * deltaSeconds;

    if (ball.x < -10 || ball.x > WIDTH + 10 || ball.y < -10 || ball.y > HEIGHT + 10) {
      continue;
    }

    if (handleLightningBrickCollision(ball)) {
      continue;
    }

    nextLightningBalls.push(ball);
  }

  state.lightningBalls = nextLightningBalls;
}

function handleLightningBrickCollision(ball) {
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

    brick.hitsRemaining = Math.max(0, brick.hitsRemaining - 1);
    awardScore(10);
    if (brick.hitsRemaining <= 0) {
      awardScore(10);
      maybeDropPowerUp(brick);
    }
    return true;
  }

  return false;
}

function handleLifeLost() {
  state.lives -= 1;

  if (state.lives <= 0) {
    state.isRunning = false;
    state.isPaused = false;
    state.isGameOver = true;
    statusElement.textContent = "Game over. Restart to try again.";
    return;
  }

  state.balls = [createBall()];
  state.powerUps = [];
  state.lightningBalls = [];
  state.doubleHitTimer = 0;
  state.safetyNetTimer = 0;
  state.isRunning = false;
  state.isPaused = false;
  statusElement.textContent = `Life lost. ${state.lives} left. Press Start to relaunch.`;
}

function advanceLevel() {
  state.isRunning = false;
  state.isPaused = false;
  state.powerUps = [];
  state.lightningBalls = [];
  state.doubleHitTimer = 0;
  state.safetyNetTimer = 0;

  if (state.levelIndex === LEVELS.length - 1) {
    state.isWin = true;
    setUnlockedLevel(LEVELS.length - 1);
    statusElement.textContent = "All levels cleared. Restart to play again.";
    return;
  }

  const nextLevelIndex = state.levelIndex + 1;
  setUnlockedLevel(nextLevelIndex);
  loadLevel(nextLevelIndex);
}

function currentPowerLabel() {
  const labels = [];
  if (state.doubleHitTimer > 0) {
    labels.push(`2x ${Math.ceil(state.doubleHitTimer)}s`);
  }
  if (state.safetyNetTimer > 0) {
    labels.push(`Net ${Math.ceil(state.safetyNetTimer)}s`);
  }
  return labels.length > 0 ? labels.join(" / ") : "-";
}

function syncScoreboard() {
  scoreElement.textContent = String(state.score);
  currencyElement.textContent = String(state.currency);
  bestScoreElement.textContent = String(getBestScore());
  livesElement.textContent = String(state.lives);
  levelElement.textContent = `${state.levelIndex + 1}`;
  powerElement.textContent = currentPowerLabel();
}

function renderShop() {
  shopPaddleDetail.textContent = `Lv ${state.upgrades.paddleLevels}/${PADDLE_UPGRADE_CAP} • +10% permanent length`;
  shopPowerDetail.textContent = `Lv ${state.upgrades.powerLevels}/${POWER_UPGRADE_CAP} • total damage ${1 + state.upgrades.powerLevels}`;
  shopLifeDetail.textContent = `Add one life immediately • current ${state.lives}`;
  shopLuckDetail.textContent = `Lv ${state.upgrades.luckLevels}/${LUCK_UPGRADE_CAP} • total drop bonus +${currentDropBonus().toFixed(2)}`;

  buyPaddleButton.disabled =
    state.currency < PADDLE_UPGRADE_COST || state.upgrades.paddleLevels >= PADDLE_UPGRADE_CAP;
  buyPowerButton.disabled =
    state.currency < POWER_UPGRADE_COST || state.upgrades.powerLevels >= POWER_UPGRADE_CAP;
  buyLifeButton.disabled = state.currency < LIFE_UPGRADE_COST;
  buyLuckButton.disabled =
    state.currency < LUCK_UPGRADE_COST || state.upgrades.luckLevels >= LUCK_UPGRADE_CAP;
}

function drawBall(ball) {
  context.beginPath();
  context.fillStyle = state.doubleHitTimer > 0 ? "#b0463c" : "#8f6a4b";
  context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  context.fill();
}

function drawPaddle() {
  context.fillStyle = "#355e3b";
  context.fillRect(state.paddle.x, state.paddle.y, state.paddle.width, state.paddle.height);
}

function drawSafetyNet() {
  if (state.safetyNetTimer <= 0) {
    return;
  }

  context.fillStyle = "rgba(72, 141, 87, 0.9)";
  context.fillRect(0, HEIGHT - 6, WIDTH, 6);
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
    if (powerUp.type === "double-hit") {
      context.fillStyle = "#c64b3f";
    } else if (powerUp.type === "safety-net") {
      context.fillStyle = "#488d57";
    } else if (powerUp.type === "lightning") {
      context.fillStyle = "#4e89d8";
    } else {
      context.fillStyle = "#c9a33d";
    }

    context.beginPath();
    context.arc(powerUp.x, powerUp.y, powerUp.size / 2, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#fffaf2";
    context.font = "9px Avenir Next, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    const label =
      powerUp.type === "double-hit"
        ? "2"
        : powerUp.type === "safety-net"
          ? "S"
          : powerUp.type === "lightning"
            ? "L"
            : "+";
    context.fillText(label, powerUp.x, powerUp.y + 0.5);
  }
}

function drawLightningBalls() {
  for (const ball of state.lightningBalls) {
    context.beginPath();
    context.fillStyle = "#4e89d8";
    context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    context.fill();
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
  drawSafetyNet();
  drawPowerUps();
  drawLightningBalls();
  for (const ball of state.balls) {
    drawBall(ball);
  }
  drawLevelBanner();

  if (state.isPaused) {
    context.fillStyle = "rgba(36, 31, 22, 0.18)";
    context.fillRect(0, 0, WIDTH, HEIGHT);
    context.fillStyle = "#241f16";
    context.font = "bold 22px Avenir Next, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("Paused", WIDTH / 2, HEIGHT / 2);
  }

  syncScoreboard();
  renderShop();
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

  if (event.key === " ") {
    event.preventDefault();

    if (state.isGameOver || state.isWin) {
      return;
    }

    if (state.isRunning) {
      state.isRunning = false;
      state.isPaused = true;
      statusElement.textContent = "Paused. Press Space to resume.";
      ensureAnimation();
      return;
    }

    if (state.isPaused) {
      state.isPaused = false;
      state.isRunning = true;
      statusElement.textContent = `${state.levelName} resumed.`;
      ensureAnimation();
      return;
    }

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

levelSelect.addEventListener("change", () => {
  const selectedLevel = Number(levelSelect.value);
  if (selectedLevel > state.unlockedLevel) {
    populateLevelSelect();
    return;
  }
  state.isRunning = false;
  state.isPaused = false;
  stopAnimation();
  loadLevel(selectedLevel);
  render();
});

startButton.addEventListener("click", () => {
  startGame();
});

restartButton.addEventListener("click", () => {
  state.isRunning = false;
  state.isPaused = false;
  stopAnimation();
  resetGame();
});

buyPaddleButton.addEventListener("click", () => {
  purchasePaddleUpgrade();
});

buyPowerButton.addEventListener("click", () => {
  purchasePowerUpgrade();
});

buyLifeButton.addEventListener("click", () => {
  purchaseLife();
});

buyLuckButton.addEventListener("click", () => {
  purchaseLuckUpgrade();
});

populateLevelSelect();
render();
