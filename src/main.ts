import Phaser from 'phaser';
import './style.css'; // Import the new Apple-like styles
import { Preloader } from './scenes/Preloader';
import { LauncherScene } from './scenes/LauncherScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';
import { GAME_WIDTH, GAME_HEIGHT } from './consts';
import { AdManager } from './managers/AdManager';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'app',
  backgroundColor: '#050510',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  scene: [Preloader, LauncherScene, GameScene, UIScene],
};

window.addEventListener('load', async () => {
  console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? 'Loaded' : 'MISSING');
  console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Loaded' : 'MISSING');
  
  // Initialize AdMob
  await AdManager.initialize();
  
  new Phaser.Game(config);
});
