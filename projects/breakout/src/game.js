const canvas = document.querySelector("#game-canvas");
const context = canvas.getContext("2d");
const scoreElement = document.querySelector("#score");
const currencyElement = document.querySelector("#currency-score");
const currentUsernameElement = document.querySelector("#current-username");
const bestScoreElement = document.querySelector("#best-score");
const livesElement = document.querySelector("#lives");
const levelElement = document.querySelector("#level");
const powerElement = document.querySelector("#power");
const statusElement = document.querySelector("#status");
const dailyStatusElement = document.querySelector("#daily-status");
const levelSelect = document.querySelector("#level-select");
const dailyButton = document.querySelector("#daily-button");
const saveButton = document.querySelector("#save-button");
const loadButton = document.querySelector("#load-button");
const resetButton = document.querySelector("#reset-button");
const startButton = document.querySelector("#start-button");
const restartButton = document.querySelector("#restart-button");
const buyPaddleButton = document.querySelector("#buy-paddle");
const buyPowerButton = document.querySelector("#buy-power");
const buyLifeButton = document.querySelector("#buy-life");
const buyMultiballButton = document.querySelector("#buy-multiball");
const buyLuckButton = document.querySelector("#buy-luck");
const buyLightningButton = document.querySelector("#buy-lightning");
const shopPaddleDetail = document.querySelector("#shop-paddle-detail");
const shopPowerDetail = document.querySelector("#shop-power-detail");
const shopLifeDetail = document.querySelector("#shop-life-detail");
const shopMultiballDetail = document.querySelector("#shop-multiball-detail");
const shopLuckDetail = document.querySelector("#shop-luck-detail");
const shopLightningDetail = document.querySelector("#shop-lightning-detail");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const PADDLE_WIDTH = 70;
const PADDLE_HEIGHT = 10;
const PADDLE_SPEED = 340;
const BALL_RADIUS = 6;
const BASE_BALL_SPEED = 230;
const POWER_UP_SPEED = 96;
const LIGHTNING_BALL_SPEED = 280;
const BRICK_HEIGHT = 14;
const BRICK_PADDING = 4;
const BRICK_OFFSET_LEFT = 14;
const AMBIENT_DROP_INTERVAL = 3;
const MULTI_BALL_DROP_RATE = 0.01;
const DOUBLE_HIT_DROP_RATE = 0.006;
const SAFETY_NET_DROP_RATE = 0.004;
const LIGHTNING_DROP_RATE = 0.004;
const DOUBLE_HIT_DURATION = 10;
const DOUBLE_HIT_EXTENSION = 5;
const SAFETY_NET_DURATION = 5;
const BOSS_WARNING_DURATION = 2.4;
const PHASE_FLASH_DURATION = 1.3;
const BOSS_TELEGRAPH_DURATION = 0.7;
const BEST_SCORE_KEY = "breakout-best-score";
const CURRENCY_KEY = "breakout-currency-score";
const UNLOCKED_LEVEL_KEY = "breakout-unlocked-level";
const UPGRADE_STATE_KEY = "breakout-upgrades";
const DAILY_PROGRESS_KEY = "breakout-daily-progress";
const SAVE_PREFIX = "breakout-save-";
const PADDLE_UPGRADE_COST = 3000;
const POWER_UPGRADE_COST = 10000;
const LIFE_UPGRADE_COST = 5000;
const MULTIBALL_SHOP_COST = 2000;
const LUCK_UPGRADE_COST = 5000;
const LIGHTNING_UPGRADE_COST = 3000;
const PADDLE_UPGRADE_CAP = 10;
const POWER_UPGRADE_CAP = 3;
const LUCK_UPGRADE_CAP = 10;
const LIGHTNING_UPGRADE_CAP = 10;
const DAILY_BONUS_COINS = 2000;
const COMBO_TARGET = 50;
const COMBO_BONUS_COINS = 500;
const BASE_LIGHTNING_BALL_COUNT = 15;
const LIGHTNING_BALLS_PER_LEVEL = 10;

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
  {
    name: "Big Wall",
    offsetTop: 92,
    layout: [
      [8, 8, 8, 9, 10, 10, 9, 8, 8, 8],
      [7, 8, 8, 8, 0, 0, 8, 8, 8, 7],
      [6, 8, 8, 7, 0, 0, 7, 8, 8, 6],
      [5, 8, 8, 6, 8, 8, 6, 8, 8, 5],
      [4, 8, 8, 5, 0, 0, 5, 8, 8, 4],
      [3, 8, 8, 4, 8, 8, 4, 8, 8, 3],
      [2, 8, 8, 3, 8, 8, 3, 8, 8, 2],
    ],
  },
  {
    name: "Saw Teeth",
    offsetTop: 74,
    layout: [
      [0, 0, 9, 0, 11, 11, 0, 9, 0, 0],
      [0, 9, 10, 12, 0, 0, 12, 10, 9, 0],
      [8, 10, 12, 14, 4, 4, 14, 12, 10, 8],
      [0, 9, 11, 13, 0, 0, 13, 11, 9, 0],
      [0, 0, 10, 0, 12, 12, 0, 10, 0, 0],
    ],
  },
  {
    name: "Split Reactor",
    offsetTop: 54,
    layout: [
      [10, 0, 11, 0, 14, 14, 0, 11, 0, 10],
      [11, 0, 12, 0, 16, 16, 0, 12, 0, 11],
      [12, 4, 13, 0, 18, 18, 0, 13, 4, 12],
      [13, 5, 14, 0, 20, 20, 0, 14, 5, 13],
      [12, 4, 13, 0, 18, 18, 0, 13, 4, 12],
      [11, 0, 12, 0, 16, 16, 0, 12, 0, 11],
    ],
  },
  {
    name: "Warden Core",
    boss: true,
    offsetTop: 44,
    layout: [
      [0, 0, 0, 12, 16, 16, 12, 0, 0, 0],
      [0, 12, 16, 20, 24, 24, 20, 16, 12, 0],
      [10, 14, 0, 22, 28, 28, 22, 0, 14, 10],
      [12, 16, 0, 24, 36, 36, 24, 0, 16, 12],
      [14, 18, 20, 28, 40, 40, 28, 20, 18, 14],
      [12, 16, 0, 24, 36, 36, 24, 0, 16, 12],
      [10, 14, 0, 22, 28, 28, 22, 0, 14, 10],
      [0, 12, 16, 20, 24, 24, 20, 16, 12, 0],
      [0, 0, 0, 12, 16, 16, 12, 0, 0, 0],
    ],
  },
  {
    name: "Side Vault",
    offsetTop: 98,
    layout: [
      [14, 0, 0, 10, 0, 0, 10, 0, 0, 14],
      [15, 0, 0, 12, 0, 0, 12, 0, 0, 15],
      [16, 0, 0, 14, 18, 18, 14, 0, 0, 16],
      [17, 0, 0, 15, 20, 20, 15, 0, 0, 17],
      [18, 8, 0, 16, 0, 0, 16, 0, 8, 18],
      [19, 10, 12, 17, 0, 0, 17, 12, 10, 19],
    ],
  },
  {
    name: "Prism Steps",
    offsetTop: 64,
    layout: [
      [0, 0, 11, 12, 13, 13, 12, 11, 0, 0],
      [0, 12, 13, 14, 15, 15, 14, 13, 12, 0],
      [11, 13, 15, 17, 19, 19, 17, 15, 13, 11],
      [0, 12, 14, 16, 18, 18, 16, 14, 12, 0],
      [0, 0, 13, 15, 17, 17, 15, 13, 0, 0],
      [0, 0, 0, 14, 16, 16, 14, 0, 0, 0],
    ],
  },
  {
    name: "Tunnels",
    offsetTop: 86,
    layout: [
      [12, 12, 0, 16, 0, 0, 16, 0, 12, 12],
      [13, 13, 0, 17, 0, 0, 17, 0, 13, 13],
      [14, 14, 0, 18, 20, 20, 18, 0, 14, 14],
      [15, 15, 0, 19, 0, 0, 19, 0, 15, 15],
      [16, 16, 0, 20, 22, 22, 20, 0, 16, 16],
      [17, 17, 0, 21, 0, 0, 21, 0, 17, 17],
    ],
  },
  {
    name: "Iron Crown",
    offsetTop: 44,
    layout: [
      [0, 14, 16, 18, 21, 21, 18, 16, 14, 0],
      [14, 0, 18, 0, 23, 23, 0, 18, 0, 14],
      [16, 18, 20, 12, 24, 24, 12, 20, 18, 16],
      [0, 19, 21, 15, 25, 25, 15, 21, 19, 0],
      [0, 0, 17, 19, 22, 22, 19, 17, 0, 0],
    ],
  },
  {
    name: "Spiral Lock",
    offsetTop: 60,
    layout: [
      [20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
      [0, 0, 0, 0, 0, 0, 0, 0, 11, 10],
      [18, 19, 20, 21, 22, 23, 24, 0, 10, 9],
      [17, 0, 0, 0, 0, 0, 25, 0, 9, 8],
      [16, 15, 14, 13, 12, 0, 24, 0, 8, 7],
      [0, 0, 0, 0, 11, 0, 23, 22, 21, 20],
    ],
  },
  {
    name: "Pressure Dome",
    offsetTop: 54,
    layout: [
      [0, 0, 15, 18, 21, 21, 18, 15, 0, 0],
      [0, 16, 19, 22, 24, 24, 22, 19, 16, 0],
      [15, 18, 22, 25, 0, 0, 25, 22, 18, 15],
      [0, 16, 19, 23, 25, 25, 23, 19, 16, 0],
      [0, 0, 15, 18, 21, 21, 18, 15, 0, 0],
      [0, 14, 17, 21, 24, 24, 21, 17, 14, 0],
      [13, 15, 18, 22, 0, 0, 22, 18, 15, 13],
      [0, 12, 15, 19, 21, 21, 19, 15, 12, 0],
    ],
  },
  {
    name: "Crossfire",
    offsetTop: 38,
    layout: [
      [0, 0, 18, 0, 22, 22, 0, 18, 0, 0],
      [0, 0, 19, 0, 23, 23, 0, 19, 0, 0],
      [18, 19, 20, 21, 24, 24, 21, 20, 19, 18],
      [0, 0, 20, 0, 25, 25, 0, 20, 0, 0],
      [0, 0, 21, 0, 24, 24, 0, 21, 0, 0],
      [0, 0, 22, 23, 25, 25, 23, 22, 0, 0],
      [0, 0, 21, 0, 24, 24, 0, 21, 0, 0],
      [18, 19, 20, 22, 23, 23, 22, 20, 19, 18],
      [0, 17, 19, 0, 22, 22, 0, 19, 17, 0],
    ],
  },
  {
    name: "Cathedral",
    offsetTop: 34,
    layout: [
      [0, 0, 0, 18, 22, 22, 18, 0, 0, 0],
      [0, 0, 18, 20, 24, 24, 20, 18, 0, 0],
      [0, 18, 20, 22, 25, 25, 22, 20, 18, 0],
      [18, 20, 22, 24, 25, 25, 24, 22, 20, 18],
      [16, 0, 0, 21, 24, 24, 21, 0, 0, 16],
      [14, 0, 0, 19, 23, 23, 19, 0, 0, 14],
      [12, 12, 14, 18, 20, 20, 18, 14, 12, 12],
      [10, 10, 12, 16, 18, 18, 16, 12, 10, 10],
      [8, 0, 0, 14, 16, 16, 14, 0, 0, 8],
    ],
  },
  {
    name: "Final Circuit",
    offsetTop: 36,
    layout: [
      [25, 0, 23, 0, 21, 21, 0, 23, 0, 25],
      [0, 24, 0, 22, 0, 0, 22, 0, 24, 0],
      [23, 0, 25, 0, 24, 24, 0, 25, 0, 23],
      [0, 22, 0, 24, 25, 25, 24, 0, 22, 0],
      [21, 0, 24, 25, 0, 0, 25, 24, 0, 21],
      [0, 20, 0, 23, 24, 24, 23, 0, 20, 0],
      [19, 18, 20, 22, 23, 23, 22, 20, 18, 19],
      [0, 17, 0, 21, 22, 22, 21, 0, 17, 0],
      [18, 19, 21, 23, 24, 24, 23, 21, 19, 18],
      [20, 0, 22, 24, 25, 25, 24, 22, 0, 20],
    ],
  },
  {
    name: "Crimson Sovereign",
    boss: true,
    offsetTop: 28,
    layout: [
      [0, 0, 18, 24, 30, 30, 24, 18, 0, 0],
      [0, 20, 26, 32, 38, 38, 32, 26, 20, 0],
      [18, 24, 0, 36, 44, 44, 36, 0, 24, 18],
      [22, 0, 30, 40, 52, 52, 40, 30, 0, 22],
      [24, 28, 34, 46, 60, 60, 46, 34, 28, 24],
      [22, 0, 30, 40, 52, 52, 40, 30, 0, 22],
      [18, 24, 0, 36, 44, 44, 36, 0, 24, 18],
      [0, 20, 26, 32, 38, 38, 32, 26, 20, 0],
      [0, 0, 18, 24, 30, 30, 24, 18, 0, 0],
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
  const dailyChallenge = buildDailyChallenge();
  return {
    mode: "campaign",
    currentUsername: null,
    score: 0,
    currency: getCurrency(),
    lives: 3,
    levelIndex: 0,
    levelName: LEVELS[0].name,
    unlockedLevel,
    upgrades,
    dailyChallenge,
    dailyStage: 0,
    isRunning: false,
    isPaused: false,
    isGameOver: false,
    isWin: false,
    isBossWarning: false,
    bossWarningSeen: false,
    bossWarningTimer: 0,
    bossPhase: 0,
    bossAttackTimer: 0,
    phaseFlashTimer: 0,
    phaseFlashLabel: "",
    doubleHitLevel: 1,
    doubleHitTimer: 0,
    safetyNetTimer: 0,
    ambientDropTimer: 0,
    paddle: {
      x: (WIDTH - getPaddleWidth(upgrades)) / 2,
      y: HEIGHT - 28,
      width: getPaddleWidth(upgrades),
      height: PADDLE_HEIGHT,
    },
    balls: [createBall()],
    lightningBalls: [],
    bricks: createBricks(LEVELS[0], 0),
    powerUps: [],
    bossHazards: [],
    floatingTexts: [],
  };
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRng(seed) {
  let stateSeed = seed >>> 0;
  return () => {
    stateSeed = (stateSeed + 0x6d2b79f5) | 0;
    let value = Math.imul(stateSeed ^ (stateSeed >>> 15), 1 | stateSeed);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function generateDailyLevel(dayKey, stageIndex) {
  const seed = hashString(`${dayKey}-daily-${stageIndex}`);
  const random = createRng(seed);
  const rows = stageIndex === 0 ? 7 : 8;
  const cols = 10;
  const base = stageIndex === 0 ? 5 : 9;
  const peak = stageIndex === 0 ? 14 : 20;
  const layout = [];

  for (let row = 0; row < rows; row += 1) {
    const nextRow = [];
    for (let col = 0; col < cols; col += 1) {
      const centerDistance = Math.abs(col - (cols - 1) / 2);
      const rowBias = row / Math.max(1, rows - 1);
      const holeChance = stageIndex === 0 ? 0.18 : 0.12;
      if (random() < holeChance && centerDistance > 1.4) {
        nextRow.push(0);
        continue;
      }

      const shapeBias = Math.max(0, 1 - centerDistance / 5);
      const value = base + Math.round(shapeBias * 4 + rowBias * (peak - base) + random() * 4);
      nextRow.push(clamp(value, 1, peak));
    }
    layout.push(nextRow);
  }

  const mirrored = layout.map((row) => {
    const result = [...row];
    for (let col = 0; col < Math.floor(cols / 2); col += 1) {
      result[cols - 1 - col] = row[col];
    }
    return result;
  });

  if (stageIndex === 0) {
    mirrored[rows - 1][4] = 0;
    mirrored[rows - 1][5] = 0;
  } else {
    mirrored[0][4] = 0;
    mirrored[0][5] = 0;
    mirrored[rows - 1][3] = Math.max(mirrored[rows - 1][3], 12);
    mirrored[rows - 1][6] = Math.max(mirrored[rows - 1][6], 12);
  }

  return {
    name: `Daily ${stageIndex + 1}`,
    offsetTop: stageIndex === 0 ? 52 : 42,
    layout: mirrored,
    seedLabel: `${dayKey} / ${stageIndex + 1}`,
  };
}

function getDailyProgress() {
  const raw = window.localStorage.getItem(DAILY_PROGRESS_KEY);
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function setDailyProgress(progress) {
  window.localStorage.setItem(DAILY_PROGRESS_KEY, JSON.stringify(progress));
}

function normalizeUsername(username) {
  return username.trim().toLowerCase();
}

function getSaveKey(username) {
  return `${SAVE_PREFIX}${normalizeUsername(username)}`;
}

function buildDailyChallenge() {
  const dayKey = getTodayKey();
  const progress = getDailyProgress()[dayKey] ?? { clearedStages: 0, rewardClaimed: false };
  return {
    dayKey,
    levels: [generateDailyLevel(dayKey, 0), generateDailyLevel(dayKey, 1)],
    clearedStages: progress.clearedStages ?? 0,
    rewardClaimed: Boolean(progress.rewardClaimed),
  };
}

function syncDailyChallenge() {
  const progress = getDailyProgress();
  progress[state.dailyChallenge.dayKey] = {
    clearedStages: state.dailyChallenge.clearedStages,
    rewardClaimed: state.dailyChallenge.rewardClaimed,
  };
  setDailyProgress(progress);
}

function getActiveLevel() {
  if (state.mode === "daily") {
    return state.dailyChallenge.levels[state.dailyStage];
  }
  return LEVELS[state.levelIndex];
}

function serializeState() {
  return {
    mode: state.mode,
    score: state.score,
    currency: state.currency,
    lives: state.lives,
    levelIndex: state.levelIndex,
    levelName: state.levelName,
    unlockedLevel: state.unlockedLevel,
    upgrades: structuredClone(state.upgrades),
    dailyChallenge: structuredClone(state.dailyChallenge),
    dailyStage: state.dailyStage,
    isGameOver: state.isGameOver,
    isWin: state.isWin,
    bossWarningSeen: state.bossWarningSeen,
    bossPhase: state.bossPhase,
    bossAttackTimer: state.bossAttackTimer,
    phaseFlashLabel: state.phaseFlashLabel,
    doubleHitLevel: state.doubleHitLevel,
    doubleHitTimer: state.doubleHitTimer,
    safetyNetTimer: state.safetyNetTimer,
    ambientDropTimer: state.ambientDropTimer,
    paddle: structuredClone(state.paddle),
    balls: structuredClone(state.balls),
    lightningBalls: structuredClone(state.lightningBalls),
    bricks: structuredClone(state.bricks),
    powerUps: structuredClone(state.powerUps),
    bossHazards: structuredClone(state.bossHazards),
    floatingTexts: structuredClone(state.floatingTexts),
    bestScore: getBestScore(),
    dailyProgress: getDailyProgress(),
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function setStatusMessage(message) {
  statusElement.textContent = message;
}

function setStatusWithUsername(prefix, username, suffix = "") {
  statusElement.innerHTML = `${escapeHtml(prefix)}<span class="username-highlight">${escapeHtml(username)}</span>${escapeHtml(suffix)}`;
}

function saveGame() {
  const username = window.prompt("Enter a username to save this Breakout progress:");
  if (!username || !username.trim()) {
    return;
  }

  const trimmedUsername = username.trim();
  state.currentUsername = trimmedUsername;

  const snapshot = {
    username: trimmedUsername,
    savedAt: new Date().toISOString(),
    data: serializeState(),
  };

  window.localStorage.setItem(getSaveKey(username), JSON.stringify(snapshot));
  persistUpgradeState();
  window.localStorage.setItem(UNLOCKED_LEVEL_KEY, String(state.unlockedLevel));
  window.localStorage.setItem(BEST_SCORE_KEY, String(getBestScore()));
  window.localStorage.setItem(CURRENCY_KEY, String(state.currency));
  syncDailyChallenge();
  setStatusWithUsername("Saved progress for ", trimmedUsername, ".");
  render();
}

function restoreState(snapshot) {
  const restored = snapshot.data;
  state.currentUsername = snapshot.username ?? null;
  window.localStorage.setItem(CURRENCY_KEY, String(restored.currency));
  window.localStorage.setItem(UNLOCKED_LEVEL_KEY, String(restored.unlockedLevel));
  window.localStorage.setItem(BEST_SCORE_KEY, String(restored.bestScore));
  window.localStorage.setItem(UPGRADE_STATE_KEY, JSON.stringify(restored.upgrades));
  setDailyProgress(restored.dailyProgress ?? {});

  state.mode = restored.mode ?? "campaign";
  state.currentUsername = snapshot.username ?? restored.currentUsername ?? null;
  state.score = restored.score ?? 0;
  state.currency = restored.currency ?? 0;
  state.lives = restored.lives ?? 3;
  state.levelIndex = restored.levelIndex ?? 0;
  state.levelName = restored.levelName ?? LEVELS[0].name;
  state.unlockedLevel = restored.unlockedLevel ?? 0;
  state.upgrades = structuredClone(
    restored.upgrades ?? {
      paddleLevels: 0,
      powerLevels: 0,
      luckLevels: 0,
      lightningLevels: 0,
      purchaseCounts: { paddle: 0, power: 0, life: 0, multiball: 0, luck: 0, lightning: 0 },
    },
  );
  state.dailyChallenge = structuredClone(restored.dailyChallenge ?? buildDailyChallenge());
  state.dailyStage = restored.dailyStage ?? 0;
  state.isRunning = false;
  state.isPaused = false;
  state.isBossWarning = false;
  state.isGameOver = Boolean(restored.isGameOver);
  state.isWin = Boolean(restored.isWin);
  state.bossWarningSeen = Boolean(restored.bossWarningSeen);
  state.bossWarningTimer = 0;
  state.bossPhase = restored.bossPhase ?? 0;
  state.bossAttackTimer = restored.bossAttackTimer ?? 0;
  state.phaseFlashTimer = 0;
  state.phaseFlashLabel = restored.phaseFlashLabel ?? "";
  state.doubleHitLevel = restored.doubleHitLevel ?? 1;
  state.doubleHitTimer = restored.doubleHitTimer ?? 0;
  state.safetyNetTimer = restored.safetyNetTimer ?? 0;
  state.ambientDropTimer = restored.ambientDropTimer ?? 0;
  state.paddle = structuredClone(restored.paddle ?? createInitialState().paddle);
  state.balls = structuredClone(restored.balls ?? [createBall()]);
  state.lightningBalls = structuredClone(restored.lightningBalls ?? []);
  state.bricks = structuredClone(restored.bricks ?? createBricks(getActiveLevel(), state.levelIndex));
  state.powerUps = structuredClone(restored.powerUps ?? []);
  state.bossHazards = structuredClone(restored.bossHazards ?? []);
  state.floatingTexts = structuredClone(restored.floatingTexts ?? []);

  populateLevelSelect();
  if (state.mode === "daily") {
    levelSelect.value = String(state.levelIndex);
  }
}

function loadGame() {
  const username = window.prompt("Enter the username to load:");
  if (!username || !username.trim()) {
    return;
  }

  const trimmedUsername = username.trim();

  const raw = window.localStorage.getItem(getSaveKey(username));
  if (!raw) {
    setStatusWithUsername("No save found for ", trimmedUsername, ".");
    render();
    return;
  }

  try {
    const snapshot = JSON.parse(raw);
    stopAnimation();
    restoreState(snapshot);
    setStatusWithUsername("Loaded ", snapshot.username, ". Press Start to continue.");
    render();
  } catch {
    setStatusWithUsername("Save data for ", trimmedUsername, " is invalid.");
    render();
  }
}

function resetPersistentProgress() {
  window.localStorage.removeItem(CURRENCY_KEY);
  window.localStorage.removeItem(BEST_SCORE_KEY);
  window.localStorage.removeItem(UNLOCKED_LEVEL_KEY);
  window.localStorage.removeItem(UPGRADE_STATE_KEY);
  window.localStorage.removeItem(DAILY_PROGRESS_KEY);
}

function resetCurrentProfile() {
  if (!state.currentUsername) {
    setStatusMessage("Load or save a username first, then reset that profile.");
    render();
    return;
  }

  const confirmed = window.confirm(`Reset all progress for ${state.currentUsername}?`);
  if (!confirmed) {
    return;
  }

  window.localStorage.removeItem(getSaveKey(state.currentUsername));
  resetPersistentProgress();
  const username = state.currentUsername;
  resetGame();
  state.currentUsername = username;
  setStatusWithUsername("Reset progress for ", username, ".");
  render();
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
    return {
      paddleLevels: 0,
      powerLevels: 0,
      luckLevels: 0,
      lightningLevels: 0,
      purchaseCounts: { paddle: 0, power: 0, life: 0, multiball: 0, luck: 0, lightning: 0 },
    };
  }

  try {
    const parsed = JSON.parse(stored);
    return {
      paddleLevels: Number(parsed.paddleLevels) || 0,
      powerLevels: Number(parsed.powerLevels) || 0,
      luckLevels: Number(parsed.luckLevels) || 0,
      lightningLevels: Number(parsed.lightningLevels) || 0,
      purchaseCounts: {
        paddle: Number(parsed.purchaseCounts?.paddle) || 0,
        power: Number(parsed.purchaseCounts?.power) || 0,
        life: Number(parsed.purchaseCounts?.life) || 0,
        multiball: Number(parsed.purchaseCounts?.multiball) || 0,
        luck: Number(parsed.purchaseCounts?.luck) || 0,
        lightning: Number(parsed.purchaseCounts?.lightning) || 0,
      },
    };
  } catch {
    return {
      paddleLevels: 0,
      powerLevels: 0,
      luckLevels: 0,
      lightningLevels: 0,
      purchaseCounts: { paddle: 0, power: 0, life: 0, multiball: 0, luck: 0, lightning: 0 },
    };
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
  const temporaryBonus = state.doubleHitTimer > 0 ? state.doubleHitLevel - 1 : 0;
  return 1 + state.upgrades.powerLevels + temporaryBonus;
}

function currentDropMultiplier() {
  return 1 + state.upgrades.luckLevels * 0.1;
}

function currentLightningBallCount() {
  return BASE_LIGHTNING_BALL_COUNT + state.upgrades.lightningLevels * LIGHTNING_BALLS_PER_LEVEL;
}

function getScaledCost(baseCost, itemKey) {
  const purchases = Number(state.upgrades.purchaseCounts?.[itemKey]) || 0;
  return baseCost * (purchases + 1);
}

function recordPurchase(itemKey) {
  state.upgrades.purchaseCounts[itemKey] = (Number(state.upgrades.purchaseCounts[itemKey]) || 0) + 1;
  persistUpgradeState();
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

  const cost = getScaledCost(PADDLE_UPGRADE_COST, "paddle");
  if (!spendCurrency(cost)) {
    return;
  }

  state.upgrades.paddleLevels += 1;
  recordPurchase("paddle");
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

  const cost = getScaledCost(POWER_UPGRADE_COST, "power");
  if (!spendCurrency(cost)) {
    return;
  }

  state.upgrades.powerLevels += 1;
  recordPurchase("power");
  statusElement.textContent = "Ball power upgraded. Permanent damage increased by 1.";
  render();
}

function purchaseLife() {
  const cost = getScaledCost(LIFE_UPGRADE_COST, "life");
  if (!spendCurrency(cost)) {
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
    state.floatingTexts = [];
    state.doubleHitLevel = 1;
    state.doubleHitTimer = 0;
    state.safetyNetTimer = 0;
    statusElement.textContent = "Extra life purchased. Press Start to relaunch.";
  } else {
    statusElement.textContent = `Extra life purchased. Lives: ${state.lives}.`;
  }

  recordPurchase("life");
  render();
}

function purchaseShopMultiball() {
  const cost = getScaledCost(MULTIBALL_SHOP_COST, "multiball");
  if (!spendCurrency(cost)) {
    return;
  }

  addExtraBall();
  recordPurchase("multiball");
  statusElement.textContent = "Shop purchase: extra ball added.";
  render();
}

function purchaseLuckUpgrade() {
  if (state.upgrades.luckLevels >= LUCK_UPGRADE_CAP) {
    statusElement.textContent = "Drop rate boost is already at max level.";
    render();
    return;
  }

  const cost = getScaledCost(LUCK_UPGRADE_COST, "luck");
  if (!spendCurrency(cost)) {
    return;
  }

  state.upgrades.luckLevels += 1;
  recordPurchase("luck");
  statusElement.textContent = "Luck upgraded. All base drop rates increased by 10%.";
  render();
}

function purchaseLightningUpgrade() {
  if (state.upgrades.lightningLevels >= LIGHTNING_UPGRADE_CAP) {
    statusElement.textContent = "Lightning volley is already at max level.";
    render();
    return;
  }

  const cost = getScaledCost(LIGHTNING_UPGRADE_COST, "lightning");
  if (!spendCurrency(cost)) {
    return;
  }

  state.upgrades.lightningLevels += 1;
  recordPurchase("lightning");
  statusElement.textContent = "Lightning volley upgraded. Future lightning power-ups release 10 more bolts.";
  render();
}

function populateLevelSelect() {
  levelSelect.innerHTML = "";
  for (let index = 0; index <= state.unlockedLevel; index += 1) {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = `Level ${index + 1}: ${LEVELS[index].name}`;
    levelSelect.append(option);
  }
  levelSelect.value = String(state.levelIndex);
}

function isBossLevel(levelIndex = null) {
  if (levelIndex === null && state.mode === "daily") {
    return false;
  }
  const targetLevel = levelIndex ?? state.levelIndex;
  return Boolean(LEVELS[targetLevel]?.boss);
}

function getBossConfig(levelIndex = null) {
  if (!isBossLevel(levelIndex)) {
    return null;
  }

  const targetLevel = levelIndex ?? state.levelIndex;

  if (targetLevel === 9) {
    return {
      id: "warden-core",
      coreCells: new Set(["4,4", "4,5"]),
      exposeArmorCount: 12,
    };
  }

  if (targetLevel === 19) {
    return {
      id: "crimson-sovereign",
      coreCells: new Set(["4,4", "4,5"]),
      conduitCells: new Set(["3,4", "3,5", "5,4", "5,5", "4,3", "4,6"]),
      exposeConduitsArmorCount: 16,
    };
  }

  return null;
}

function getBossAttackProfile() {
  const bossConfig = getBossConfig();
  if (!bossConfig) {
    return null;
  }

  if (bossConfig.id === "warden-core") {
    if (state.bossPhase >= 2) {
      return {
        kind: "meteor",
        interval: 2.9,
        count: 2,
        speed: 210,
        radius: 11,
        spread: 210,
      };
    }

    return {
      kind: "meteor",
      interval: 4.2,
      count: 1,
      speed: 180,
      radius: 10,
      spread: 0,
    };
  }

  if (bossConfig.id === "crimson-sovereign") {
    if (state.bossPhase >= 3) {
      return {
        kind: "ember",
        interval: 2.1,
        count: 4,
        speed: 245,
        radius: 11,
        spread: 270,
      };
    }

    if (state.bossPhase >= 2) {
      return {
        kind: "ember",
        interval: 2.7,
        count: 3,
        speed: 220,
        radius: 10,
        spread: 220,
      };
    }

    return {
      kind: "ember",
      interval: 3.4,
      count: 2,
      speed: 195,
      radius: 9,
      spread: 160,
    };
  }

  return null;
}

function resetBossAttacks() {
  state.bossAttackTimer = 0;
  state.bossHazards = [];
}

function createBossHazard(profile, x) {
  return {
    kind: profile.kind,
    x,
    y: 20,
    radius: profile.radius,
    vy: profile.speed,
    mode: "telegraph",
    timer: BOSS_TELEGRAPH_DURATION,
  };
}

function spawnBossAttack(profile) {
  const centerX = state.paddle.x + state.paddle.width / 2;
  const positions = [];

  if (profile.count === 1) {
    positions.push(clamp(centerX + (Math.random() - 0.5) * 90, 24, WIDTH - 24));
  } else {
    const leftEdge = centerX - profile.spread / 2;
    const step = profile.count === 1 ? 0 : profile.spread / (profile.count - 1);
    for (let index = 0; index < profile.count; index += 1) {
      const jitter = (Math.random() - 0.5) * 28;
      positions.push(clamp(leftEdge + step * index + jitter, 24, WIDTH - 24));
    }
  }

  for (const x of positions) {
    state.bossHazards.push(createBossHazard(profile, x));
  }

  state.bossAttackTimer = profile.interval;
}

function getBrickSpecial(levelIndex, row, col) {
  const bossConfig = getBossConfig(levelIndex);
  if (!bossConfig) {
    return null;
  }

  const cell = `${row},${col}`;
  if (bossConfig.coreCells.has(cell)) {
    return "boss-core";
  }
  if (bossConfig.conduitCells?.has(cell)) {
    return "boss-conduit";
  }
  return "boss-armor";
}

function createBall() {
  return {
    x: WIDTH / 2,
    y: HEIGHT - 44,
    vx: 0,
    vy: 0,
    radius: BALL_RADIUS,
    isLaunched: false,
    streak: 0,
  };
}

function launchBall(ball, direction = 1) {
  ball.vx = BASE_BALL_SPEED * 0.72 * direction;
  ball.vy = -BASE_BALL_SPEED;
  ball.isLaunched = true;
}

function createBricks(level, levelIndex = state.levelIndex) {
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
        special: getBrickSpecial(levelIndex, row, col),
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
  state.mode = "campaign";
  state.levelIndex = levelIndex;
  state.levelName = LEVELS[levelIndex].name;
  state.bricks = createBricks(LEVELS[levelIndex], levelIndex);
  state.powerUps = [];
  state.balls = [createBall()];
  state.lightningBalls = [];
  state.floatingTexts = [];
  state.isBossWarning = false;
  state.bossWarningSeen = false;
  state.bossWarningTimer = 0;
  state.bossPhase = isBossLevel(levelIndex) ? 1 : 0;
  resetBossAttacks();
  state.phaseFlashTimer = 0;
  state.phaseFlashLabel = "";
  state.doubleHitLevel = 1;
  state.doubleHitTimer = 0;
  state.safetyNetTimer = 0;
  state.ambientDropTimer = 0;
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
  statusElement.textContent = isBossLevel(levelIndex)
    ? `Boss Level ${levelIndex + 1}: ${state.levelName}. Press Start to trigger warning.`
    : `Level ${levelIndex + 1}: ${state.levelName}. Press Start to launch.`;
}

function loadDailyLevel(stageIndex, keepScore = false, keepLives = false) {
  state.mode = "daily";
  state.dailyChallenge = buildDailyChallenge();
  state.dailyStage = stageIndex;
  state.levelName = state.dailyChallenge.levels[stageIndex].name;
  state.bricks = createBricks(state.dailyChallenge.levels[stageIndex], stageIndex);
  state.powerUps = [];
  state.balls = [createBall()];
  state.lightningBalls = [];
  state.floatingTexts = [];
  state.isBossWarning = false;
  state.bossWarningSeen = true;
  state.bossWarningTimer = 0;
  state.bossPhase = 0;
  resetBossAttacks();
  state.phaseFlashTimer = 0;
  state.phaseFlashLabel = "";
  state.doubleHitLevel = 1;
  state.doubleHitTimer = 0;
  state.safetyNetTimer = 0;
  state.ambientDropTimer = 0;
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
  levelSelect.value = String(state.levelIndex);
  statusElement.textContent = `Daily Challenge ${stageIndex + 1}/2 ready. Press Start to launch.`;
}

function launchCurrentLevel() {
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
  if (isBossLevel()) {
    const attackProfile = getBossAttackProfile();
    state.bossAttackTimer = attackProfile ? attackProfile.interval * 0.7 : 0;
  }
  statusElement.textContent = `${state.levelName} in progress. Gold adds balls, red adds double hit, green adds a safety net, blue adds lightning.`;
}

function startBossWarning() {
  state.isBossWarning = true;
  state.bossWarningSeen = true;
  state.bossWarningTimer = BOSS_WARNING_DURATION;
  statusElement.textContent = `Warning: ${state.levelName} incoming.`;
  ensureAnimation();
}

function startGame() {
  if (state.isBossWarning) {
    return;
  }

  if (isBossLevel() && !state.bossWarningSeen) {
    startBossWarning();
    return;
  }

  launchCurrentLevel();
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

  if (state.isBossWarning) {
    updateBossWarning(deltaSeconds);
  } else if (!state.isPaused) {
    update(deltaSeconds);
  }
  render();

  if (state.isRunning || state.isPaused || state.isBossWarning) {
    animationId = window.requestAnimationFrame(step);
  } else {
    stopAnimation();
  }
}

function updateBossWarning(deltaSeconds) {
  state.bossWarningTimer = Math.max(0, state.bossWarningTimer - deltaSeconds);
  if (state.bossWarningTimer === 0) {
    state.isBossWarning = false;
    launchCurrentLevel();
  }
}

function update(deltaSeconds) {
  movePaddle(deltaSeconds);
  updateBalls(deltaSeconds);
  updateLightningBalls(deltaSeconds);
  updatePowerUps(deltaSeconds);
  updateBossAttacks(deltaSeconds);
  updateAmbientDrops(deltaSeconds);
  updateFloatingTexts(deltaSeconds);

  if (state.phaseFlashTimer > 0) {
    state.phaseFlashTimer = Math.max(0, state.phaseFlashTimer - deltaSeconds);
  }
  if (state.doubleHitTimer > 0) {
    state.doubleHitTimer = Math.max(0, state.doubleHitTimer - deltaSeconds);
    if (state.doubleHitTimer === 0) {
      state.doubleHitLevel = 1;
    }
  }
  if (state.safetyNetTimer > 0) {
    state.safetyNetTimer = Math.max(0, state.safetyNetTimer - deltaSeconds);
  }

  syncScoreboard();
  updateBestScore();
}

function updateBossAttacks(deltaSeconds) {
  const profile = getBossAttackProfile();
  if (!profile || !state.isRunning) {
    resetBossAttacks();
    return;
  }

  state.bossAttackTimer -= deltaSeconds;
  if (state.bossAttackTimer <= 0) {
    spawnBossAttack(profile);
  }

  const nextHazards = [];

  for (const hazard of state.bossHazards) {
    if (hazard.mode === "telegraph") {
      hazard.timer -= deltaSeconds;
      if (hazard.timer <= 0) {
        hazard.mode = "active";
        hazard.y = 26;
      }
      nextHazards.push(hazard);
      continue;
    }

    hazard.y += hazard.vy * deltaSeconds;

    let destroyed = false;
    for (const ball of state.balls) {
      const dx = ball.x - hazard.x;
      const dy = ball.y - hazard.y;
      const collisionDistance = ball.radius + hazard.radius;
      if (dx * dx + dy * dy > collisionDistance * collisionDistance) {
        continue;
      }

      ball.vy = -Math.abs(ball.vy);
      ball.vx += dx * 0.9;
      destroyed = true;
      spawnFloatingText(hazard.x, hazard.y - 12, "BLOCK");
      break;
    }

    if (destroyed) {
      continue;
    }

    const nearestX = clamp(hazard.x, state.paddle.x, state.paddle.x + state.paddle.width);
    const nearestY = clamp(hazard.y, state.paddle.y, state.paddle.y + state.paddle.height);
    const paddleDx = hazard.x - nearestX;
    const paddleDy = hazard.y - nearestY;
    if (paddleDx * paddleDx + paddleDy * paddleDy <= hazard.radius * hazard.radius) {
      spawnFloatingText(hazard.x, state.paddle.y - 10, "HIT");
      handleLifeLost();
      return;
    }

    if (hazard.y - hazard.radius <= HEIGHT + 12) {
      nextHazards.push(hazard);
    }
  }

  state.bossHazards = nextHazards;
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
  ball.streak = 0;
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

    if (!canDamageBrick(brick)) {
      bounceBallFromBrick(ball, dx, dy);
      return;
    }

    const damage = currentDamage();
    brick.hitsRemaining = Math.max(0, brick.hitsRemaining - damage);
    awardScore(10 * damage);
    maybeDropPowerUp(brick);
    bounceBallFromBrick(ball, dx, dy);
    registerBrickHitCombo(ball);

    if (brick.hitsRemaining <= 0) {
      awardScore(10);
      maybeDropPowerUp(brick);
    }

    updateBossPhase();

    return;
  }
}

function bounceBallFromBrick(ball, dx, dy) {
  if (Math.abs(dx) > Math.abs(dy)) {
    ball.vx *= -1;
  } else {
    ball.vy *= -1;
  }
}

function canDamageBrick(brick) {
  if (!brick.special || !isBossLevel()) {
    return true;
  }

  if (brick.special === "boss-armor") {
    return true;
  }

  const bossConfig = getBossConfig();
  if (brick.special === "boss-core") {
    if (bossConfig?.id === "warden-core") {
      return state.bossPhase >= 2;
    }
    if (bossConfig?.id === "crimson-sovereign") {
      return state.bossPhase >= 3;
    }
  }

  if (brick.special === "boss-conduit") {
    return state.bossPhase >= 2;
  }

  return true;
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
  return maybeSpawnPowerUp(brick.x + brick.width / 2, brick.y + brick.height / 2);
}

function maybeSpawnPowerUp(x, y) {
  const roll = Math.random();
  let type = null;

  const dropMultiplier = currentDropMultiplier();
  const lightningRate = LIGHTNING_DROP_RATE * dropMultiplier;
  const safetyRate = SAFETY_NET_DROP_RATE * dropMultiplier;
  const doubleHitRate = DOUBLE_HIT_DROP_RATE * dropMultiplier;
  const multiBallRate = MULTI_BALL_DROP_RATE * dropMultiplier;
  const lightningThreshold = lightningRate;
  const safetyThreshold = lightningThreshold + safetyRate;
  const doubleHitThreshold = safetyThreshold + doubleHitRate;
  const multiBallThreshold = doubleHitThreshold + multiBallRate;

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
    return false;
  }

  state.powerUps.push({
    type,
    x,
    y,
    size: 12,
    vy: POWER_UP_SPEED,
  });

  return true;
}

function registerBrickHitCombo(ball) {
  ball.streak = (ball.streak ?? 0) + 1;
  if (ball.streak < COMBO_TARGET) {
    return;
  }

  ball.streak = 0;
  setCurrency(state.currency + COMBO_BONUS_COINS);
  addExtraBall({ suppressStatus: true });
  spawnFloatingText(ball.x, ball.y - 14, `Combo +${COMBO_BONUS_COINS}`);
  statusElement.textContent = `Combo reward: +${COMBO_BONUS_COINS} coins and an extra ball.`;
}

function spawnFloatingText(x, y, text) {
  state.floatingTexts.push({
    x,
    y,
    text,
    ttl: 1.2,
  });
}

function updateFloatingTexts(deltaSeconds) {
  state.floatingTexts = state.floatingTexts
    .map((floatingText) => ({
      ...floatingText,
      y: floatingText.y - 26 * deltaSeconds,
      ttl: floatingText.ttl - deltaSeconds,
    }))
    .filter((floatingText) => floatingText.ttl > 0);
}

function updateAmbientDrops(deltaSeconds) {
  state.ambientDropTimer += deltaSeconds;

  while (state.ambientDropTimer >= AMBIENT_DROP_INTERVAL) {
    state.ambientDropTimer -= AMBIENT_DROP_INTERVAL;
    const spawnX = 18 + Math.random() * (WIDTH - 36);
    maybeSpawnPowerUp(spawnX, 12);
  }
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

function addExtraBall(options = {}) {
  const { suppressStatus = false } = options;
  const ball = createBall();
  ball.x = state.paddle.x + state.paddle.width / 2;
  ball.y = state.paddle.y - ball.radius - 2;
  launchBall(ball, Math.random() > 0.5 ? 1 : -1);
  state.balls.push(ball);
  if (!suppressStatus) {
    statusElement.textContent = "Extra ball collected.";
  }
}

function activateDoubleHit() {
  if (state.doubleHitTimer > 0) {
    state.doubleHitLevel += 1;
    state.doubleHitTimer += DOUBLE_HIT_EXTENSION;
    statusElement.textContent = `Power upgraded to ${state.doubleHitLevel}x for ${Math.ceil(state.doubleHitTimer)} seconds.`;
    return;
  }

  state.doubleHitLevel = 2;
  state.doubleHitTimer = DOUBLE_HIT_DURATION;
  statusElement.textContent = "Double Hit activated at 2x for 10 seconds.";
}

function activateSafetyNet() {
  state.safetyNetTimer = SAFETY_NET_DURATION;
  statusElement.textContent = "Safety net activated for 5 seconds.";
}

function activateLightningVolley() {
  const originX = state.paddle.x + state.paddle.width / 2;
  const originY = state.paddle.y - 4;
  const count = currentLightningBallCount();
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

    if (!canDamageBrick(brick)) {
      return true;
    }

    brick.hitsRemaining = Math.max(0, brick.hitsRemaining - 1);
    awardScore(10);
    maybeDropPowerUp(brick);
    if (brick.hitsRemaining <= 0) {
      awardScore(10);
      maybeDropPowerUp(brick);
    }
    updateBossPhase();
    return true;
  }

  return false;
}

function updateBossPhase() {
  const bossConfig = getBossConfig();
  if (!bossConfig) {
    return;
  }

  const armorRemaining = state.bricks.filter(
    (brick) => brick.hitsRemaining > 0 && brick.special === "boss-armor",
  ).length;
  const conduitRemaining = state.bricks.filter(
    (brick) => brick.hitsRemaining > 0 && brick.special === "boss-conduit",
  ).length;

  if (bossConfig.id === "warden-core" && state.bossPhase === 1 && armorRemaining <= bossConfig.exposeArmorCount) {
    state.bossPhase = 2;
    state.bossAttackTimer = 0.8;
    triggerPhaseFlash("CORE EXPOSED");
    statusElement.textContent = "Warden Core armor shattered. Strike the weak core.";
    return;
  }

  if (bossConfig.id === "crimson-sovereign") {
    if (state.bossPhase === 1 && armorRemaining <= bossConfig.exposeConduitsArmorCount) {
      state.bossPhase = 2;
      state.bossAttackTimer = 0.7;
      triggerPhaseFlash("CHANNELS OPEN");
      statusElement.textContent = "Crimson Sovereign opens its conduits. Break them to reach the core.";
      return;
    }

    if (state.bossPhase === 2 && conduitRemaining === 0) {
      state.bossPhase = 3;
      state.bossAttackTimer = 0.6;
      triggerPhaseFlash("WEAK CORE");
      statusElement.textContent = "Crimson Sovereign core exposed. Finish it now.";
    }
  }
}

function triggerPhaseFlash(label) {
  state.phaseFlashTimer = PHASE_FLASH_DURATION;
  state.phaseFlashLabel = label;
}

function handleLifeLost() {
  state.lives -= 1;

  if (state.lives <= 0) {
    state.isRunning = false;
    state.isPaused = false;
    state.isBossWarning = false;
    resetBossAttacks();
    state.isGameOver = true;
    statusElement.textContent =
      state.mode === "daily" ? "Daily attempt failed. Restart to try today's seed again." : "Game over. Restart to try again.";
    return;
  }

  state.balls = [createBall()];
  state.powerUps = [];
  state.lightningBalls = [];
  state.floatingTexts = [];
  state.isBossWarning = false;
  state.bossWarningTimer = 0;
  resetBossAttacks();
  state.doubleHitLevel = 1;
  state.doubleHitTimer = 0;
  state.safetyNetTimer = 0;
  state.ambientDropTimer = 0;
  state.isRunning = false;
  state.isPaused = false;
  statusElement.textContent = `Life lost. ${state.lives} left. Press Start to relaunch.`;
}

function advanceLevel() {
  if (state.mode === "daily") {
    state.isRunning = false;
    state.isPaused = false;
    state.isBossWarning = false;
    state.powerUps = [];
    state.lightningBalls = [];
    resetBossAttacks();
    state.bossWarningTimer = 0;
    state.doubleHitLevel = 1;
    state.doubleHitTimer = 0;
    state.safetyNetTimer = 0;
    state.ambientDropTimer = 0;
    state.dailyChallenge.clearedStages = Math.max(state.dailyChallenge.clearedStages, state.dailyStage + 1);

    if (state.dailyStage === 0) {
      syncDailyChallenge();
      loadDailyLevel(1, true, true);
      return;
    }

    if (!state.dailyChallenge.rewardClaimed) {
      state.dailyChallenge.rewardClaimed = true;
      setCurrency(state.currency + DAILY_BONUS_COINS);
      syncDailyChallenge();
      state.isWin = true;
      statusElement.textContent = `Daily cleared. Bonus +${DAILY_BONUS_COINS} coins awarded.`;
      render();
      return;
    }

    syncDailyChallenge();
    state.isWin = true;
    statusElement.textContent = "Daily cleared. Bonus already claimed today.";
    render();
    return;
  }

  state.isRunning = false;
  state.isPaused = false;
  state.isBossWarning = false;
  state.powerUps = [];
  state.lightningBalls = [];
  state.floatingTexts = [];
  resetBossAttacks();
  state.bossWarningTimer = 0;
  state.doubleHitLevel = 1;
  state.doubleHitTimer = 0;
  state.safetyNetTimer = 0;
  state.ambientDropTimer = 0;

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
    labels.push(`${state.doubleHitLevel}x ${Math.ceil(state.doubleHitTimer)}s`);
  }
  if (state.safetyNetTimer > 0) {
    labels.push(`Net ${Math.ceil(state.safetyNetTimer)}s`);
  }
  return labels.length > 0 ? labels.join(" / ") : "-";
}

function syncScoreboard() {
  scoreElement.textContent = String(state.score);
  currencyElement.textContent = String(state.currency);
  currentUsernameElement.textContent = state.currentUsername ?? "Guest";
  bestScoreElement.textContent = String(getBestScore());
  livesElement.textContent = String(state.lives);
  levelElement.textContent = state.mode === "daily" ? `D${state.dailyStage + 1}` : `${state.levelIndex + 1}`;
  powerElement.textContent = currentPowerLabel();
}

function updateDailyStatus() {
  const cleared = state.dailyChallenge.clearedStages;
  const reward = state.dailyChallenge.rewardClaimed ? "bonus claimed" : "bonus pending";
  const rewardClass = state.dailyChallenge.rewardClaimed
    ? "daily-status-reward-claimed"
    : "daily-status-reward-pending";
  const stageLabel =
    state.mode === "daily" ? `playing ${state.dailyStage + 1}/2` : `best ${cleared}/2 cleared`;
  dailyStatusElement.innerHTML = [
    '<span class="daily-status-label">Daily Challenge</span>',
    `<span class="daily-status-date">${escapeHtml(state.dailyChallenge.dayKey)}</span>`,
    '<span class="daily-status-separator">:</span>',
    `<span class="daily-status-progress">${escapeHtml(stageLabel)}</span>`,
    '<span class="daily-status-separator">,</span>',
    `<span class="${rewardClass}">${escapeHtml(reward)}</span>.`,
  ].join(" ");
}

function renderShop() {
  const paddleCost = getScaledCost(PADDLE_UPGRADE_COST, "paddle");
  const powerCost = getScaledCost(POWER_UPGRADE_COST, "power");
  const lifeCost = getScaledCost(LIFE_UPGRADE_COST, "life");
  const multiballCost = getScaledCost(MULTIBALL_SHOP_COST, "multiball");
  const luckCost = getScaledCost(LUCK_UPGRADE_COST, "luck");
  const lightningCost = getScaledCost(LIGHTNING_UPGRADE_COST, "lightning");

  buyPaddleButton.querySelector(".shop-cost").textContent = String(paddleCost);
  buyPowerButton.querySelector(".shop-cost").textContent = String(powerCost);
  buyLifeButton.querySelector(".shop-cost").textContent = String(lifeCost);
  buyMultiballButton.querySelector(".shop-cost").textContent = String(multiballCost);
  buyLuckButton.querySelector(".shop-cost").textContent = String(luckCost);
  buyLightningButton.querySelector(".shop-cost").textContent = String(lightningCost);

  shopPaddleDetail.textContent = `Lv ${state.upgrades.paddleLevels}/${PADDLE_UPGRADE_CAP} • +10% permanent length`;
  shopPowerDetail.textContent = `Lv ${state.upgrades.powerLevels}/${POWER_UPGRADE_CAP} • total damage ${1 + state.upgrades.powerLevels}`;
  shopLifeDetail.textContent = `Add one life immediately • current ${state.lives}`;
  shopMultiballDetail.textContent = `Add one launched ball immediately • active ${state.balls.length}`;
  shopLuckDetail.textContent = `Lv ${state.upgrades.luckLevels}/${LUCK_UPGRADE_CAP} • +${Math.round((currentDropMultiplier() - 1) * 100)}% of base drop rates`;
  shopLightningDetail.textContent = `Lv ${state.upgrades.lightningLevels}/${LIGHTNING_UPGRADE_CAP} • volley ${currentLightningBallCount()} balls`;

  buyPaddleButton.disabled =
    state.currency < paddleCost || state.upgrades.paddleLevels >= PADDLE_UPGRADE_CAP;
  buyPowerButton.disabled =
    state.currency < powerCost || state.upgrades.powerLevels >= POWER_UPGRADE_CAP;
  buyLifeButton.disabled = state.currency < lifeCost;
  buyMultiballButton.disabled = state.currency < multiballCost;
  buyLuckButton.disabled =
    state.currency < luckCost || state.upgrades.luckLevels >= LUCK_UPGRADE_CAP;
  buyLightningButton.disabled =
    state.currency < lightningCost || state.upgrades.lightningLevels >= LIGHTNING_UPGRADE_CAP;
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

    context.fillStyle = getBrickFill(brick);
    context.fillRect(brick.x, brick.y, brick.width, brick.height);
    context.strokeStyle = getBrickStroke(brick);
    context.strokeRect(brick.x, brick.y, brick.width, brick.height);

    context.fillStyle = getBrickTextColor(brick);
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

function getBrickColor(hitsRemaining) {
  if (BRICK_COLORS[hitsRemaining]) {
    return BRICK_COLORS[hitsRemaining];
  }

  const clamped = clamp(hitsRemaining, 11, 60);
  const ratio = (clamped - 11) / 49;
  const hue = 18 - ratio * 18;
  const saturation = 52 + ratio * 26;
  const lightness = 26 - ratio * 14;
  return `hsl(${hue} ${saturation}% ${lightness}%)`;
}

function getBrickFill(brick) {
  if (!brick.special) {
    return getBrickColor(brick.hitsRemaining);
  }

  if (brick.special === "boss-armor") {
    return getBrickColor(brick.hitsRemaining);
  }

  if (brick.special === "boss-conduit") {
    return canDamageBrick(brick) ? "#6e322f" : "#54453f";
  }

  return canDamageBrick(brick) ? "#c23a32" : "#332826";
}

function getBrickStroke(brick) {
  if (!brick.special) {
    return "rgba(36, 31, 22, 0.12)";
  }

  if (brick.special === "boss-core") {
    return canDamageBrick(brick) ? "rgba(255, 232, 220, 0.9)" : "rgba(120, 105, 98, 0.7)";
  }

  if (brick.special === "boss-conduit") {
    return canDamageBrick(brick) ? "rgba(255, 210, 190, 0.85)" : "rgba(120, 105, 98, 0.6)";
  }

  return "rgba(90, 28, 24, 0.35)";
}

function getBrickTextColor(brick) {
  if (!brick.special) {
    return brick.hitsRemaining >= 12 ? "#fffaf2" : "#241f16";
  }

  return "#fffaf2";
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

function drawBossHazards() {
  for (const hazard of state.bossHazards) {
    if (hazard.mode === "telegraph") {
      context.strokeStyle =
        hazard.kind === "ember" ? "rgba(194, 58, 50, 0.5)" : "rgba(91, 129, 176, 0.48)";
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(hazard.x, 12);
      context.lineTo(hazard.x, HEIGHT - 20);
      context.stroke();

      context.fillStyle =
        hazard.kind === "ember" ? "rgba(194, 58, 50, 0.72)" : "rgba(91, 129, 176, 0.72)";
      context.beginPath();
      context.arc(hazard.x, 20, hazard.radius * 0.75, 0, Math.PI * 2);
      context.fill();
      continue;
    }

    context.fillStyle = hazard.kind === "ember" ? "#c23a32" : "#5b81b0";
    context.beginPath();
    context.arc(hazard.x, hazard.y, hazard.radius, 0, Math.PI * 2);
    context.fill();

    context.strokeStyle = "rgba(255, 244, 241, 0.75)";
    context.lineWidth = 1.4;
    context.stroke();
  }
}

function drawFloatingTexts() {
  for (const floatingText of state.floatingTexts) {
    const alpha = Math.min(1, floatingText.ttl / 1.2);
    context.fillStyle = `rgba(179, 70, 60, ${alpha})`;
    context.font = "bold 14px Avenir Next, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(floatingText.text, floatingText.x, floatingText.y);
  }
}

function drawLevelBanner() {
  context.fillStyle = "rgba(36, 31, 22, 0.55)";
  context.font = "11px Avenir Next, sans-serif";
  context.textAlign = "left";
  context.textBaseline = "top";
  const label =
    state.mode === "daily" ? `Daily ${state.dailyStage + 1}/2: ${state.levelName}` : `Level ${state.levelIndex + 1}: ${state.levelName}`;
  context.fillText(label, 12, HEIGHT - 18);
}

function render() {
  context.clearRect(0, 0, WIDTH, HEIGHT);
  context.fillStyle = "#faf6ee";
  context.fillRect(0, 0, WIDTH, HEIGHT);

  drawBricks();
  drawPaddle();
  drawSafetyNet();
  drawPowerUps();
  drawBossHazards();
  drawLightningBalls();
  for (const ball of state.balls) {
    drawBall(ball);
  }
  drawFloatingTexts();
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

  if (state.isBossWarning) {
    const pulse = 0.45 + 0.25 * Math.sin((BOSS_WARNING_DURATION - state.bossWarningTimer) * 10);
    context.fillStyle = `rgba(150, 24, 24, ${pulse})`;
    context.fillRect(0, 0, WIDTH, HEIGHT);
    context.strokeStyle = "rgba(255, 215, 215, 0.9)";
    context.lineWidth = 4;
    context.strokeRect(10, 10, WIDTH - 20, HEIGHT - 20);
    context.fillStyle = "#fff4f1";
    context.font = "bold 34px Avenir Next, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("BOSS WARNING", WIDTH / 2, HEIGHT / 2 - 18);
    context.font = "bold 18px Avenir Next, sans-serif";
    context.fillText(state.levelName, WIDTH / 2, HEIGHT / 2 + 16);
  }

  if (state.phaseFlashTimer > 0) {
    const opacity = Math.min(0.5, state.phaseFlashTimer / PHASE_FLASH_DURATION);
    context.fillStyle = `rgba(168, 38, 30, ${opacity})`;
    context.fillRect(0, 0, WIDTH, HEIGHT);
    context.fillStyle = "#fff4f1";
    context.font = "bold 26px Avenir Next, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(state.phaseFlashLabel, WIDTH / 2, HEIGHT / 2);
  }

  syncScoreboard();
  updateDailyStatus();
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

    if (state.isGameOver || state.isWin || state.isBossWarning) {
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

dailyButton.addEventListener("click", () => {
  state.isRunning = false;
  state.isPaused = false;
  stopAnimation();
  loadDailyLevel(0, false, false);
  render();
});

saveButton.addEventListener("click", () => {
  saveGame();
});

loadButton.addEventListener("click", () => {
  loadGame();
});

resetButton.addEventListener("click", () => {
  resetCurrentProfile();
});

startButton.addEventListener("click", () => {
  startGame();
});

restartButton.addEventListener("click", () => {
  state.isRunning = false;
  state.isPaused = false;
  stopAnimation();
  if (state.mode === "daily") {
    loadDailyLevel(0, false, false);
  } else {
    resetGame();
  }
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

buyMultiballButton.addEventListener("click", () => {
  purchaseShopMultiball();
});

buyLuckButton.addEventListener("click", () => {
  purchaseLuckUpgrade();
});

buyLightningButton.addEventListener("click", () => {
  purchaseLightningUpgrade();
});

populateLevelSelect();
render();
