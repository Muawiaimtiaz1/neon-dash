const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreElement = document.getElementById('final-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const offlineOverlay = document.getElementById('offline-overlay');

// Game State
let gameRunning = false;
let score = 0;
let frames = 0;
let gameSpeed = 5;

// Canvas Size
function resizeCanvas() {
    canvas.width = window.innerWidth > 800 ? 800 : window.innerWidth - 20;
    canvas.height = 400;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Player
const player = {
    x: 50,
    y: 0,
    width: 30,
    height: 30,
    dy: 0,
    jumpForce: 12,
    gravity: 0.6,
    grounded: false,
    color: '#00f3ff',

    draw: function () {
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
    },

    update: function () {
        // Jump
        if (input.jump && this.grounded) {
            this.dy = -this.jumpForce;
            this.grounded = false;
        }

        // Gravity
        this.y += this.dy;

        // Ground Collision
        if (this.y + this.height < canvas.height) {
            this.dy += this.gravity;
            this.grounded = false;
        } else {
            this.dy = 0;
            this.grounded = true;
            this.y = canvas.height - this.height;
        }
    }
};

// Obstacles
const obstacles = [];
const obstacleColor = '#ff00ff';

class Obstacle {
    constructor() {
        this.width = 30 + Math.random() * 20;
        this.height = 30 + Math.random() * 30;
        this.x = canvas.width;
        this.y = canvas.height - this.height;
        this.markedForDeletion = false;
    }

    update() {
        this.x -= gameSpeed;
        if (this.x + this.width < 0) this.markedForDeletion = true;
    }

    draw() {
        ctx.fillStyle = obstacleColor;
        ctx.shadowBlur = 10;
        ctx.shadowColor = obstacleColor;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
    }
}

function handleObstacles() {
    if (frames % 100 === 0) { // Spawn rate
        obstacles.push(new Obstacle());
        gameSpeed += 0.05; // Increase difficulty
    }

    for (let i = 0; i < obstacles.length; i++) {
        obstacles[i].update();
        obstacles[i].draw();

        // Collision Detection
        if (
            player.x < obstacles[i].x + obstacles[i].width &&
            player.x + player.width > obstacles[i].x &&
            player.y < obstacles[i].y + obstacles[i].height &&
            player.y + player.height > obstacles[i].y
        ) {
            gameOver();
        }
    }

    // Remove off-screen obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        if (obstacles[i].markedForDeletion) {
            obstacles.splice(i, 1);
            score++;
            scoreElement.innerText = 'Score: ' + score;
        }
    }
}

// Input Handling
const input = { jump: false };

function jump() {
    if (gameRunning) {
        input.jump = true;
        setTimeout(() => input.jump = false, 100);
    }
}

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') jump();
});
window.addEventListener('touchstart', (e) => {
    jump();
});
window.addEventListener('mousedown', (e) => {
    jump();
});

// Game Loop
function animate() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    player.update();
    player.draw();

    handleObstacles();

    frames++;
    requestAnimationFrame(animate);
}

function startGame() {
    if (!navigator.onLine) {
        alert("You must be online to play!");
        return;
    }

    gameRunning = true;
    score = 0;
    frames = 0;
    gameSpeed = 5;
    obstacles.length = 0;
    scoreElement.innerText = 'Score: 0';
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    animate();
}

function gameOver() {
    gameRunning = false;
    finalScoreElement.innerText = score;
    gameOverScreen.classList.remove('hidden');
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// --- Offline Logic ---

function checkConnectivity() {
    if (!navigator.onLine) {
        offlineOverlay.classList.remove('hidden');
        if (gameRunning) {
            gameRunning = false;
        }
    } else {
        offlineOverlay.classList.add('hidden');
    }
}

window.addEventListener('offline', checkConnectivity);
window.addEventListener('online', checkConnectivity);

// Initial check
checkConnectivity();

// --- AdMob Integration ---
// We use the AdMob plugin to show native ads.
// Documentation: https://github.com/capacitor-community/admob

// NOTE: Since we are not using a bundler (like Vite/Webpack), we cannot use 'import'.
// We access the plugin from the global Capacitor object.
const AdMob = (typeof Capacitor !== 'undefined') ? Capacitor.Plugins.AdMob : null;

async function initializeAds() {
    if (!AdMob) {
        console.error('AdMob plugin not found. Are you running on a device?');
        return;
    }

    try {
        // 1. Initialize AdMob
        await AdMob.initialize({
            requestTrackingAuthorization: true,
            initializeForTesting: false,
        });

        // 2. Show a Banner Ad
        // Real Ad Unit ID: ca-app-pub-5632443793443777/2240953865
        await AdMob.showBanner({
            adId: 'ca-app-pub-5632443793443777/2240953865',
            adSize: 'BANNER',
            position: 'BOTTOM_CENTER',
            margin: 0,
            isTesting: false // Production Mode
        });

        console.log('AdMob initialized and banner shown');

        // Hide the HTML placeholder if native ad loads
        const webAd = document.getElementById('ad-banner');
        if (webAd) webAd.style.display = 'none';

    } catch (e) {
        console.error('AdMob failed to initialize', e);
        // Fallback: The HTML placeholder in index.html will remain visible
    }
}

// Initialize ads when the app is ready
document.addEventListener('deviceready', initializeAds); // Cordova/Capacitor event
// Also try calling it directly in case 'deviceready' is missed or we are in a modern env
initializeAds();
