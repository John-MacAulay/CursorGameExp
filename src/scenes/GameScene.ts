import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
    private background!: Phaser.GameObjects.Rectangle;
    private player!: Phaser.GameObjects.Sprite;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        // Load game assets
        this.load.image('background', 'assets/background.png');
        this.load.image('player', 'src/assets/player.png');
    }

    create() {
        // Create a dark blue background
        this.background = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000033)
            .setOrigin(0, 0);

        // Create a player sprite
        this.player = this.add.sprite(100, this.scale.height / 2, 'player');
        this.player.setScale(0.2); // Reduced scale to make the player smaller

        // Set up keyboard controls
        this.cursors = this.input.keyboard.createCursorKeys();

        // Add some text to show controls
        this.add.text(16, 16, 'Use UP/DOWN arrows to move', {
            fontSize: '18px',
            color: '#ffffff'
        });
    }

    update() {
        // Handle player movement
        if (this.cursors.up.isDown) {
            this.player.y -= 5;
        }
        if (this.cursors.down.isDown) {
            this.player.y += 5;
        }

        // Keep player within bounds
        this.player.y = Phaser.Math.Clamp(
            this.player.y,
            this.player.height / 2,
            this.scale.height - this.player.height / 2
        );
    }
} 