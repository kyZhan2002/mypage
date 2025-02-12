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
    "W....WW.....WW.....WW....W",
    "WWWW.WW.WWW.WW.WWW.WW.WWWW",
    "W....WW.WWW.WW.WWW.WW....W",
    "W.WWWWW.WWW.WW.WWW.WWWWW.W",
    "W......WW....WW....WW....W",
    "WWWWWW.WWWW.WW.WWWW.WWWWW",
    "     W.WW          WW.W    ",
    "WWWWWW.WW WWW--WWW WW.WWWWW",
    "      .   WGGGGGGW   .     ",
    "WWWWWW.WW WWWWWWWW WW.WWWWW",
    "     W.WW          WW.W    ",
    "WWWWWW.WW.WWWWWW.WW.WWWWW",
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
        // Convert Pac-Man position to grid coordinates
        const targetX = Math.floor(pacmanX/CELL_SIZE);
        const targetY = Math.floor(pacmanY/CELL_SIZE);
        
        if (Math.random() < 0.8) { // 80% chance to chase Pacman
            // Get all possible moves
            const possibleMoves = [];
            const directions = [[0,1], [0,-1], [1,0], [-1,0]];
            
            // Check each direction for valid moves and calculate their distance to Pacman
            directions.forEach(([dx, dy]) => {
                const newX = this.x + dx;
                const newY = this.y + dy;
                
                if (!isWall(newX, newY)) {
                    // Calculate Manhattan distance to Pac-Man from this new position
                    const distToPacman = Math.abs(targetX - newX) + Math.abs(targetY - newY);
                    possibleMoves.push({
                        x: newX,
                        y: newY,
                        dist: distToPacman
                    });
                }
            });
            
            if (possibleMoves.length > 0) {
                // Sort by distance and pick the move that gets us closest to Pac-Man
                possibleMoves.sort((a, b) => a.dist - b.dist);
                const bestMove = possibleMoves[0];
                
                // Only move if it gets us closer or maintains distance
                const currentDist = Math.abs(targetX - this.x) + Math.abs(targetY - this.y);
                if (bestMove.dist <= currentDist) {
                    this.x = bestMove.x;
                    this.y = bestMove.y;
                }
            }
        } else { // 20% random movement
            const directions = [[0,1], [0,-1], [1,0], [-1,0]];
            const validMoves = directions.filter(([dx, dy]) => !isWall(this.x + dx, this.y + dy));
            
            if (validMoves.length > 0) {
                const [dx, dy] = validMoves[Math.floor(Math.random() * validMoves.length)];
                this.x += dx;
                this.y += dy;
            }
        }
    }
}

let ghosts = [];
let dots = [];
let score = 0;
let pacmanCellX = 14;
let pacmanCellY = 23;
let frameCount = 0;
const GHOST_MOVE_DELAY = 10; // Ghosts move every 10 frames

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
    frameCount++;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawMaze();
    drawDots();
    drawPacman();
    
    // Update Pac-Man's grid position
    pacmanX = pacmanCellX * CELL_SIZE;
    pacmanY = pacmanCellY * CELL_SIZE;

    // Only move ghosts every GHOST_MOVE_DELAY frames
    if (frameCount % GHOST_MOVE_DELAY === 0) {
        ghosts.forEach(ghost => ghost.move(pacmanX, pacmanY));
    }
    
    // Check collision with Pacman
    ghosts.forEach(ghost => {
        ghost.draw();
        
        const dx = Math.abs(ghost.x * CELL_SIZE + CELL_SIZE/2 - pacmanX);
        const dy = Math.abs(ghost.y * CELL_SIZE + CELL_SIZE/2 - pacmanY);
        if(dx < CELL_SIZE/2 && dy < CELL_SIZE/2) {
            gameOver();
        }
    });
    
    // Fix dot collection using cell coordinates
    dots = dots.filter(dot => {
        if(dot.x === pacmanCellX && dot.y === pacmanCellY) {
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

// Improve Pac-Man alignment
function drawPacman() {
    const centerX = Math.floor(pacmanCellX) * CELL_SIZE + CELL_SIZE/2;
    const centerY = Math.floor(pacmanCellY) * CELL_SIZE + CELL_SIZE/2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, PACMAN_SIZE/2, 0.2 * Math.PI + pacmanDirection, 1.8 * Math.PI + pacmanDirection);
    ctx.lineTo(centerX, centerY);
    ctx.fillStyle = 'yellow';
    ctx.fill();
    ctx.closePath();
}

function moveGhost(ghost) {
    const dx = pacmanCellX - ghost.x;
    const dy = pacmanCellY - ghost.y;
    let newX = ghost.x;
    let newY = ghost.y;
    
    if (Math.random() < 0.8) {
        // More aggressive ghost AI
        if (Math.abs(dx) > Math.abs(dy)) {
            newX += Math.sign(dx);
            if (isWall(newX, ghost.y)) {
                newY += Math.sign(dy);
            }
        } else {
            newY += Math.sign(dy);
            if (isWall(ghost.x, newY)) {
                newX += Math.sign(dx);
            }
        }
    } else {
        // Random movement with wall checking
        const directions = [[0,1], [0,-1], [1,0], [-1,0]];
        const validMoves = directions.filter(([mx, my]) => !isWall(ghost.x + mx, ghost.y + my));
        
        if (validMoves.length > 0) {
            const [mx, my] = validMoves[Math.floor(Math.random() * validMoves.length)];
            newX = ghost.x + mx;
            newY = ghost.y + my;
        }
    }
    
    if (!isWall(newX, newY)) {
        ghost.x = newX;
        ghost.y = newY;
    }
}

// Update keydown event handler to prevent scrolling and wall collision
document.addEventListener('keydown', (e) => {
    // Prevent scrolling when using arrow keys
    if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
    }
    
    let newX = pacmanCellX;
    let newY = pacmanCellY;
    
    switch(e.key) {
        case 'ArrowLeft':
            newX--;
            pacmanDirection = Math.PI;
            break;
        case 'ArrowRight':
            newX++;
            pacmanDirection = 0;
            break;
        case 'ArrowUp':
            newY--;
            pacmanDirection = -Math.PI/2;
            break;
        case 'ArrowDown':
            newY++;
            pacmanDirection = Math.PI/2;
            break;
    }
    
    // Check wall collision
    if(!isWall(newX, newY)) {
        pacmanCellX = newX;
        pacmanCellY = newY;
    }
});