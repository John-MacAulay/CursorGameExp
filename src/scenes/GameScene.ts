import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
    private backgrounds: Phaser.GameObjects.Sprite[] = [];
    private player!: Phaser.GameObjects.Sprite;
    private coins: Phaser.GameObjects.Sprite[] = [];
    private taxMan?: Phaser.GameObjects.Sprite;
    private taxManHitbox?: Phaser.GameObjects.Rectangle;
    private score: number = 0;
    private scoreText!: Phaser.GameObjects.Text;
    private scoreTimer!: Phaser.Time.TimerEvent;
    private scrollSpeed: number = 2;
    private spaceKey!: Phaser.Input.Keyboard.Key;
    private isJumping: boolean = false;
    private gravity: number = 200;
    private groundY: number = 0;
    private jumpStartTime: number = 0;
    private maxJumpDuration: number = 800;
    private jumpProgress: number = 0;
    private jumpStep: number = 0.05;
    private jumpHeight: number = 400;
    private backgroundKeys: string[] = ['background1', 'background2', 'background3'];
    private playerAnimationTimer!: Phaser.Time.TimerEvent;
    private coinAnimationTimer!: Phaser.Time.TimerEvent;
    private coinSpawnTimer!: Phaser.Time.TimerEvent;
    private taxManTimer!: Phaser.Time.TimerEvent;
    private currentPlayerFrame: number = 1;
    private currentCoinFrame: number = 1;
    private minTaxManSpeed: number = 7; // Minimum speed
    private maxTaxManSpeed: number = 10; // Maximum speed
    private gameOver: boolean = false;
    private debugMode: boolean = false; // Disable debug mode

    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        // Load game assets
        this.load.image('player1', '/assets/player.png');
        this.load.image('player2', '/assets/player2.png');
        this.load.image('coin1', '/assets/coin1.png');
        this.load.image('coin2', '/assets/coin2.png');
        this.load.image('taxman', '/assets/tax-man.png');
        this.load.image('background1', '/assets/backgroundImage1.png');
        this.load.image('background2', '/assets/backgroundImage2.png');
        this.load.image('background3', '/assets/backgroundImage3.png');
    }

    create() {
        // Create scrolling backgrounds
        this.createBackgrounds();

        // Create a player sprite - positioned lower on the screen
        this.player = this.add.sprite(100, this.scale.height * 0.9, 'player1');
        this.player.setScale(0.2);
        
        // Store the ground Y position
        this.groundY = this.player.y;

        // Set up keyboard controls
        if (this.input.keyboard) {
            this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        }

        // Add some text to show controls
        this.add.text(16, 16, 'Press SPACE to jump', {
            fontSize: '18px',
            color: '#ffffff'
        });

        // Initialize score display
        this.score = 0;
        this.scoreText = this.add.text(this.scale.width - 16, 16, 'Score: 0', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(1, 0);

        // Create timers
        this.setupTimers();
    }

    setupTimers() {
        // Score timer
        this.scoreTimer = this.time.addEvent({
            delay: 1000,
            callback: this.updateScore,
            callbackScope: this,
            loop: true
        });

        // Player animation timer
        this.playerAnimationTimer = this.time.addEvent({
            delay: 500,
            callback: this.updatePlayerAnimation,
            callbackScope: this,
            loop: true
        });

        // Coin animation timer
        this.coinAnimationTimer = this.time.addEvent({
            delay: 300,
            callback: this.updateCoinAnimations,
            callbackScope: this,
            loop: true
        });

        // Coin spawn timer
        this.coinSpawnTimer = this.time.addEvent({
            delay: 3500,
            callback: this.spawnCoin,
            callbackScope: this,
            loop: true
        });

        // Tax man spawn timer (random intervals between 5-10 seconds)
        this.spawnTaxMan();
    }

    spawnTaxMan() {
        // Only spawn if no tax man exists and game is not over
        if (!this.taxMan && !this.gameOver) {
            this.taxMan = this.add.sprite(this.scale.width + 50, this.groundY, 'taxman');
            this.taxMan.setScale(0.15);
            
            // Create a smaller hitbox for the tax man
            const hitboxWidth = this.taxMan.width * 0.03;
            const hitboxHeight = this.taxMan.height * 0.08;
            this.taxManHitbox = this.add.rectangle(
                this.taxMan.x,
                this.taxMan.y,
                hitboxWidth,
                hitboxHeight
            );
            this.taxManHitbox.setOrigin(0.5);
            this.taxManHitbox.setVisible(false);
            
            // Set up next spawn after much longer random delay (8-12 minutes)
            const nextSpawnDelay = Phaser.Math.Between(480000, 720000);
            this.taxManTimer = this.time.addEvent({
                delay: nextSpawnDelay,
                callback: this.spawnTaxMan,
                callbackScope: this,
                loop: false
            });
        }
    }

    updateTaxMan() {
        if (this.taxMan && this.taxManHitbox && !this.gameOver) {
            // Move tax man towards player with random speed between min and max
            const currentSpeed = Phaser.Math.Between(this.minTaxManSpeed, this.maxTaxManSpeed);
            this.taxMan.x -= currentSpeed;
            this.taxManHitbox.x = this.taxMan.x;
            this.taxManHitbox.y = this.taxMan.y;

            // Check for collision with player using the hitbox
            if (Phaser.Geom.Intersects.RectangleToRectangle(
                this.player.getBounds(),
                this.taxManHitbox.getBounds()
            )) {
                if (this.debugMode) {
                    console.log('Collision detected!');
                    console.log('Player bounds:', this.player.getBounds());
                    console.log('TaxMan hitbox bounds:', this.taxManHitbox.getBounds());
                }
                this.endGame();
            }

            // Remove tax man if off screen
            if (this.taxMan.x < -50) {
                this.taxMan.destroy();
                this.taxManHitbox.destroy();
                this.taxMan = undefined;
                this.taxManHitbox = undefined;
                this.spawnTaxMan(); // Set up next spawn
            }
        }
    }

    endGame() {
        this.gameOver = true;
        
        // Stop all timers
        this.scoreTimer.destroy();
        this.playerAnimationTimer.destroy();
        this.coinAnimationTimer.destroy();
        this.coinSpawnTimer.destroy();
        if (this.taxManTimer) this.taxManTimer.destroy();
        if (this.taxManHitbox) this.taxManHitbox.destroy();

        // Display game over text
        const gameOverText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'Game Over!', {
            fontSize: '48px',
            color: '#ff0000'
        }).setOrigin(0.5);

        const finalScoreText = this.add.text(this.scale.width / 2, this.scale.height / 2 + 60, `Final Score: ${this.score}`, {
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Add restart instructions
        const restartText = this.add.text(this.scale.width / 2, this.scale.height / 2 + 120, 'Refresh to play again', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);
    }

    spawnCoin() {
        // Calculate random height between top of screen and ground level
        const minHeight = this.scale.height * 0.2; // 20% from top
        const maxHeight = this.groundY - 50; // Slightly above ground
        const randomY = Phaser.Math.Between(minHeight, maxHeight);

        // Create coin at the right edge of the screen
        const coin = this.add.sprite(this.scale.width + 50, randomY, 'coin1');
        coin.setScale(0.15); // Adjust scale as needed
        this.coins.push(coin);
    }

    updateCoinAnimations() {
        this.currentCoinFrame = this.currentCoinFrame === 1 ? 2 : 1;
        this.coins.forEach(coin => {
            coin.setTexture(`coin${this.currentCoinFrame}`);
        });
    }

    updateCoins() {
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            coin.x -= this.scrollSpeed;

            // Remove coins that are off screen
            if (coin.x < -50) {
                coin.destroy();
                this.coins.splice(i, 1);
            }

            // Check for collision with player
            if (Phaser.Geom.Intersects.RectangleToRectangle(
                this.player.getBounds(),
                coin.getBounds()
            )) {
                this.score += 25; // Increased points per coin to 25
                this.scoreText.setText(`Score: ${this.score}`);
                coin.destroy();
                this.coins.splice(i, 1);
            }
        }
    }

    updatePlayerAnimation() {
        if (!this.isJumping) {
            this.currentPlayerFrame = this.currentPlayerFrame === 1 ? 2 : 1;
            this.player.setTexture(`player${this.currentPlayerFrame}`);
        }
    }

    update() {
        if (this.gameOver) return;

        // Update background positions
        this.updateBackgrounds();

        // Update coins
        this.updateCoins();

        // Update tax man
        this.updateTaxMan();

        // Handle jumping
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && !this.isJumping) {
            this.isJumping = true;
            this.jumpStartTime = this.time.now;
            this.jumpProgress = 0;
        }

        // Apply gravity when jumping
        if (this.isJumping) {
            if (this.jumpProgress < 1) {
                this.jumpProgress += this.jumpStep;
                const targetY = this.groundY - (this.jumpHeight * this.jumpProgress);
                this.player.y = targetY;
            }
            
            this.player.y += this.gravity * (1/60);

            if (this.player.y >= this.groundY) {
                this.player.y = this.groundY;
                this.isJumping = false;
                this.jumpProgress = 0;
            }
        }
    }

    createBackgrounds() {
        // Clear existing backgrounds
        this.backgrounds.forEach(bg => bg.destroy());
        this.backgrounds = [];

        // Create backgrounds in sequence
        this.backgroundKeys.forEach((key, index) => {
            const bg = this.add.sprite(index * this.scale.width, 0, key)
                .setOrigin(0, 1); // Set origin to bottom-left corner
            bg.displayWidth = this.scale.width;
            bg.displayHeight = this.scale.height;
            // Position at the bottom of the screen
            bg.y = this.scale.height;
            this.backgrounds.push(bg);
        });
    }

    updateBackgrounds() {
        this.backgrounds.forEach(bg => {
            // Move background to the left
            bg.x -= this.scrollSpeed;

            // If background has moved completely off screen to the left
            if (bg.x <= -this.scale.width) {
                // Find the rightmost background
                const rightmostBg = this.backgrounds.reduce((prev, current) => 
                    (current.x > prev.x) ? current : prev
                );
                // Place this background right after the rightmost one
                bg.x = rightmostBg.x + this.scale.width;
            }
        });
    }

    updateScore() {
        this.score += 1;
        this.scoreText.setText(`Score: ${this.score}`);
    }
} 