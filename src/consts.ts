export interface Theme {
  id: string;
  name: string;
  cost: number;
  colors: {
    background: number;
    gridBg: number;
    gridCell: number;
    primary: number;
    blocks: number[];
  };
}

export const THEMES: { [key: string]: Theme } = {
  classic: {
    id: 'classic',
    name: 'Neon Prism',
    cost: 0,
    colors: {
      background: 0x050510,
      gridBg: 0x0a0a1a,
      gridCell: 0x151525,
      primary: 0x00f3ff,
      blocks: [0xff0055, 0xff9900, 0xffff00, 0x00ff66, 0x00f3ff, 0xff00ff]
    }
  },
  vaporwave: {
    id: 'vaporwave',
    name: 'Vaporwave',
    cost: 1000,
    colors: {
      background: 0x241734,
      gridBg: 0x2e1a47,
      gridCell: 0x3d235c,
      primary: 0xff71ce,
      blocks: [0xff71ce, 0x01cdfe, 0x05ffa1, 0xb967ff, 0xfffb96, 0xffffff]
    }
  },
  matrix: {
    id: 'matrix',
    name: 'Matrix',
    cost: 1500,
    colors: {
      background: 0x010b01,
      gridBg: 0x021602,
      gridCell: 0x032203,
      primary: 0x00ff41,
      blocks: [0x00ff41, 0x003b00, 0x008f11, 0x00d411, 0x00ff41, 0x008f11]
    }
  },
  aurora: {
    id: 'aurora',
    name: 'Aurora',
    cost: 2000,
    colors: {
      background: 0x0b1026,
      gridBg: 0x121a36,
      gridCell: 0x1a244a,
      primary: 0x1fefbb,
      blocks: [0x1fefbb, 0x764ba2, 0x667eea, 0xff0844, 0x30cfd0, 0x330867]
    }
  }
};

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

export const ANIM = {
  SPAWN_DURATION: 220,
  SPAWN_EASE: 'Back.out',
  DRAG_SCALE_DURATION: 80,
  DRAG_SCALE: 1.05,
  DROP_RETURN_DURATION: 150,
  CLEAR_DURATION: 180,
  CLEAR_EASE: 'Expo.out',
  SHAKE_INTENSITY: 0.012,
  SHAKE_DURATION: 200
};
