import { Scene } from 'phaser';
import { COLORS, CELL_SIZE } from '../consts';

export class Preloader extends Scene {
  constructor() {
    super('Preloader');
  }

  preload() {
    // Generate textures programmatically
    this.createBlockTexture();
    this.createGridCellTexture();
    this.createParticleTexture();
    this.createPanelTexture();
    this.createButtonTexture();
    this.createMascotTexture();

    // Audio Loading
    // In Vite, public/ folder is served at root /
    // So assets/game.mp3 maps to public/assets/game.mp3
    this.load.path = 'assets/';
    this.load.audio('menu_music', 'menu.wav');
    this.load.audio('game_music', 'game.mp3');
  }

  create() {
    this.scene.start('LauncherScene');
  }

  private createBlockTexture() {
    const size = CELL_SIZE - 2; // Full size for generation
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    
    // Outer Neon Stroke (Sharp & Bright)
    graphics.lineStyle(3, 0xffffff, 1);
    graphics.strokeRect(2, 2, size - 4, size - 4);
    
    // Glassy Interior (Clean)
    graphics.fillStyle(0xffffff, 0.2);
    graphics.fillRect(2, 2, size - 4, size - 4);
    
    // Top Bevel Highlight (Premium look)
    graphics.fillStyle(0xffffff, 0.6);
    graphics.fillRect(4, 4, size - 8, 4);
    
    graphics.generateTexture('block_cell', size, size);
    graphics.destroy();
  }

  private createGridCellTexture() {
    const size = CELL_SIZE;
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });

    // Subtle Dark Frame
    graphics.lineStyle(2, 0x1f1f3a, 0.5);
    graphics.strokeRect(1, 1, size - 2, size - 2);
    
    // Deep Void Interior
    graphics.fillStyle(0x0a0a1a, 0.8);
    graphics.fillRect(2, 2, size - 4, size - 2);
    
    graphics.generateTexture('grid_cell', size, size);
    graphics.destroy();
  }

  private createParticleTexture() {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0xffffff, 1);
    // Diamond spark
    graphics.beginPath();
    graphics.moveTo(10, 0);
    graphics.lineTo(20, 10);
    graphics.lineTo(10, 20);
    graphics.lineTo(0, 10);
    graphics.closePath();
    graphics.fillPath();
    
    graphics.generateTexture('shard', 20, 20); // Keep name 'shard' to avoid breaking Grid.ts
    graphics.destroy();
  }

  private createPanelTexture() {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0xffffff, 0.1);
    graphics.fillRoundedRect(0, 0, 400, 200, 48);
    graphics.generateTexture('glass_panel', 400, 200);
    graphics.destroy();
  }

  private createButtonTexture() {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRoundedRect(0, 0, 320, 80, 28);
    graphics.generateTexture('btn_bg', 320, 80);
    graphics.destroy();
  }

  private createMascotTexture() {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.lineStyle(4, COLORS.ACCENT_CYAN, 1);
    graphics.fillStyle(COLORS.ACCENT_PURPLE, 0.5);
    graphics.beginPath();
    graphics.moveTo(64, 0);
    graphics.lineTo(128, 128);
    graphics.lineTo(0, 128);
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();
    graphics.generateTexture('mascot', 128, 128);
    graphics.destroy();
  }
}