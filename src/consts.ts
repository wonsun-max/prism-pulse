export const COLORS = {
  BACKGROUND: 0x050510,      // Deep Space Blue/Black
  GRID_BG: 0x0a0a1a,         // Slightly lighter void
  GRID_CELL: 0x151525,       // Dark slot
  
  // Neon Palette
  PRIMARY: 0x00f3ff,         // Cyan Neon
  ACCENT_CYAN: 0x00f3ff,     // Cyber Cyan
  ACCENT_PURPLE: 0xbc13fe,   // Neon Purple
  
  // Block Colors (High Saturation)
  PRISM_RED: 0xff0055,       // Hot Pink/Red
  PRISM_ORANGE: 0xff9900,    // Neon Orange
  PRISM_YELLOW: 0xffff00,    // Electric Yellow
  PRISM_GREEN: 0x00ff66,     // Toxic Green
  PRISM_BLUE: 0x00f3ff,      // Electric Blue
  PRISM_PINK: 0xff00ff,      // Magenta
  
  TEXT_MAIN: 0xffffff,
  TEXT_DIM: 0x8899aa,        // Blue-ish Gray
  GLASS_WHITE: 0xffffff,
  
  BOMB: 0xff0000,            // Pure Red
};

export const GAME_WIDTH = 720;
export const GAME_HEIGHT = 1280;
export const GRID_SIZE = 8;
export const CELL_SIZE = 82;
export const CELL_PADDING = 4;

export const EVENTS = {
  BLOCK_PLACED: 'block-placed',
  LINES_CLEARED: 'lines-cleared',
  GAME_OVER: 'game-over',
  SCORE_UPDATED: 'score-updated',
  RESTART_GAME: 'restart-game',
  TIMER_UPDATED: 'timer-updated',
  BOMB_SPAWNED: 'bomb-spawned',
  SCORE_GAINED: 'score-gained',
};

export enum GAME_MODES {
  CLASSIC = 'classic',
  BLITZ = 'blitz',
  BOMB = 'bomb'
}

export const STORAGE_KEY = 'prism-pulse-save-v1';
