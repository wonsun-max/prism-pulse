import { Scene } from 'phaser';

export class AudioManager {
  private scene: Scene;
  private audioContext: AudioContext;
  
  private static soundEnabled: boolean = true;
  private static musicEnabled: boolean = true;
  private static currentMusicKey: string = '';
  private static currentMusicVolume: number = 0.5;

  constructor(scene: Scene) {
    this.scene = scene;
    // @ts-ignore
    this.audioContext = scene.sound.context as AudioContext;
    this.refreshSettings();
  }

  public refreshSettings() {
    const wasMusicEnabled = AudioManager.musicEnabled;
    
    AudioManager.soundEnabled = localStorage.getItem('prism-sound') !== 'false';
    AudioManager.musicEnabled = localStorage.getItem('prism-music') !== 'false';
    
    if (!AudioManager.musicEnabled && wasMusicEnabled) {
        this.stopAllActiveMusic();
    } 
    else if (AudioManager.musicEnabled && !wasMusicEnabled) {
        if (AudioManager.currentMusicKey) {
            this.playMusic(AudioManager.currentMusicKey, AudioManager.currentMusicVolume);
        }
    }
  }

  private stopAllActiveMusic() {
      // Use scene.sound.stopByKey to be precise
      this.scene.sound.stopByKey('menu_music');
      this.scene.sound.stopByKey('game_music');
      this.clearSynthLoop();
  }

  private createOscillator(freq: number, type: OscillatorType, duration: number, volume: number = 0.1) {
    if (!AudioManager.soundEnabled) return; 

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.audioContext.currentTime);
    
    gain.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.audioContext.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    osc.start();
    osc.stop(this.audioContext.currentTime + duration);
  }

  playPlace() {
    this.createOscillator(150, 'sine', 0.1, 0.3);
    this.createOscillator(100, 'triangle', 0.1, 0.2);
  }

  playClear() {
    [440, 554.37, 659.25, 880].forEach((f, i) => {
      setTimeout(() => this.createOscillator(f, 'sine', 0.4, 0.1), i * 50);
    });
    this.createOscillator(200, 'sawtooth', 0.2, 0.05);
  }

  playCombo(multiplier: number) {
    this.createOscillator(220 * multiplier, 'sawtooth', 0.5, 0.05);
  }

  playClick() {
    this.createOscillator(880, 'sine', 0.05, 0.1);
  }

  playGameOver() {
    [440, 330, 220].forEach((f, i) => {
      setTimeout(() => this.createOscillator(f, 'square', 0.5, 0.05), i * 200);
    });
  }

  playMusic(key: string, volume: number = 0.5) {
    // 1. Stop any other music track before starting a new one
    if (AudioManager.currentMusicKey && AudioManager.currentMusicKey !== key) {
        this.scene.sound.stopByKey(AudioManager.currentMusicKey);
    }

    AudioManager.currentMusicKey = key;
    AudioManager.currentMusicVolume = volume;

    if (!AudioManager.musicEnabled) return;

    try {
      if (this.scene.cache.audio.exists(key)) {
        this.clearSynthLoop();
        let music = this.scene.sound.get(key);
        if (!music) {
          music = this.scene.sound.add(key, { loop: true, volume });
        }
        if (!music.isPlaying) {
          music.play({ loop: true, volume });
        }
      } else {
        this.playSynthLoop(key === 'menu_music' ? 330 : 220);
      }
    } catch (e) {
      this.playSynthLoop(220);
    }
  }

  private clearSynthLoop() {
    if (this.synthLoopInterval) {
      clearInterval(this.synthLoopInterval);
      this.synthLoopInterval = null;
    }
  }

  private synthLoopInterval: any = null;
  private playSynthLoop(baseFreq: number) {
    if (!AudioManager.musicEnabled || this.synthLoopInterval) return;
    
    this.synthLoopInterval = setInterval(() => {
        if (!AudioManager.musicEnabled) {
            this.clearSynthLoop();
            return;
        }
        this.createOscillator(baseFreq, 'triangle', 0.2, 0.05);
        setTimeout(() => {
            this.createOscillator(baseFreq * 1.5, 'triangle', 0.1, 0.03);
        }, 400);
    }, 800);
  }

  stopMusic(key: string) {
    if (AudioManager.currentMusicKey === key) {
        AudioManager.currentMusicKey = '';
    }
    this.clearSynthLoop();
    this.scene.sound.stopByKey(key);
  }

  stopAllMusic() {
    AudioManager.currentMusicKey = '';
    this.clearSynthLoop();
    this.scene.sound.stopByKey('menu_music');
    this.scene.sound.stopByKey('game_music');
  }
}
