import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
    private backgrounds: Phaser.GameObjects.Sprite[] = [];
    private player!: Phaser.GameObjects.Sprite;
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
    private backgroundKeys: string[] = ['background1', 'background2', 'background3'];
    private playerAnimationTimer!: Phaser.Time.TimerEvent;
    private currentPlayerFrame: number = 1;

    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        // Load game assets
        this.load.image('player1', '/assets/player.png');
        this.load.image('player2', '/assets/player2.png');
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

        // Create a timer that fires every second
        this.scoreTimer = this.time.addEvent({
            delay: 1000,
            callback: this.updateScore,
            callbackScope: this,
            loop: true
        });

        // Create player animation timer
        this.playerAnimationTimer = this.time.addEvent({
            delay: 500, // 500ms = half second
            callback: this.updatePlayerAnimation,
            callbackScope: this,
            loop: true
        });
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

    updatePlayerAnimation() {
        // Only animate if not jumping
        if (!this.isJumping) {
            this.currentPlayerFrame = this.currentPlayerFrame === 1 ? 2 : 1;
            this.player.setTexture(`player${this.currentPlayerFrame}`);
        }
    }

    update() {
        // Update background positions
        this.updateBackgrounds();

        // Handle jumping
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && !this.isJumping) {
            this.isJumping = true;
            this.jumpStartTime = this.time.now;
            this.jumpProgress = 0;
        }

        // Apply gravity when jumping
        if (this.isJumping) {
            // Gradually increase jump progress
            if (this.jumpProgress < 1) {
                this.jumpProgress += this.jumpStep;
                // Calculate new position based on progress
                const jumpHeight = 200; // Maximum jump height
                const targetY = this.groundY - (jumpHeight * this.jumpProgress);
                this.player.y = targetY;
            }
            
            // Always apply gravity
            this.player.y += this.gravity * (1/60);

            // Check if player has landed
            if (this.player.y >= this.groundY) {
                this.player.y = this.groundY;
                this.isJumping = false;
                this.jumpProgress = 0;
            }
        }
    }
} 