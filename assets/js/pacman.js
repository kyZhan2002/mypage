
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const CELL_SIZE = 16;
const PACMAN_SIZE = CELL_SIZE * 1.5;
let pacmanX = CELL_SIZE * 14;
let pacmanY = CELL_SIZE * 23;
let pacmanDirection = 0;
let gameLoop;

function startGame() {
    if (gameLoop) clearInterval(gameLoop);
    pacmanX = CELL_SIZE * 14;
    pacmanY = CELL_SIZE * 23;
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

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPacman();
}

document.addEventListener('keydown', (e) => {
    const SPEED = 4;
    switch(e.key) {
        case 'ArrowLeft':
            pacmanX -= SPEED;
            pacmanDirection = Math.PI;
            break;
        case 'ArrowRight':
            pacmanX += SPEED;
            pacmanDirection = 0;
            break;
        case 'ArrowUp':
            pacmanY -= SPEED;
            pacmanDirection = -Math.PI/2;
            break;
        case 'ArrowDown':
            pacmanY += SPEED;
            pacmanDirection = Math.PI/2;
            break;
    }
});