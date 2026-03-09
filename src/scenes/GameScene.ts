import { Scene } from 'phaser';
import { Grid } from '../objects/Grid';
import { Block, SHAPES } from '../objects/Block';
import { GAME_WIDTH, GAME_HEIGHT, CELL_SIZE, ANIM, THEMES, EVENTS, GAME_MODES } from '../consts';
import { Storage, GameSession } from '../utils/Storage';
import { AudioManager } from '../managers/AudioManager';

export class GameScene extends Scene {
  private grid!: Grid;
  private blocks: Block[] = [];
  private score: number = 0;
  private highScore: number = 0;
  private audio!: AudioManager;

  private currentMode: string = GAME_MODES.CLASSIC;

  // Blitz Mode State
  private blitzTimeLeft: number = 0;
  private blitzTimerEvent: Phaser.Time.TimerEvent | null = null;

  // Bomb Mode State
  private movesCount: number = 0;

  constructor() {
    super('GameScene');
  }

  init(data: { mode: string }) {
    console.log('[GameScene] Init with mode:', data?.mode);
    this.currentMode = (data && data.mode) ? data.mode : GAME_MODES.CLASSIC;
    this.score = 0;
    this.movesCount = 0;
    this.blocks = [];

    if (this.blitzTimerEvent) {
      this.blitzTimerEvent.remove();
      this.blitzTimerEvent = null;
    }
  }

  create() {
    console.log('[GameScene] Creating...');
    this.audio = new AudioManager(this);
    this.audio.stopMusic('menu_music');
    this.audio.playMusic('game_music', 0.5);

    const themeId = Storage.getCurrentThemeId();
    const currentTheme = THEMES[themeId] || THEMES.classic;

    this.cameras.main.setBackgroundColor(currentTheme.colors.background);
    this.highScore = Storage.getHighScore(this.currentMode);

    // Initialize Grid - Moved down to 280 to leave room for HUD
    this.grid = new Grid(this, (GAME_WIDTH - (8 * CELL_SIZE)) / 2, 280);

    // Tray background - Moved down to leave gap from grid
    const tray = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 200, GAME_WIDTH - 40, 200, currentTheme.colors.gridBg, 0.5);
    tray.setStrokeStyle(2, currentTheme.colors.primary, 0.3);

    // RESTORE SESSION
    const saved = Storage.getSession(this.currentMode);
    if (saved) {
      console.log('[GameScene] Restoring session, score:', saved.score);
      this.score = saved.score;
      this.movesCount = saved.movesCount;
      this.grid.deserialize(saved.grid);
      if (this.currentMode === GAME_MODES.BOMB && saved.bombs) {
        saved.bombs.forEach(b => this.grid.addBomb(b.r, b.c, b.count));
      }
      if (this.currentMode === GAME_MODES.BLITZ && saved.timeLeft !== undefined) {
        this.blitzTimeLeft = saved.timeLeft;
      } else {
        this.blitzTimeLeft = 120;
      }
      this.restoreBlocks(saved.blocks);
    } else {
      this.spawnBlocks();
      this.blitzTimeLeft = 120;
    }

    // UI Overlay - Pass initial score and high score
    if (this.scene.isActive('UIScene')) {
      this.scene.stop('UIScene');
    }
    this.scene.launch('UIScene', {
      mode: this.currentMode,
      initialScore: this.score,
      highScore: this.highScore
    });

    this.updateScore(0); // Sync initial score display and high score

    // Mode Specific Setup
    if (this.currentMode === GAME_MODES.BLITZ) {
      this.blitzTimerEvent = this.time.addEvent({
        delay: 1000,
        callback: this.updateBlitzTimer,
        callbackScope: this,
        loop: true
      });
      this.events.emit(EVENTS.TIMER_UPDATED, this.blitzTimeLeft);
    }

    this.events.off(EVENTS.RESTART_GAME);
    this.events.once(EVENTS.RESTART_GAME, () => {
      Storage.saveSession(this.currentMode, null); // Clear save on manual restart
      this.scene.restart({ mode: this.currentMode });
    });
  }

  private updateBlitzTimer() {
    this.blitzTimeLeft--;
    this.events.emit(EVENTS.TIMER_UPDATED, this.blitzTimeLeft);
    if (this.blitzTimeLeft % 5 === 0) this.saveCurrentProgress();
    if (this.blitzTimeLeft <= 0) {
      if (this.blitzTimerEvent) this.blitzTimerEvent.remove();
      this.gameOver();
    }
  }

  private restoreBlocks(savedBlocks: { matrix: number[][], color: number }[]) {
    const blockAreaY = GAME_HEIGHT - 200;
    const spacing = GAME_WIDTH / 4;
    savedBlocks.forEach((b, i) => {
      const block = new Block(this, spacing * (i + 1), blockAreaY, b.matrix, b.color);
      block.setInitialScale(0.4); // Reduced scale to prevent overlap
      block.on('dragging', (bl: Block) => this.handleBlockDragging(bl));
      block.on('dropped', (bl: Block) => this.handleBlockDrop(bl));
      this.blocks.push(block);
    });
  }

  private spawnBlocks() {
    if (this.blocks.length > 0) return;
    const blockAreaY = GAME_HEIGHT - 200;
    const spacing = GAME_WIDTH / 4;
    const themeId = Storage.getCurrentThemeId();
    const currentTheme = THEMES[themeId] || THEMES.classic;
    const availableColors = currentTheme.colors.blocks;
    const fillRate = this.grid.getFillRate();
    const smallShapes = [7, 8, 9];
    const mediumShapes = [0, 1, 2, 3, 4, 5, 6, 10, 11, 12, 13];
    const largeShapes = [14, 15, 16, 17, 18];

    for (let i = 0; i < 3; i++) {
      let shapeIdx = 0;
      if (fillRate > 0.6) {
        if (i === 0 && fillRate > 0.7) shapeIdx = smallShapes[Phaser.Math.Between(0, smallShapes.length - 1)];
        else {
          const roll = Math.random();
          if (roll < 0.5) shapeIdx = smallShapes[Phaser.Math.Between(0, smallShapes.length - 1)];
          else if (roll < 0.9) shapeIdx = mediumShapes[Phaser.Math.Between(0, mediumShapes.length - 1)];
          else shapeIdx = largeShapes[Phaser.Math.Between(0, largeShapes.length - 1)];
        }
      } else if (fillRate > 0.3) {
        const roll = Math.random();
        if (roll < 0.3) shapeIdx = smallShapes[Phaser.Math.Between(0, smallShapes.length - 1)];
        else if (roll < 0.8) shapeIdx = mediumShapes[Phaser.Math.Between(0, mediumShapes.length - 1)];
        else shapeIdx = largeShapes[Phaser.Math.Between(0, largeShapes.length - 1)];
      } else {
        const roll = Math.random();
        if (roll < 0.1) shapeIdx = smallShapes[Phaser.Math.Between(0, smallShapes.length - 1)];
        else if (roll < 0.6) shapeIdx = mediumShapes[Phaser.Math.Between(0, mediumShapes.length - 1)];
        else shapeIdx = largeShapes[Phaser.Math.Between(0, largeShapes.length - 1)];
      }
      const color = availableColors[Phaser.Math.Between(0, availableColors.length - 1)];
      const block = new Block(this, spacing * (i + 1), blockAreaY, SHAPES[shapeIdx], color as number);
      block.setInitialScale(0.4); // Reduced scale
      block.on('dragging', (b: Block) => this.handleBlockDragging(b));
      block.on('dropped', (b: Block) => this.handleBlockDrop(b));
      this.blocks.push(block);

      block.setScale(0);
      this.tweens.add({
        targets: block,
        scale: 0.4,
        duration: ANIM.SPAWN_DURATION,
        delay: i * 60,
        ease: ANIM.SPAWN_EASE
      });
    }
    this.saveCurrentProgress();
    this.checkGameOver();
  }

  private saveCurrentProgress() {
    const session: GameSession = {
      score: this.score,
      grid: this.grid.serialize(),
      blocks: this.blocks.map(b => ({ matrix: b.matrix, color: b.color })),
      movesCount: this.movesCount,
      timeLeft: this.currentMode === GAME_MODES.BLITZ ? this.blitzTimeLeft : undefined,
      bombs: this.currentMode === GAME_MODES.BOMB ? this.grid.serializeBombs() : undefined
    };
    Storage.saveSession(this.currentMode, session);
  }

  private handleBlockDragging(block: Block) {
    const dropPos = this.grid.worldToGrid(block.x, block.y);
    if (dropPos) {
      const rowOffset = Math.floor(block.matrix.length / 2);
      const colOffset = Math.floor(block.matrix[0].length / 2);
      const gridRow = dropPos.row - rowOffset;
      const gridCol = dropPos.col - colOffset;
      if (this.grid.canPlace(block.matrix, gridRow, gridCol)) {
        this.grid.showPreview(block.matrix, gridRow, gridCol, block.color);
      } else {
        this.grid.clearPreview();
      }
    } else {
      this.grid.clearPreview();
    }
  }

  private handleBlockDrop(block: Block) {
    this.grid.clearPreview();
    const dropPos = this.grid.worldToGrid(block.x, block.y);
    if (dropPos) {
      const rowOffset = Math.floor(block.matrix.length / 2);
      const colOffset = Math.floor(block.matrix[0].length / 2);
      const gridRow = dropPos.row - rowOffset;
      const gridCol = dropPos.col - colOffset;
      if (this.grid.canPlace(block.matrix, gridRow, gridCol)) {
        const blockSize = block.size;
        const dropX = block.x;
        const dropY = block.y;
        this.grid.placeBlock(block.matrix, gridRow, gridCol, block.color);
        this.audio.playPlace();

        // --- JUICE: IMPACT ---
        this.cameras.main.shake(ANIM.SHAKE_DURATION, ANIM.SHAKE_INTENSITY);

        this.blocks = this.blocks.filter(b => b !== block);
        block.destroy();
        this.onBlockPlaced(blockSize, dropX, dropY);
        return;
      }
    }
    block.returnToSpawn();
  }

  private async onBlockPlaced(placementPoints: number, x: number, y: number) {
    this.movesCount++;
    const lines = this.grid.checkLines();
    const totalLines = lines.rows.length + lines.cols.length;

    if (totalLines > 0) {
      this.audio.playClear();
      if (totalLines > 1) this.audio.playCombo(totalLines);

      // --- JUICE: CLEAR SHAKE ---
      this.cameras.main.shake(ANIM.SHAKE_DURATION * 2, ANIM.SHAKE_INTENSITY * 1.5);

      const clearPos = await this.grid.clearLines(lines.rows, lines.cols);
      const bonusPoints = (totalLines * 100) * totalLines;
      let totalGained = placementPoints + bonusPoints;

      // --- PERFECT CLEAR BONUS ---
      if (this.grid.isEmpty()) {
        totalGained += 1000;
        this.events.emit(EVENTS.SCORE_GAINED, {
          amount: 1000,
          x: GAME_WIDTH / 2,
          y: GAME_HEIGHT / 2,
          isPerfect: true
        });
      }

      this.updateScore(totalGained);
      this.events.emit(EVENTS.LINES_CLEARED, totalLines);
      if (clearPos) this.events.emit(EVENTS.SCORE_GAINED, { amount: totalGained, x: clearPos.x, y: clearPos.y });
    } else {
      this.updateScore(placementPoints);
      this.events.emit(EVENTS.SCORE_GAINED, { amount: placementPoints, x: x, y: y });
      if (this.currentMode === GAME_MODES.BOMB) this.handleBombMechanic();
    }
    if (this.currentMode === GAME_MODES.BOMB) {
      const exploded = this.grid.tickBombs();
      if (exploded) {
        this.gameOver();
        return;
      }
    }
    if (this.blocks.length === 0) {
      this.spawnBlocks();
    } else {
      this.saveCurrentProgress();
      this.checkGameOver();
    }
  }

  private handleBombMechanic() {
    if (this.movesCount % 5 === 0) {
      const added = this.grid.addBombToRandomCell();
      if (added) {
        this.events.emit(EVENTS.BOMB_SPAWNED);
        // --- JUICE: BOMB WARNING ---
        this.cameras.main.flash(200, 255, 0, 0, true);
      }
    }
  }

  private updateScore(points: number) {
    if (points > 0) {
      const pointsToAward = Math.floor(points / 100);
      if (pointsToAward > 0) {
        Storage.addPoints(pointsToAward);
      }
    }

    this.score += points;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      Storage.saveHighScore(this.currentMode, this.highScore);
    }
    this.events.emit(EVENTS.SCORE_UPDATED, this.score, this.highScore);
  }

  private checkGameOver() {
    let canPlaceAny = false;
    for (const block of this.blocks) {
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (this.grid.canPlace(block.matrix, r, c)) {
            canPlaceAny = true;
            break;
          }
        }
        if (canPlaceAny) break;
      }
      if (canPlaceAny) break;
    }
    if (!canPlaceAny && this.blocks.length > 0) this.gameOver();
  }

  private async gameOver() {

    Storage.saveSession(this.currentMode, null);

    this.audio.playGameOver();

    if (this.blitzTimerEvent) this.blitzTimerEvent.remove();



    this.events.emit(EVENTS.GAME_OVER);

  }

}

