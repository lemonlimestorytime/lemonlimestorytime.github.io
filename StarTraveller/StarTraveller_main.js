const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('scoreDisplay');
const hpDisplay = document.getElementById('hpDisplay');

// Screen elements
const titleScreen = document.getElementById('title-screen');
const rulesScreen = document.getElementById('rules-screen');
const gameOverScreen = document.getElementById('game-over'); // Corrected this line
const finalScoreDisplay = document.getElementById('final-score');

// Buttons
const startButton = document.getElementById('startButton');
const playButton = document.getElementById('playButton');
const restartButton = document.getElementById('restartButton');

// --- Web Audio API for sound generation ---
let audioContext; // Declare audioContext globally

// Function to initialize AudioContext when the user interacts
function initAudioContext() {
    // Check if audioContext is already initialized to prevent re-creation
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log("AudioContext initialized.");
    }
}

// Function to generate and play an improved hit sound using Web Audio API
function playHitSound() {
    if (!audioContext) {
        console.warn("AudioContext not initialized. Sound will not play until user interaction.");
        return;
    }
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // Start at 440 Hz (A4)
    oscillator.frequency.exponentialRampToValueAtTime(80, audioContext.currentTime + 0.1); // Drop to 80 Hz over 0.1 seconds

    gainNode.gain.setValueAtTime(1, audioContext.currentTime); // Start at full volume
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15); // Fade out over 0.15 seconds
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.15); // Stop after the gain envelope finishes
}


// Game state variables
let player;
let obstacles = [];
let score = 0;
let hp = 3;
let gameRunning = false;
let frame = 0;
let animationFrameId;

// Player properties
const playerRadius = 20;
const playerSpeed = 8;

let movingUp = false;
let movingDown = false;

// Obstacle properties
const obstacleWidth = 30;

// Define different obstacle speed tiers and their NEW colors
const defaultObstacleSpeed = 3;
const defaultObstacleColor = 'green'; // Slow = Green

const moderateObstacleSpeed = 5;
const moderateObstacleColor = 'yellow'; // Moderately fast = Yellow

const fastObstacleSpeed = 8;
const fastObstacleColor = 'orange'; // Very fast = Orange

const crazyFastObstacleSpeed = 12;
const crazyFastObstacleColor = 'red'; // Super fast = Red

const minGapHeight = 100; // Minimum vertical gap between top and bottom obstacles
const maxGapHeight = 200; // Maximum vertical gap

// Horizontal distance between obstacle pairs
const minObstacleSpawnDistance = 250;
const maxObstacleSpawnDistance = 400;
let nextObstacleSpawnX = 0;

// --- Game State Management ---
const GAME_STATE = {
    TITLE: 'TITLE',
    RULES: 'RULES',
    PLAYING: 'PLAYING',
    GAME_OVER: 'GAME_OVER'
};
let currentState = GAME_STATE.TITLE;

function showScreen(screen) {
    titleScreen.style.display = 'none';
    rulesScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';

    canvas.style.display = 'block';
    if (scoreDisplay.parentElement) {
        scoreDisplay.parentElement.style.display = 'none';
    }

    if (screen === GAME_STATE.TITLE) {
        titleScreen.style.display = 'flex';
        canvas.style.display = 'none';
    } else if (screen === GAME_STATE.RULES) {
        rulesScreen.style.display = 'flex';
        canvas.style.display = 'none';
    } else if (screen === GAME_STATE.PLAYING) {
        if (scoreDisplay.parentElement) {
            scoreDisplay.parentElement.style.display = 'block';
        }
    } else if (screen === GAME_STATE.GAME_OVER) {
        gameOverScreen.style.display = 'flex';
        if (scoreDisplay.parentElement) {
            scoreDisplay.parentElement.style.display = 'none';
        }
    }
}

// --- Player Class ---
class Player {
    constructor() {
        this.x = 100;
        this.y = canvas.height / 2;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, playerRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'blue';
        ctx.fill();
        ctx.closePath();
    }

    update() {
        if (movingUp) {
            this.y -= playerSpeed;
        }
        if (movingDown) {
            this.y += playerSpeed;
        }

        if (this.y - playerRadius < 0) {
            this.y = playerRadius;
        }
        if (this.y + playerRadius > canvas.height) {
            this.y = canvas.height - playerRadius;
        }
    }
}

// --- Obstacle Class ---
class Obstacle {
    constructor(x, y, width, height, speed, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.passed = false;
        this.speed = speed;
        this.color = color;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update() {
        this.x -= this.speed;
    }
}

// --- Game Logic Functions ---

function initGame() {
    player = new Player();
    obstacles = [];
    score = 0;
    hp = 3;
    gameRunning = true;
    frame = 0;
    // Set the initial spawn point for the first obstacle
    // It's good to ensure it spawns far enough right to not be immediately visible
    nextObstacleSpawnX = canvas.width + Math.random() * (maxObstacleSpawnDistance - minObstacleSpawnDistance) + minObstacleSpawnDistance;


    scoreDisplay.textContent = score;
    hpDisplay.textContent = hp;

    currentState = GAME_STATE.PLAYING;
    showScreen(GAME_STATE.PLAYING);

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    gameLoop();
}

function generateObstacle() {
    const currentGapHeight = Math.random() * (maxGapHeight - minGapHeight) + minGapHeight;

    const maxGapY = canvas.height - currentGapHeight - playerRadius * 2;
    const minGapY = playerRadius * 2;
    const gapY = Math.random() * (maxGapY - minGapY) + minGapY;

    let assignedObstacleSpeed;
    let assignedObstacleColor;
    const rand = Math.random();

    // Red: 1 unit
    // Orange: 5 units (1/6 is 5 times 1/30)
    // Yellow: 10 units (2/6 is 10 times 1/30)
    // Green (original): 42 units (remaining)

    // To make Green 3x more, its units become 14 * 3 = 42
    // Total units: 1 + 5 + 10 + 42 = 58
    // So, probabilities are now based on fractions of 58.

    const redThreshold = 1 / 58; // Approx 0.0172
    const orangeThreshold = (1 + 5) / 58; // 6 / 58 = Approx 0.1034
    const yellowThreshold = (1 + 5 + 10) / 58; // 16 / 58 = Approx 0.2758

    if (rand < redThreshold) {
        assignedObstacleSpeed = crazyFastObstacleSpeed;
        assignedObstacleColor = crazyFastObstacleColor; // Red
    } else if (rand < orangeThreshold) {
        assignedObstacleSpeed = fastObstacleSpeed;
        assignedObstacleColor = fastObstacleColor; // Orange
    } else if (rand < yellowThreshold) {
        assignedObstacleSpeed = moderateObstacleSpeed;
        assignedObstacleColor = moderateObstacleColor; // Yellow
    } else {
        assignedObstacleSpeed = defaultObstacleSpeed;
        assignedObstacleColor = defaultObstacleColor; // Green
    }

    // Use nextObstacleSpawnX for the obstacle's starting X position
    obstacles.push(new Obstacle(nextObstacleSpawnX, 0, obstacleWidth, gapY, assignedObstacleSpeed, assignedObstacleColor));
    obstacles.push(new Obstacle(nextObstacleSpawnX, gapY + currentGapHeight, obstacleWidth, canvas.height - (gapY + currentGapHeight), assignedObstacleSpeed, assignedObstacleColor));

    // Calculate the spawn point for the *next* obstacle
    // This ensures variable horizontal spacing between consecutive obstacle pairs
    nextObstacleSpawnX += Math.random() * (maxObstacleSpawnDistance - minObstacleSpawnDistance) + minObstacleSpawnDistance;
}

function detectCollision(player, obstacle) {
    const playerLeft = player.x - playerRadius;
    const playerRight = player.x + playerRadius;
    const playerTop = player.y - playerRadius;
    const playerBottom = player.y + playerRadius;

    const obstacleLeft = obstacle.x;
    const obstacleRight = obstacle.x + obstacle.width;
    const obstacleTop = obstacle.y;
    const obstacleBottom = obstacle.y + obstacle.height;

    // Check for collision
    if (playerRight > obstacleLeft &&
        playerLeft < obstacleRight &&
        playerBottom > obstacleTop &&
        playerTop < obstacleBottom) {
        return true;
    }
    return false;
}

function updateGame() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    player.update();
    player.draw();

    // Obstacle generation trigger:
    // Generate a new obstacle if there are no obstacles yet, OR
    // if the 'nextObstacleSpawnX' (the target position for the new obstacle)
    // is now within the canvas view, and the rightmost obstacle has moved enough
    // to allow for a new one to start appearing.
    // This allows for continuous generation and potential overlap of obstacles,
    // making the game more dynamic.
    if (obstacles.length === 0 || (obstacles[obstacles.length - 1].x < nextObstacleSpawnX)) {
        generateObstacle();
    }


    for (let i = 0; i < obstacles.length; i++) {
        obstacles[i].update();
        obstacles[i].draw();

        if (detectCollision(player, obstacles[i])) {
            hp--;
            hpDisplay.textContent = hp;
            playHitSound(); // Call the JavaScript generated sound here!

            if (hp <= 0) {
                endGame();
            }
            obstacles.splice(i, 1);
            i--;
            continue;
        }

        if (!obstacles[i].passed && obstacles[i].x + obstacles[i].width < player.x - playerRadius) {
            score++;
            scoreDisplay.textContent = score;
            obstacles[i].passed = true;
        }

        // Remove obstacles that have gone off-screen to the left
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
            i--;
        }
    }

    frame++;
}

function endGame() {
    gameRunning = false;
    currentState = GAME_STATE.GAME_OVER;
    finalScoreDisplay.textContent = `Final Score: ${score}`;
    showScreen(GAME_STATE.GAME_OVER);
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
}

function gameLoop() {
    if (currentState === GAME_STATE.PLAYING) {
        updateGame();
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

// Event Listeners
document.addEventListener('keydown', (e) => {
    if (currentState === GAME_STATE.PLAYING) {
        if (e.key === 'ArrowUp' || e.key === 'w') {
            movingUp = true;
        } else if (e.key === 'ArrowDown' || e.key === 's') {
            movingDown = true;
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (currentState === GAME_STATE.PLAYING) {
        if (e.key === 'ArrowUp' || e.key === 'w') {
            movingUp = false;
        } else if (e.key === 'ArrowDown' || e.key === 's') {
            movingDown = false;
        }
    }
});

// Initialize AudioContext on user interaction with buttons
startButton.addEventListener('click', () => {
    initAudioContext();
    currentState = GAME_STATE.RULES;
    showScreen(GAME_STATE.RULES);
});

playButton.addEventListener('click', () => {
    initAudioContext();
    initGame();
});

restartButton.addEventListener('click', () => {
    initAudioContext();
    initGame();
});

// Initial screen setup
showScreen(GAME_STATE.TITLE);
gameLoop();