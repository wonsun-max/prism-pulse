import { Scene } from 'phaser';
import { CELL_SIZE } from '../consts';

export const SHAPES = [
  // --- Tetris Classics ---
  [[1, 1, 1, 1]], // I
  [[1, 1], [1, 1]], // O
  [[1, 1, 1], [0, 1, 0]], // T
  [[0, 1, 1], [1, 1, 0]], // S
  [[1, 1, 0], [0, 1, 1]], // Z
  [[1, 0, 0], [1, 1, 1]], // J
  [[0, 0, 1], [1, 1, 1]], // L

  // --- Block Blast Variations ---
  [[1]], // 1x1 Single
  [[1, 1]], // 1x2 Domino
  [[1], [1]], // 2x1 Domino
  [[1, 1, 1]], // 1x3 Line
  [[1], [1], [1]], // 3x1 Line
  [[1, 1], [1, 0]], // 3-block L
  [[1, 1], [0, 1]], // 3-block L (alt)
  [[1, 1, 1, 1, 1]], // 1x5 Line
  [[1, 1, 1], [1, 0, 0], [1, 0, 0]], // Large L
  [[1, 1, 1], [1, 1, 1]], // 2x3 Rectangle
  [[1, 1], [1, 1], [1, 1]], // 3x2 Rectangle
  [[1, 1, 1], [0, 1, 0], [0, 1, 0]], // Extended T
];

export class Block extends Phaser.GameObjects.Container {
  public matrix: number[][];
  public color: number;
  private originalX: number;
  private originalY: number;
  private backgroundImages: Phaser.GameObjects.Image[] = [];
  private initialTrayScale: number = 1.0;

  constructor(scene: Scene, x: number, y: number, matrix: number[][], color: number) {
    super(scene, x, y);
    this.originalX = x;
    this.originalY = y;
    this.matrix = matrix;
    this.color = color;

    this.constructVisuals();
    this.enableInput();
    
    scene.add.existing(this);
  }

  public setInitialScale(scale: number) {
    this.initialTrayScale = scale;
    this.setScale(scale);
  }

  public get size(): number {
    let count = 0;
    for (let r = 0; r < this.matrix.length; r++) {
      for (let c = 0; c < this.matrix[r].length; c++) {
        if (this.matrix[r][c] === 1) count++;
      }
    }
    return count;
  }

  private constructVisuals() {
    this.backgroundImages.forEach(img => img.destroy());
    this.backgroundImages = [];

    // Center the block visually around 0,0 for easier dragging
    const rows = this.matrix.length;
    const cols = this.matrix[0].length;
    const width = cols * CELL_SIZE;
    const height = rows * CELL_SIZE;

    const offsetX = -width / 2 + CELL_SIZE / 2;
    const offsetY = -height / 2 + CELL_SIZE / 2;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (this.matrix[r][c] === 1) {
          const cell = this.scene.add.image(
            c * CELL_SIZE + offsetX,
            r * CELL_SIZE + offsetY,
            'block_cell'
          );
          cell.setTint(this.color);
          cell.setBlendMode(Phaser.BlendModes.ADD); // Neon Glow
          this.add(cell);
          this.backgroundImages.push(cell);
        }
      }
    }
    
    // Set size for hit area - larger than visual if it's scaled down
    this.setSize(width, height);
  }

  private enableInput() {
    this.setInteractive({ draggable: true });
    this.scene.input.setDraggable(this);

    this.on('dragstart', () => {
      // Scale up to full size for the grid
      this.scene.tweens.add({
          targets: this,
          scale: 1.0,
          alpha: 0.8,
          duration: 100
      });
      // Bring to top
      this.depth = 100;
    });

    this.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      this.x = dragX;
      // Offset Y slightly while dragging so finger doesn't obscure block
      this.y = dragY - 100; 
      this.emit('dragging', this);
    });

    this.on('dragend', () => {
      this.depth = 0;
      this.emit('dropped', this);
    });
  }

  public returnToSpawn() {
    this.scene.tweens.add({
      targets: this,
      x: this.originalX,
      y: this.originalY,
      scale: this.initialTrayScale,
      alpha: 1,
      duration: 200,
      ease: 'Back.out'
    });
  }
}