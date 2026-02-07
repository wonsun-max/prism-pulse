import Phaser from 'phaser';
import { App } from '@capacitor/app';
import './style.css';
import { Preloader } from './scenes/Preloader';
import { LauncherScene } from './scenes/LauncherScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';
import { GAME_WIDTH, GAME_HEIGHT } from './consts';
import { AdManager } from './managers/AdManager';
import { supabase } from './supabase';

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

// Handle Deep Links for Supabase Auth
App.addListener('appUrlOpen', async (data: { url: string }) => {
  const url = data.url;
  if (url && url.startsWith('com.wonsun.prismpulse://')) {
    const slug = url.split('#')[1];
    if (slug && supabase) {
      const { error } = await supabase.auth.setSession({
        access_token: new URLSearchParams(slug).get('access_token') || '',
        refresh_token: new URLSearchParams(slug).get('refresh_token') || '',
      });
      if (error) console.error('Auth deep link error:', error.message);
      else {
        console.log('Auth session resumed via deep link');
        window.location.reload();
      }
    }
  }
});

window.addEventListener('load', async () => {
  // Initialize AdMob
  await AdManager.initialize();

  new Phaser.Game(config);
});
