import { Scene } from 'phaser';
import { GRID_SIZE, CELL_SIZE } from '../consts';

export class Grid {
  private scene: Scene;
  private grid: (Phaser.GameObjects.Image | null)[][];
  private container: Phaser.GameObjects.Container;
  private previewContainer: Phaser.GameObjects.Container;
  
  // Bomb logic: Map 'row,col' string to { count: number, text: Phaser.GameObjects.Text }
  private bombs: Map<string, { count: number, text: Phaser.GameObjects.Text }> = new Map();

  constructor(scene: Scene, x: number, y: number) {
    this.scene = scene;
    this.grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    this.container = scene.add.container(x, y);
    this.previewContainer = scene.add.container(x, y);
    this.drawBackground();
  }

  private drawBackground() {
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const cell = this.scene.add.image(
          col * CELL_SIZE + CELL_SIZE / 2,
          row * CELL_SIZE + CELL_SIZE / 2,
          'grid_cell'
        );
        this.container.add(cell);
      }
    }
  }

  public getContainer() {
    return this.container;
  }

  public worldToGrid(x: number, y: number): { row: number, col: number } | null {
    const localX = x - this.container.x;
    const localY = y - this.container.y;

    if (localX < 0 || localY < 0 || localX >= GRID_SIZE * CELL_SIZE || localY >= GRID_SIZE * CELL_SIZE) {
      return null;
    }

    const col = Math.floor(localX / CELL_SIZE);
    const row = Math.floor(localY / CELL_SIZE);

    return { row, col };
  }

  public canPlace(matrix: number[][], gridRow: number, gridCol: number): boolean {
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] === 1) {
          const checkRow = gridRow + r;
          const checkCol = gridCol + c;

          if (
            checkRow < 0 ||
            checkRow >= GRID_SIZE ||
            checkCol < 0 ||
            checkCol >= GRID_SIZE ||
            this.grid[checkRow][checkCol] !== null
          ) {
            return false;
          }
        }
      }
    }
    return true;
  }

  public showPreview(matrix: number[][], gridRow: number, gridCol: number, color: number): void {
    this.clearPreview();

    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] === 1) {
          const targetRow = gridRow + r;
          const targetCol = gridCol + c;

          if (targetRow >= 0 && targetRow < GRID_SIZE && targetCol >= 0 && targetCol < GRID_SIZE) {
            const ghost = this.scene.add.image(
              targetCol * CELL_SIZE + CELL_SIZE / 2,
              targetRow * CELL_SIZE + CELL_SIZE / 2,
              'block_cell'
            );
            ghost.setTint(color);
            ghost.setAlpha(0.2); 
            ghost.setBlendMode(Phaser.BlendModes.ADD);
            this.previewContainer.add(ghost);
          }
        }
      }
    }
  }

  public clearPreview(): void {
    this.previewContainer.removeAll(true);
  }

  public placeBlock(matrix: number[][], gridRow: number, gridCol: number, color: number): void {
    this.clearPreview();
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] === 1) {
          const targetRow = gridRow + r;
          const targetCol = gridCol + c;

          const cell = this.scene.add.image(
            targetCol * CELL_SIZE + CELL_SIZE / 2,
            targetRow * CELL_SIZE + CELL_SIZE / 2,
            'block_cell'
          );
          cell.setTint(color);
          cell.setBlendMode(Phaser.BlendModes.ADD); 
          this.container.add(cell);
          this.grid[targetRow][targetCol] = cell;
        }
      }
    }
  }
  
  public addBomb(r: number, c: number, count: number): void {
      const key = `${r},${c}`;
      if (this.bombs.has(key)) return;

      const centerX = c * CELL_SIZE + CELL_SIZE / 2;
      const centerY = r * CELL_SIZE + CELL_SIZE / 2;

      // 1. Bomb Emoji Background
      const emoji = this.scene.add.text(centerX, centerY, '💣', {
          fontSize: '54px'
      }).setOrigin(0.5).setAlpha(0.7);

      // 2. Countdown Number (on top)
      const text = this.scene.add.text(
          centerX, 
          centerY + 5, 
          count.toString(), 
          { 
              fontFamily: 'Orbitron',
              fontSize: '28px', 
              color: '#fff', 
              fontStyle: 'bold', 
              stroke: '#000', 
              strokeThickness: 6 
          }
      ).setOrigin(0.5);
      
      this.container.add(emoji);
      this.container.add(text);
      this.bombs.set(key, { count, text });
      
      // @ts-ignore
      text.emojiRef = emoji;

      if (this.grid[r][c]) {
          this.grid[r][c]!.setTint(0xff0000); 
      }
  }

  public addBombToRandomCell(): boolean {
      const occupiedCells: {r: number, c: number}[] = [];
      for (let r=0; r<GRID_SIZE; r++) {
          for (let c=0; c<GRID_SIZE; c++) {
              if (this.grid[r][c] !== null && !this.bombs.has(`${r},${c}`)) {
                  occupiedCells.push({r, c});
              }
          }
      }
      
      if (occupiedCells.length === 0) return false;
      
      const target = occupiedCells[Phaser.Math.Between(0, occupiedCells.length - 1)];
      this.addBomb(target.r, target.c, 9);
      return true;
  }
  
  public tickBombs(): boolean {
      let exploded = false;
      this.bombs.forEach((bomb) => {
          bomb.count--;
          bomb.text.setText(bomb.count.toString());
          if (bomb.count <= 0) exploded = true;
      });
      return exploded;
  }

  public checkLines(): { rows: number[], cols: number[] } {
    const rowsToClear: number[] = [];
    const colsToClear: number[] = [];

    for (let r = 0; r < GRID_SIZE; r++) {
      if (this.grid[r].every(cell => cell !== null)) rowsToClear.push(r);
    }

    for (let c = 0; c < GRID_SIZE; c++) {
      let full = true;
      for (let r = 0; r < GRID_SIZE; r++) {
        if (this.grid[r][c] === null) {
          full = false;
          break;
        }
      }
      if (full) colsToClear.push(c);
    }

    return { rows: rowsToClear, cols: colsToClear };
  }

  public async clearLines(rows: number[], cols: number[]): Promise<{x: number, y: number} | null> {
    const cellsToRemove: Phaser.GameObjects.Image[] = [];
    let avgX = 0;
    let avgY = 0;

    rows.forEach(r => {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (this.grid[r][c]) cellsToRemove.push(this.grid[r][c]!);
      }
    });
    cols.forEach(c => {
      for (let r = 0; r < GRID_SIZE; r++) {
        if (this.grid[r][c]) cellsToRemove.push(this.grid[r][c]!);
      }
    });

    const uniqueCells = [...new Set(cellsToRemove)];

    if (uniqueCells.length > 0) {
      uniqueCells.forEach(c => {
          avgX += this.container.x + c.x;
          avgY += this.container.y + c.y;
      });
      avgX /= uniqueCells.length;
      avgY /= uniqueCells.length;

      this.scene.tweens.add({
        targets: uniqueCells,
        scaleX: 1.5,
        scaleY: 1.5,
        alpha: 0,
        duration: 250,
        ease: 'Cubic.easeOut',
        onComplete: () => {
          uniqueCells.forEach(cell => cell.destroy());
        }
      });

      rows.forEach(r => {
        for (let c = 0; c < GRID_SIZE; c++) {
            this.grid[r][c] = null;
            this.removeBomb(r, c);
        }
      });
      cols.forEach(c => {
        for (let r = 0; r < GRID_SIZE; r++) {
            this.grid[r][c] = null;
            this.removeBomb(r, c);
        }
      });
      
      this.createExplosion(uniqueCells);
      return { x: avgX, y: avgY };
    }
    return null;
  }
  
  private removeBomb(r: number, c: number) {
      const key = `${r},${c}`;
      if (this.bombs.has(key)) {
          const bomb = this.bombs.get(key);
          if (bomb?.text) {
              // @ts-ignore
              if (bomb.text.emojiRef) bomb.text.emojiRef.destroy();
              bomb.text.destroy();
          }
          this.bombs.delete(key);
      }
  }

  private createExplosion(cells: Phaser.GameObjects.Image[]) {
    if (cells.length === 0) return;
    cells.forEach(c => {
        const wx = this.container.x + c.x;
        const wy = this.container.y + c.y;
        const color = c.tintTopLeft;
        
        const emitter = this.scene.add.particles(wx, wy, 'shard', {
            speed: { min: 150, max: 300 },
            angle: { min: 0, max: 360 },
            scale: { start: 1.2, end: 0 },
            rotate: { min: 0, max: 360 },
            alpha: { start: 1, end: 0 },
            blendMode: 'ADD',
            lifespan: 800,
            quantity: 12,
            tint: color,
            emitting: false
        });
        emitter.explode(12);
        
        this.scene.time.delayedCall(1000, () => emitter.destroy());
    });
  }

  public isEmpty(): boolean {
      return this.grid.every(row => row.every(cell => cell === null));
  }

  public getFillRate(): number {
      let filled = 0;
      for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
              if (this.grid[r][c] !== null) filled++;
          }
      }
      return filled / (GRID_SIZE * GRID_SIZE);
  }

  // Save/Load helpers
  public serialize(): (number | null)[][] {
      return this.grid.map(row => row.map(cell => cell ? cell.tintTopLeft : null));
  }

  public deserialize(data: (number | null)[][]) {
      for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
              const tint = data[r][c];
              if (tint !== null) {
                  const cell = this.scene.add.image(
                    c * CELL_SIZE + CELL_SIZE / 2,
                    r * CELL_SIZE + CELL_SIZE / 2,
                    'block_cell'
                  );
                  cell.setTint(tint);
                  cell.setBlendMode(Phaser.BlendModes.ADD);
                  this.container.add(cell);
                  this.grid[r][c] = cell;
              }
          }
      }
  }

  public serializeBombs(): { r: number, c: number, count: number }[] {
      const b: { r: number, c: number, count: number }[] = [];
      this.bombs.forEach((val, key) => {
          const [r, c] = key.split(',').map(Number);
          b.push({ r, c, count: val.count });
      });
      return b;
  }
}
