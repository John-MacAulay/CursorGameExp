import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
    private background!: Phaser.GameObjects.TileSprite;
    private player!: Phaser.GameObjects.Sprite;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private score: number = 0;
    private scoreText!: Phaser.GameObjects.Text;
    private scoreTimer!: Phaser.Time.TimerEvent;
    private scrollSpeed: number = 2;
    private spaceKey!: Phaser.Input.Keyboard.Key;
    private isJumping: boolean = false;
    private jumpVelocity: number = -200;
    private gravity: number = 200;
    private groundY: number = 0;
    private jumpStartTime: number = 0;
    private maxJumpDuration: number = 800;
    private jumpProgress: number = 0;
    private jumpStep: number = 0.05; // Controls how quickly the player rises

    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        // Load game assets
        this.load.image('player', '/assets/player.png');
        
        // Create a temporary background texture
        const graphics = this.make.graphics({ x: 0, y: 0 });
        
        // Draw a building pattern
        graphics.fillStyle(0x2c3e50); // Dark blue-gray for buildings
        graphics.fillRect(0, 0, 200, this.scale.height);
        
        // Add windows
        graphics.fillStyle(0xf1c40f); // Yellow for windows
        for (let y = 50; y < this.scale.height - 50; y += 100) {
            for (let x = 20; x < 180; x += 40) {
                graphics.fillRect(x, y, 20, 30);
            }
        }
        
        // Generate the texture
        graphics.generateTexture('background', 200, this.scale.height);
        graphics.destroy();
    }

    create() {
        // Create a scrolling background
        this.background = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'background')
            .setOrigin(0, 0)
            .setScrollFactor(0);

        // Create a player sprite - positioned lower on the screen
        this.player = this.add.sprite(100, this.scale.height * 0.8, 'player');
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
    }

    updateScore() {
        this.score += 1;
        this.scoreText.setText(`Score: ${this.score}`);
    }

    update() {
        // Scroll the background
        this.background.tilePositionX += this.scrollSpeed;

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