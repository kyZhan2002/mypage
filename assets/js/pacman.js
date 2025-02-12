const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const CELL_SIZE = 16;
const PACMAN_SIZE = CELL_SIZE * 0.8;
let pacmanX = CELL_SIZE * 14;
let pacmanY = CELL_SIZE * 23;
let pacmanDirection = 0;
let gameLoop;

const MAZE_LAYOUT = [
    "WWWWWWWWWWWWWWWWWWWWWWWWWWWW",
    "W............WW............W",
    "W.WWWW.WWWW.WW.WWWW.WWWW.W",
    "W.WWWW.WWWW.WW.WWWW.WWWW.W",
    "W.WWWW.WWWW.WW.WWWW.WWWW.W",
    "W..........................W",
    "W.WWWW.WW.WWWWWW.WW.WWWW.W",
    "W.WWWW.WW.WWWWWW.WW.WWWW.W",
    "W......WW....WW....WW....W",
    "WWWWWW.WWWW  WW WWWW.WWWWW",
    "WWWWWW.WW          WW.WWWWW",
    "WWWWWW.WW WWW--WWW WW.WWWWW",
    "      .   WGGGGGGW   .     ",
    "WWWWWW.WW WWWWWWWW WW.WWWWW",
    "WWWWWW.WW          WW.WWWWW",
    "WWWWWW.WW WWWWWWWW WW.WWWWW",
    "W............WW............W",
    "W.WWWW.WWWW.WW.WWWW.WWWW.W",
    "W...WW................WW..W",
    "WWW.WW.WW.WWWWWW.WW.WW.WWW",
    "W......WW....WW....WW....W",
    "W.WWWWWWWWWW.WW.WWWWWWWW.W",
    "W.WWWWWWWWWW.WW.WWWWWWWW.W",
    "W..........................W",
    "WWWWWWWWWWWWWWWWWWWWWWWWWW"
];

const GHOST_COLORS = ['red', 'pink', 'cyan', 'orange'];

class Ghost {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.direction = 'right';
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x * CELL_SIZE + CELL_SIZE/2, 
                this.y * CELL_SIZE + CELL_SIZE/2, 
                PACMAN_SIZE/2, 0, Math.PI * 2);
        ctx.fill();
    }

    move(pacmanX, pacmanY) {
        // Simple ghost AI - move towards Pacman
        const dx = Math.floor(pacmanX/CELL_SIZE) - this.x;
        const dy = Math.floor(pacmanY/CELL_SIZE) - this.y;
        
        if (Math.random() < 0.8) { // 80% chance to chase Pacman
            if (Math.abs(dx) > Math.abs(dy)) {
                this.x += Math.sign(dx);
            } else {
                this.y += Math.sign(dy);
            }
        } else { // 20% chance to move randomly
            const directions = [[0,1], [0,-1], [1,0], [-1,0]];
            const [mx, my] = directions[Math.floor(Math.random() * 4)];
            if (!isWall(this.x + mx, this.y + my)) {
                this.x += mx;
                this.y += my;
            }
        }
    }
}

let ghosts = [];
let dots = [];
let score = 0;

function initGame() {
    // Initialize dots
    dots = [];
    for(let y = 0; y < MAZE_LAYOUT.length; y++) {
        for(let x = 0; x < MAZE_LAYOUT[0].length; x++) {
            if(MAZE_LAYOUT[y][x] === '.') {
                dots.push({x, y});
            }
        }
    }

    // Initialize ghosts
    ghosts = GHOST_COLORS.map((color, i) => 
        new Ghost(13 + i, 11, color)
    );
}

function drawMaze() {
    for(let y = 0; y < MAZE_LAYOUT.length; y++) {
        for(let x = 0; x < MAZE_LAYOUT[0].length; x++) {
            if(MAZE_LAYOUT[y][x] === 'W') {
                ctx.fillStyle = 'blue';
                ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
        }
    }
}

function drawDots() {
    ctx.fillStyle = 'white';
    dots.forEach(dot => {
        ctx.beginPath();
        ctx.arc(dot.x * CELL_SIZE + CELL_SIZE/2, 
                dot.y * CELL_SIZE + CELL_SIZE/2, 2, 0, Math.PI * 2);
        ctx.fill();
    });
}

function isWall(x, y) {
    return MAZE_LAYOUT[y] && MAZE_LAYOUT[y][x] === 'W';
}

function update() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawMaze();
    drawDots();
    drawPacman();
    
    // Update ghosts
    ghosts.forEach(ghost => {
        ghost.move(pacmanX, pacmanY);
        ghost.draw();
        
        // Check collision with Pacman
        const dx = Math.abs(ghost.x * CELL_SIZE + CELL_SIZE/2 - pacmanX);
        const dy = Math.abs(ghost.y * CELL_SIZE + CELL_SIZE/2 - pacmanY);
        if(dx < CELL_SIZE/2 && dy < CELL_SIZE/2) {
            gameOver();
        }
    });
    
    // Check dot collection
    const pacmanGridX = Math.floor(pacmanX/CELL_SIZE);
    const pacmanGridY = Math.floor(pacmanY/CELL_SIZE);
    dots = dots.filter(dot => {
        if(dot.x === pacmanGridX && dot.y === pacmanGridY) {
            score += 10;
            return false;
        }
        return true;
    });
    
    // Win condition
    if(dots.length === 0) {
        alert('You Win! Score: ' + score);
        startGame();
    }
    
    // Display score
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText('Score: ' + score, 10, 20);
}

function gameOver() {
    clearInterval(gameLoop);
    alert('Game Over! Score: ' + score);
    startGame();
}

function startGame() {
    if (gameLoop) clearInterval(gameLoop);
    pacmanX = CELL_SIZE * 14;
    pacmanY = CELL_SIZE * 23;
    score = 0;
    initGame();
    gameLoop = setInterval(update, 50);
}

function drawPacman() {
    ctx.beginPath();
    ctx.arc(pacmanX, pacmanY, PACMAN_SIZE/2, 0.2 * Math.PI + pacmanDirection, 1.8 * Math.PI + pacmanDirection);
    ctx.lineTo(pacmanX, pacmanY);
    ctx.fillStyle = 'yellow';
    ctx.fill();
    ctx.closePath();
}

// Update keydown event handler to prevent wall collision
document.addEventListener('keydown', (e) => {
    const SPEED = 4;
    let newX = pacmanX;
    let newY = pacmanY;
    
    switch(e.key) {
        case 'ArrowLeft':
            newX -= SPEED;
            pacmanDirection = Math.PI;
            break;
        case 'ArrowRight':
            newX += SPEED;
            pacmanDirection = 0;
            break;
        case 'ArrowUp':
            newY -= SPEED;
            pacmanDirection = -Math.PI/2;
            break;
        case 'ArrowDown':
            newY += SPEED;
            pacmanDirection = Math.PI/2;
            break;
    }
    
    // Check wall collision
    if(!isWall(Math.floor(newX/CELL_SIZE), Math.floor(newY/CELL_SIZE))) {
        pacmanX = newX;
        pacmanY = newY;
    }
});