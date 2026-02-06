import { Scene } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, EVENTS } from '../consts';
import { supabase } from '../supabase';
import { Storage } from '../utils/Storage';
import { AudioManager } from '../managers/AudioManager';

export class UIScene extends Scene {
  private currentScore: number = 0;
  private audio!: AudioManager;

  // DOM Elements
  private scoreEl: HTMLElement | null = null;
  private bestEl: HTMLElement | null = null;
  private hudEl: HTMLElement | null = null;
  private gameOverEl: HTMLElement | null = null;
  private finalScoreEl: HTMLElement | null = null;
  private restartBtn: HTMLElement | null = null;
  private settingsBtn: HTMLElement | null = null;
  private settingsMenu: HTMLElement | null = null;
  private settingsCloseBtn: HTMLElement | null = null;
  private exitToMenuBtn: HTMLElement | null = null;
  private timerEl: HTMLElement | null = null;
  private infoOverlay: HTMLElement | null = null;
  private infoTitle: HTMLElement | null = null;
  private infoDesc: HTMLElement | null = null;
  private infoIcon: HTMLElement | null = null;
  private infoCloseBtn: HTMLElement | null = null;
  private soundToggle: HTMLInputElement | null = null;
  private musicToggle: HTMLInputElement | null = null;

  // Supabase UI
  private userAvatar: HTMLImageElement | null = null;
  private userNickname: HTMLElement | null = null;

  constructor() {
    super('UIScene');
  }

  init(data: { mode: string, initialScore?: number, highScore?: number }) {
    this.currentScore = data.initialScore || 0; 
    this.cacheDOMElements();
    this.audio = new AudioManager(this);
    
    // 1. CLEAR ALL PENDING ANIMATIONS
    document.querySelectorAll('.floating-score').forEach(el => el.remove());
    
    // 2. RESET DISPLAY
    if (this.scoreEl) this.scoreEl.innerText = this.currentScore.toString();
    if (this.bestEl && data.highScore !== undefined) this.bestEl.innerText = data.highScore.toString();

    const mode = (data && data.mode) ? data.mode : 'classic';

    if (mode === 'blitz') {
        if (this.timerEl) {
            this.timerEl.classList.remove('hidden');
            this.timerEl.innerText = "2:00";
        }
    } else {
        if (this.timerEl) this.timerEl.classList.add('hidden');
    }

    this.checkFirstTimeInfo(mode);
    this.updateAuthUI();
  }

  private checkFirstTimeInfo(mode: string) {
      const storageKey = `prism_info_${mode}`;
      const hasSeen = localStorage.getItem(storageKey);
      if (!hasSeen) {
          this.showInfo(mode);
          localStorage.setItem(storageKey, 'true');
      }
  }

  private showInfo(mode: string) {
      if (!this.infoOverlay) return;
      const content = {
          classic: { icon: '🧩', title: 'Classic Mode', desc: 'The pure puzzle experience. Place blocks to clear lines. Don\'t run out of space!' },
          blitz: { icon: '⚡', title: 'Blitz Rush', desc: 'High-speed challenge! You have exactly 2 minutes to score as much as possible.' },
          bomb: { icon: '💣', title: 'Bomb Defusal', desc: 'Bombs appear every 5 moves. You have 9 moves to clear the line they sit on, or they explode!' }
      };
      const info = content[mode as keyof typeof content] || content.classic;
      if (this.infoIcon) this.infoIcon.innerText = info.icon;
      if (this.infoTitle) this.infoTitle.innerText = info.title;
      if (this.infoDesc) this.infoDesc.innerText = info.desc;
      this.infoOverlay.classList.remove('hidden');
      this.infoOverlay.classList.add('visible');
      this.infoCloseBtn?.addEventListener('click', () => {
          this.infoOverlay?.classList.remove('visible');
          this.infoOverlay?.classList.add('hidden');
      }, { once: true });
  }

  create() {
    this.setupListeners();
    this.initSettings();
    if (this.hudEl) {
      this.hudEl.classList.remove('hidden');
      this.hudEl.classList.add('visible');
    }
  }

  private cacheDOMElements() {
    this.scoreEl = document.getElementById('score-display');
    this.bestEl = document.getElementById('best-display');
    this.timerEl = document.getElementById('timer-display');
    this.hudEl = document.getElementById('hud');
    this.gameOverEl = document.getElementById('game-over');
    this.finalScoreEl = document.getElementById('final-score-display');
    this.restartBtn = document.getElementById('restart-btn');
    this.settingsBtn = document.getElementById('settings-btn');
    this.settingsMenu = document.getElementById('settings-menu');
    this.settingsCloseBtn = document.getElementById('settings-close-btn');
    this.exitToMenuBtn = document.getElementById('exit-to-menu-btn');
    this.infoOverlay = document.getElementById('info-overlay');
    this.infoTitle = document.getElementById('info-title');
    this.infoDesc = document.getElementById('info-desc');
    this.infoIcon = document.getElementById('info-icon');
    this.infoCloseBtn = document.getElementById('info-close-btn');
    this.soundToggle = document.getElementById('sound-toggle') as HTMLInputElement;
    this.musicToggle = document.getElementById('music-toggle') as HTMLInputElement;
    this.userAvatar = document.getElementById('user-avatar') as HTMLImageElement;
    this.userNickname = document.getElementById('user-nickname');
  }

  private async updateAuthUI() {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
          const cachedName = localStorage.getItem('prism_nick_cache');
          if (cachedName && this.userNickname) this.userNickname.innerText = cachedName;
          const { data: profile } = await supabase.from('profiles').select('nickname, avatar_url').eq('id', user.id).maybeSingle();
          if (profile && profile.nickname) {
              localStorage.setItem('prism_nick_cache', profile.nickname);
              if (this.userNickname) this.userNickname.innerText = profile.nickname;
              if (this.userAvatar) this.userAvatar.src = profile.avatar_url || user.user_metadata.avatar_url || '';
          }
          Storage.syncWithCloud();
      }
  }

  private initSettings() {
    const soundOn = localStorage.getItem('prism-sound') !== 'false';
    const musicOn = localStorage.getItem('prism-music') !== 'false';
    if (this.soundToggle) this.soundToggle.checked = soundOn;
    if (this.musicToggle) this.musicToggle.checked = musicOn;

    this.settingsBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.settingsMenu?.classList.remove('hidden');
      this.settingsMenu?.classList.add('visible');
      if (this.exitToMenuBtn) this.exitToMenuBtn.style.display = 'block';
    });

    this.settingsCloseBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.settingsMenu?.classList.remove('visible');
      this.settingsMenu?.classList.add('hidden');
    });

    this.exitToMenuBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleExitToMenu();
    });

    this.soundToggle?.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      localStorage.setItem('prism-sound', target.checked.toString());
      this.audio.refreshSettings();
    });

    this.musicToggle?.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      localStorage.setItem('prism-music', target.checked.toString());
      this.audio.refreshSettings();
    });
  }

  private setupListeners() {
    const gameScene = this.scene.get('GameScene');
    gameScene.events.off(EVENTS.TIMER_UPDATED);
    gameScene.events.off(EVENTS.SCORE_UPDATED);
    gameScene.events.off(EVENTS.SCORE_GAINED);
    gameScene.events.off(EVENTS.LINES_CLEARED);
    gameScene.events.off(EVENTS.GAME_OVER);

    gameScene.events.on(EVENTS.SCORE_GAINED, (data: { amount: number, x: number, y: number, isPerfect?: boolean }) => {
        this.animateScoreGained(data.amount, data.x, data.y);
        if (data.isPerfect) {
            this.showSpecialMessage('PERFECT CLEAR!');
        }
    });

    gameScene.events.on(EVENTS.TIMER_UPDATED, (seconds: number) => {
        if (this.timerEl) {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            this.timerEl.innerText = `${mins}:${secs.toString().padStart(2, '0')}`;
            this.timerEl.style.color = seconds <= 10 ? '#ff0055' : '#ffff00';
        }
    });

    gameScene.events.on(EVENTS.SCORE_UPDATED, (_score: number, high: number) => {
      if (this.bestEl) this.bestEl.innerText = high.toString();
    });

    gameScene.events.on(EVENTS.LINES_CLEARED, (count: number) => {
      this.showCombo(count);
    });

    gameScene.events.on(EVENTS.GAME_OVER, async () => {
      if (this.hudEl) { this.hudEl.classList.remove('visible'); this.hudEl.classList.add('hidden'); }
      if (this.gameOverEl) { this.gameOverEl.classList.remove('hidden'); this.gameOverEl.classList.add('visible'); }
      if (this.finalScoreEl) this.finalScoreEl.innerText = this.currentScore.toString();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
          const prompt = document.createElement('div');
          prompt.innerText = 'Log in to join the Global Leaderboard!';
          prompt.style.color = '#00f3ff';
          prompt.style.fontSize = '14px';
          prompt.style.marginTop = '10px';
          prompt.style.fontFamily = 'Orbitron';
          this.gameOverEl?.insertBefore(prompt, this.restartBtn);
      }

      if (this.restartBtn) {
        const newBtn = this.restartBtn.cloneNode(true) as HTMLElement;
        this.restartBtn.parentNode?.replaceChild(newBtn, this.restartBtn);
        this.restartBtn = newBtn;
        this.restartBtn.addEventListener('click', () => this.handleRestart());
      }
    });
  }

  private animateScoreGained(amount: number, worldX: number, worldY: number) {
    const activeInstance = this;
    const canvasBounds = this.scale.canvasBounds;
    const scaleX = canvasBounds.width / GAME_WIDTH;
    const scaleY = canvasBounds.height / GAME_HEIGHT;
    const startX = canvasBounds.x + (worldX * scaleX);
    const startY = canvasBounds.y + (worldY * scaleY);

    const scoreText = document.createElement('div');
    scoreText.innerText = `+${amount}`;
    scoreText.className = 'floating-score';
    document.body.appendChild(scoreText);
    scoreText.style.left = `${startX}px`;
    scoreText.style.top = `${startY}px`;

    this.time.delayedCall(10, () => {
        scoreText.style.transform = 'translate(-50%, -50%) scale(1.5)';
        scoreText.style.opacity = '1';
        
        this.time.delayedCall(400, () => {
            const targetRect = activeInstance.scoreEl?.getBoundingClientRect();
            if (targetRect) {
                const targetX = targetRect.left + targetRect.width / 2;
                const targetY = targetRect.top + targetRect.height / 2;
                scoreText.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
                scoreText.style.left = `${targetX}px`;
                scoreText.style.top = `${targetY}px`;
                scoreText.style.transform = 'translate(-50%, -50%) scale(0.5)';
                scoreText.style.opacity = '0.2';
            }

            this.time.delayedCall(600, () => {
                scoreText.remove();
                activeInstance.incrementScore(amount);
                activeInstance.pulseScore();
            });
        });
    });
  }

  private incrementScore(amount: number) {
      const start = this.currentScore;
      const end = this.currentScore + amount;
      this.currentScore = end;
      const duration = 300;
      const startTime = performance.now();
      const update = (now: number) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const current = Math.floor(start + (end - start) * progress);
          if (this.scoreEl) this.scoreEl.innerText = current.toString();
          if (progress < 1) requestAnimationFrame(update);
      };
      requestAnimationFrame(update);
  }

  private pulseScore() {
      if (!this.scoreEl) return;
      this.scoreEl.style.transition = 'none';
      this.scoreEl.style.transform = 'scale(1.3)';
      this.scoreEl.style.color = '#00f3ff';
      this.scoreEl.style.textShadow = '0 0 20px #00f3ff';
      setTimeout(() => {
          this.scoreEl!.style.transition = 'all 0.3s ease-out';
          this.scoreEl!.style.transform = 'scale(1)';
          this.scoreEl!.style.color = '#fff';
          this.scoreEl!.style.textShadow = '0 0 10px rgba(0, 243, 255, 0.5)';
      }, 50);
  }

  private handleExitToMenu() {
    if (this.settingsMenu) { this.settingsMenu.classList.remove('visible'); this.settingsMenu.classList.add('hidden'); }
    if (this.hudEl) { this.hudEl.classList.remove('visible'); this.hudEl.classList.add('hidden'); }
    this.audio.stopAllMusic();
    const gameScene = this.scene.get('GameScene');
    gameScene.scene.stop();
    this.scene.stop();
    this.scene.start('LauncherScene');
  }

  private handleRestart() {
    this.currentScore = 0;
    if (this.gameOverEl) { this.gameOverEl.classList.remove('visible'); this.gameOverEl.classList.add('hidden'); }
    if (this.scoreEl) this.scoreEl.innerText = '0';
    const gameScene = this.scene.get('GameScene');
    gameScene.events.emit(EVENTS.RESTART_GAME);
  }

  private showCombo(lines: number) {
    if (lines < 2) return;
    this.showSpecialMessage(`COMBO x${lines}!`);
  }

  private showSpecialMessage(text: string) {
    const msgDiv = document.createElement('div');
    msgDiv.innerText = text;
    msgDiv.className = 'combo-effect';
    document.getElementById('ui-layer')?.appendChild(msgDiv);
    msgDiv.style.position = 'absolute';
    msgDiv.style.top = '40%';
    msgDiv.style.left = '50%';
    msgDiv.style.transform = 'translate(-50%, -50%)';
    msgDiv.style.color = '#00f3ff';
    msgDiv.style.fontSize = '48px';
    msgDiv.style.fontWeight = '900';
    msgDiv.style.textShadow = '0 0 20px #00f3ff';
    msgDiv.style.pointerEvents = 'none';
    msgDiv.style.zIndex = '2000';
    msgDiv.style.width = '100%';
    msgDiv.style.textAlign = 'center';
    
    requestAnimationFrame(() => {
        msgDiv.style.transition = 'all 0.8s ease-out';
        msgDiv.style.transform = 'translate(-50%, -80%) scale(1.5)';
        msgDiv.style.opacity = '0';
        setTimeout(() => msgDiv.remove(), 800);
    });
  }
}
