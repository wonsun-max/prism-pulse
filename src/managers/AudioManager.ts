import { Scene } from 'phaser';

export class AudioManager {
  private scene: Scene;
  private audioContext: AudioContext;

  constructor(scene: Scene) {
    this.scene = scene;
    // @ts-ignore
    this.audioContext = scene.sound.context as AudioContext;
  }

  private createOscillator(freq: number, type: OscillatorType, duration: number, volume: number = 0.1) {
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
    // A quick, low-frequency 'thud' for placement
    this.createOscillator(150, 'sine', 0.1, 0.3);
    this.createOscillator(100, 'triangle', 0.1, 0.2);
  }

  playClear() {
    // A shimmery, rising arpeggio for breaking blocks
    const now = this.audioContext.currentTime;
    [440, 554.37, 659.25, 880].forEach((f, i) => {
      setTimeout(() => this.createOscillator(f, 'sine', 0.4, 0.1), i * 50);
    });
    // Add a little 'white noise' burst for the break crunch
    this.createOscillator(200, 'sawtooth', 0.2, 0.05);
  }

  playCombo(multiplier: number) {
    this.createOscillator(220 * multiplier, 'sawtooth', 0.5, 0.05);
  }

  playClick() {
    this.createOscillator(880, 'sine', 0.05, 0.1);
  }

  playGameOver() {
    const now = this.audioContext.currentTime;
    [440, 330, 220].forEach((f, i) => {
      setTimeout(() => this.createOscillator(f, 'square', 0.5, 0.05), i * 200);
    });
  }

  playMusic(key: string, volume: number = 0.5) {
    try {
      // Check if sound exists in the cache (loaded successfully)
      if (this.scene.cache.audio.exists(key)) {
        // Stop synth fallback if it was playing
        this.clearSynthLoop();

        let music = this.scene.sound.get(key);
        if (!music) {
          music = this.scene.sound.add(key, { loop: true, volume });
        }
        
        if (!music.isPlaying) {
          music.play({ loop: true, volume });
        }
      } else {
        // Fallback: Simple synth pulse if no file found or failed to load
        console.warn(`Audio key "${key}" not found in cache. Falling back to synth.`);
        this.playSynthLoop(key === 'menu_music' ? 330 : 220);
      }
    } catch (e) {
      console.error("AudioManager Error:", e);
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
    if (this.synthLoopInterval) return;
    
    this.synthLoopInterval = setInterval(() => {
        this.createOscillator(baseFreq, 'triangle', 0.2, 0.05);
        setTimeout(() => {
            this.createOscillator(baseFreq * 1.5, 'triangle', 0.1, 0.03);
        }, 400);
    }, 800);
  }

  stopMusic(key: string) {
    this.clearSynthLoop();
    const music = this.scene.sound.get(key);
    if (music) {
      music.stop();
    }
  }

  stopAllMusic() {
    this.scene.sound.stopAll();
  }
}

