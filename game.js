document.addEventListener('DOMContentLoaded', () => {
    // Game elements
    const gameContainer = document.getElementById('game-container');
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const gameOverScreen = document.getElementById('game-over');
    const scoreDisplay = document.getElementById('score-display');
    const livesDisplay = document.getElementById('lives-display');
    const levelDisplay = document.getElementById('level-display');
    const finalScoreDisplay = document.getElementById('final-score');
    const pauseDisplay = document.getElementById('pause-display');
    const player = document.getElementById('player');
    
    // Game state
    let score = 0;
    let lives = 3;
    let level = 1;
    let gameRunning = false;
    let gamePaused = false;
    let enemies = [];
    let bullets = [];
    let explosions = [];
    let stars = [];
    let keys = {};
    let enemySpawnRate = 2000; // ms
    let lastEnemySpawn = 0;
    let gameWidth = gameContainer.offsetWidth;
    let gameHeight = gameContainer.offsetHeight;
    
    // Initialize player position
    player.style.left = `${gameWidth / 2 - 30}px`;
    player.style.top = `${gameHeight - 100}px`;
    
    // Create stars for background
    function createStars() {
        for (let i = 0; i < 100; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = `${Math.random() * gameWidth}px`;
            star.style.top = `${Math.random() * gameHeight}px`;
            star.style.opacity = Math.random();
            star.style.width = `${Math.random() * 3}px`;
            star.style.height = star.style.width;
            gameScreen.appendChild(star);
            stars.push({
                element: star,
                speed: 0.2 + Math.random() * 0.8
            });
        }
    }
    
    // Move stars for parallax effect
    function moveStars() {
        stars.forEach(star => {
            let top = parseFloat(star.element.style.top);
            top += star.speed;
            if (top > gameHeight) {
                top = 0;
                star.element.style.left = `${Math.random() * gameWidth}px`;
            }
            star.element.style.top = `${top}px`;
        });
    }
    
    // Start game
    function startGame() {
        startScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        gameOverScreen.classList.add('hidden');
        
        score = 0;
        lives = 3;
        level = 1;
        scoreDisplay.textContent = `Score: ${score}`;
        livesDisplay.textContent = `Lives: ${lives}`;
        levelDisplay.textContent = `Level: ${level}`;
        
        // Clear any existing game elements
        enemies.forEach(enemy => enemy.element.remove());
        bullets.forEach(bullet => bullet.element.remove());
        explosions.forEach(explosion => explosion.element.remove());
        
        enemies = [];
        bullets = [];
        explosions = [];
        
        gameRunning = true;
        gamePaused = false;
        lastEnemySpawn = Date.now();
        
        // Start game loop
        requestAnimationFrame(gameLoop);
    }
    
    // Game loop
    function gameLoop(timestamp) {
        if (!gameRunning) return;
        
        if (gamePaused) {
            pauseDisplay.classList.remove('hidden');
            requestAnimationFrame(gameLoop);
            return;
        } else {
            pauseDisplay.classList.add('hidden');
        }
        
        movePlayer();
        moveBullets();
        moveEnemies();
        moveStars();
        checkCollisions();
        spawnEnemies();
        
        requestAnimationFrame(gameLoop);
    }
    
    // Player movement
    function movePlayer() {
        const speed = 8;
        let left = parseInt(player.style.left);
        let top = parseInt(player.style.top);
        
        if (keys['ArrowLeft'] && left > 0) {
            left -= speed;
        }
        if (keys['ArrowRight'] && left < gameWidth - 60) {
            left += speed;
        }
        if (keys['ArrowUp'] && top > 0) {
            top -= speed;
        }
        if (keys['ArrowDown'] && top < gameHeight - 80) {
            top += speed;
        }
        
        player.style.left = `${left}px`;
        player.style.top = `${top}px`;
    }
    
    // Shoot bullet
    function shoot() {
        if (gamePaused || !gameRunning) return;
        
        const bullet = document.createElement('div');
        bullet.className = 'bullet';
        const playerLeft = parseInt(player.style.left);
        const playerTop = parseInt(player.style.top);
        bullet.style.left = `${playerLeft + 27}px`;
        bullet.style.top = `${playerTop - 20}px`;
        gameScreen.appendChild(bullet);
        
        bullets.push({
            element: bullet,
            x: playerLeft + 27,
            y: playerTop - 20,
            speed: 10
        });
    }
    
    // Move bullets
    function moveBullets() {
        for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i];
            bullet.y -= bullet.speed;
            bullet.element.style.top = `${bullet.y}px`;
            
            // Remove bullet if it goes off screen
            if (bullet.y < -20) {
                bullet.element.remove();
                bullets.splice(i, 1);
            }
        }
    }
    
    // Spawn enemies
    function spawnEnemies() {
        const now = Date.now();
        if (now - lastEnemySpawn > enemySpawnRate) {
            const enemy = document.createElement('div');
            enemy.className = 'enemy';
            const x = Math.random() * (gameWidth - 50);
            enemy.style.left = `${x}px`;
            enemy.style.top = '-50px';
            gameScreen.appendChild(enemy);
            
            enemies.push({
                element: enemy,
                x: x,
                y: -50,
                speed: 2 + Math.random() * level, // Speed increases with level
                health: 1 + Math.floor(level / 3) // Health increases every 3 levels
            });
            
            lastEnemySpawn = now;
            
            // Decrease spawn rate slightly to increase difficulty
            if (enemySpawnRate > 500) {
                enemySpawnRate -= 10;
            }
        }
    }
    
    // Move enemies
    function moveEnemies() {
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            enemy.y += enemy.speed;
            enemy.element.style.top = `${enemy.y}px`;
            
            // Remove enemy if it goes off screen
            if (enemy.y > gameHeight) {
                enemy.element.remove();
                enemies.splice(i, 1);
                // Player loses a life if enemy escapes
                loseLife();
            }
        }
    }
    
    // Check collisions
    function checkCollisions() {
        // Bullet-enemy collisions
        for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i];
            for (let j = enemies.length - 1; j >= 0; j--) {
                const enemy = enemies[j];
                if (
                    bullet.x < enemy.x + 50 &&
                    bullet.x + 6 > enemy.x &&
                    bullet.y < enemy.y + 50 &&
                    bullet.y + 20 > enemy.y
                ) {
                    // Hit!
                    enemy.health--;
                    if (enemy.health <= 0) {
                        createExplosion(enemy.x, enemy.y);
                        enemy.element.remove();
                        enemies.splice(j, 1);
                        score += 10 * level;
                        scoreDisplay.textContent = `Score: ${score}`;
                    }
                    bullet.element.remove();
                    bullets.splice(i, 1);
                    break;
                }
            }
        }
        
        // Player-enemy collisions
        const playerLeft = parseInt(player.style.left);
        const playerTop = parseInt(player.style.top);
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            if (
                playerLeft < enemy.x + 50 &&
                playerLeft + 60 > enemy.x &&
                playerTop < enemy.y + 50 &&
                playerTop + 80 > enemy.y
            ) {
                // Collision!
                createExplosion(enemy.x, enemy.y);
                enemy.element.remove();
                enemies.splice(i, 1);
                loseLife();
                // Briefly make player invulnerable
                player.style.opacity = '0.5';
                setTimeout(() => {
                    if (gameRunning) player.style.opacity = '1';
                }, 1000);
                break;
            }
        }
    }
    
    // Create explosion effect
    function createExplosion(x, y) {
        const explosion = document.createElement('div');
        explosion.className = 'explosion';
        explosion.style.left = `${x - 5}px`;
        explosion.style.top = `${y - 5}px`;
        gameScreen.appendChild(explosion);
        
        explosions.push({
            element: explosion,
            createdAt: Date.now()
        });
        
        // Remove explosion after animation
        setTimeout(() => {
            explosion.remove();
            explosions = explosions.filter(e => e.element !== explosion);
        }, 500);
    }
    
    // Lose a life
    function loseLife() {
        lives--;
        livesDisplay.textContent = `Lives: ${lives}`;
        
        if (lives <= 0) {
            gameOver();
        }
    }
    
    // Level up
    function levelUp() {
        level++;
        levelDisplay.textContent = `Level: ${level}`;
        // Flash the level display
        levelDisplay.style.color = '#FFC107';
        setTimeout(() => {
            levelDisplay.style.color = '#fff';
        }, 500);
    }
    
    // Game over
    function gameOver() {
        gameRunning = false;
        finalScoreDisplay.textContent = score;
        gameOverScreen.classList.remove('hidden');
    }
    
    // Event listeners
    startBtn.addEventListener('click', () => {
        createStars();
        startGame();
    });
    
    restartBtn.addEventListener('click', startGame);
    
    document.addEventListener('keydown', (e) => {
        keys[e.key] = true;
        
        // Space to shoot
        if (e.key === ' ' && gameRunning && !gamePaused) {
            shoot();
        }
        
        // P to pause
        if (e.key === 'p' || e.key === 'P') {
            if (gameRunning) {
                gamePaused = !gamePaused;
            }
        }
    });
    
    document.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });
    
    // Level up every 100 points
    setInterval(() => {
        if (gameRunning && !gamePaused && score >= level * 100) {
            levelUp();
        }
    }, 1000);
    
    // Handle window resize
    window.addEventListener('resize', () => {
        gameWidth = gameContainer.offsetWidth;
        gameHeight = gameContainer.offsetHeight;
    });
});
