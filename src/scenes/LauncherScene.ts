import { Scene } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../consts';
import { AudioManager } from '../managers/AudioManager';
import { supabase } from '../supabase';
import { AdManager } from '../managers/AdManager';

export class LauncherScene extends Scene {
  private audio!: AudioManager;
  
  // Leaderboard DOM
  private leaderboardOverlay: HTMLElement | null = null;
  private leaderboardList: HTMLElement | null = null;
  private leaderboardCloseBtn: HTMLElement | null = null;
  private currentTab: string = 'classic';

  // Main Menu Profile DOM
  private mainLoginBtn: HTMLElement | null = null;
  private mainSettingsBtn: HTMLElement | null = null;
  private mainUserInfo: HTMLElement | null = null;
  private mainUserAvatar: HTMLImageElement | null = null;
  private settingsMenu: HTMLElement | null = null;
  private settingsCloseBtn: HTMLElement | null = null;
  private exitToMenuBtn: HTMLElement | null = null;

  // Nickname DOM
  private nicknameOverlay: HTMLElement | null = null;
  private nicknameInput: HTMLInputElement | null = null;
  private nicknameSaveBtn: HTMLElement | null = null;

  // Profile Details DOM
  private profileOverlay: HTMLElement | null = null;
  private detailUserAvatar: HTMLImageElement | null = null;
  private detailUserNickname: HTMLElement | null = null;
  private statClassic: HTMLElement | null = null;
  private statBlitz: HTMLElement | null = null;
  private statBomb: HTMLElement | null = null;
  private profileCloseBtn: HTMLElement | null = null;
  private profileLogoutBtn: HTMLElement | null = null;

  // Legal DOM
  private legalOverlay: HTMLElement | null = null;
  private legalAcceptBtn: HTMLElement | null = null;

  // Login Prompt DOM
  private loginPromptOverlay: HTMLElement | null = null;
  private promptLoginBtn: HTMLElement | null = null;
  private promptCloseBtn: HTMLElement | null = null;

  constructor() {
    super('LauncherScene');
  }

  create() {
    this.audio = new AudioManager(this);
    this.audio.playMusic('menu_music', 0.4);
    
    this.cameras.main.setBackgroundColor(COLORS.BACKGROUND);
    this.createBackground();
    
    // --- AD BANNER ---
    AdManager.showBanner();

    const mainMenu = document.getElementById('main-menu');
    const menuCardMain = document.getElementById('menu-card-main');
    const modeSelectCard = document.getElementById('mode-select-card');
    const playBtn = document.getElementById('play-btn');
    const leaderboardBtn = document.getElementById('leaderboard-btn');
    const backBtn = document.getElementById('back-btn');

    this.leaderboardOverlay = document.getElementById('leaderboard-overlay');
    this.leaderboardList = document.getElementById('leaderboard-list');
    this.leaderboardCloseBtn = document.getElementById('leaderboard-close-btn');

    // Main Profile Bar
    this.mainLoginBtn = document.getElementById('main-login-btn');
    this.mainSettingsBtn = document.getElementById('main-settings-btn');
    this.mainUserInfo = document.getElementById('main-user-info');
    this.mainUserAvatar = document.getElementById('main-user-avatar') as HTMLImageElement;

    // Settings
    this.settingsMenu = document.getElementById('settings-menu');
    this.settingsCloseBtn = document.getElementById('settings-close-btn');
    this.exitToMenuBtn = document.getElementById('exit-to-menu-btn');

    // Nickname Overlay
    this.nicknameOverlay = document.getElementById('nickname-overlay');
    this.nicknameInput = document.getElementById('nickname-input') as HTMLInputElement;
    this.nicknameSaveBtn = document.getElementById('nickname-save-btn');

    // Profile Details Overlay
    this.profileOverlay = document.getElementById('profile-overlay');
    this.detailUserAvatar = document.getElementById('detail-user-avatar') as HTMLImageElement;
    this.detailUserNickname = document.getElementById('detail-user-nickname');
    this.statClassic = document.getElementById('stat-classic');
    this.statBlitz = document.getElementById('stat-blitz');
    this.statBomb = document.getElementById('stat-bomb');
    this.profileCloseBtn = document.getElementById('profile-close-btn');
    this.profileLogoutBtn = document.getElementById('profile-logout-btn');

    // Legal Overlay
    this.legalOverlay = document.getElementById('legal-overlay');
    this.legalAcceptBtn = document.getElementById('legal-accept-btn');

    // Login Prompt Overlay
    this.loginPromptOverlay = document.getElementById('login-prompt-overlay');
    this.promptLoginBtn = document.getElementById('prompt-login-btn');
    this.promptCloseBtn = document.getElementById('prompt-close-btn');

    // Reset UI state
    mainMenu?.classList.remove('hidden');
    mainMenu?.classList.add('visible');
    menuCardMain?.classList.remove('hidden');
    modeSelectCard?.classList.add('hidden');
    this.leaderboardOverlay?.classList.add('hidden');
    this.nicknameOverlay?.classList.add('hidden');
    this.profileOverlay?.classList.add('hidden');
    this.legalOverlay?.classList.add('hidden');
    this.loginPromptOverlay?.classList.add('hidden');

    this.checkLegalAgreement();
    this.updateMainAuthUI();

    // --- BROWSER AUTOPLAY FIX ---
    const kickstartAudio = () => {
        this.audio.playMusic('menu_music', 0.4);
        window.removeEventListener('pointerdown', kickstartAudio);
        window.removeEventListener('keydown', kickstartAudio);
    };
    window.addEventListener('pointerdown', kickstartAudio, { once: true });
    window.addEventListener('keydown', kickstartAudio, { once: true });

    if (playBtn) {
      const newBtn = playBtn.cloneNode(true) as HTMLElement;
      playBtn.parentNode?.replaceChild(newBtn, playBtn);
      newBtn.onclick = () => {
        this.audio.playClick();
        menuCardMain?.classList.add('hidden');
        modeSelectCard?.classList.remove('hidden');
      };
    }

    if (leaderboardBtn) {
      const newBtn = leaderboardBtn.cloneNode(true) as HTMLElement;
      leaderboardBtn.parentNode?.replaceChild(newBtn, leaderboardBtn);
      newBtn.onclick = async () => {
        this.audio.playClick();
        if (!supabase) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            this.showLeaderboard();
        } else {
            this.loginPromptOverlay?.classList.remove('hidden');
            this.loginPromptOverlay?.classList.add('visible');
            menuCardMain?.classList.add('hidden');
        }
      };
    }

    if (this.mainLoginBtn) {
        const newBtn = this.mainLoginBtn.cloneNode(true) as HTMLElement;
        this.mainLoginBtn.parentNode?.replaceChild(newBtn, this.mainLoginBtn);
        this.mainLoginBtn = newBtn;
        newBtn.onclick = async () => {
            this.audio.playClick();
            if (!supabase) return;
            await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { 
                    redirectTo: `${window.location.origin}/`,
                    queryParams: { access_type: 'offline', prompt: 'consent' }
                }
            });
        };
    }

    if (this.promptLoginBtn) {
        this.promptLoginBtn.onclick = async () => {
            this.audio.playClick();
            if (!supabase) return;
            await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { 
                    redirectTo: `${window.location.origin}/`,
                    queryParams: { access_type: 'offline', prompt: 'consent' }
                }
            });
        };
    }

    if (this.promptCloseBtn) {
        this.promptCloseBtn.onclick = () => {
            this.audio.playClick();
            this.loginPromptOverlay?.classList.remove('visible');
            this.loginPromptOverlay?.classList.add('hidden');
            menuCardMain?.classList.remove('hidden');
        };
    }

    if (this.mainSettingsBtn) {
        this.mainSettingsBtn.onclick = () => {
            this.audio.playClick();
            this.settingsMenu?.classList.remove('hidden');
            this.settingsMenu?.classList.add('visible');
            if (this.exitToMenuBtn) this.exitToMenuBtn.style.display = 'none';
        };
    }

    if (this.settingsCloseBtn) {
        this.settingsCloseBtn.onclick = () => {
            this.audio.playClick();
            this.settingsMenu?.classList.remove('visible');
            this.settingsMenu?.classList.add('hidden');
        };
    }

    if (this.mainUserInfo) {
        this.mainUserInfo.onclick = () => {
            this.audio.playClick();
            this.showProfileDetails();
        };
    }

    if (this.profileCloseBtn) {
        this.profileCloseBtn.onclick = () => {
            this.audio.playClick();
            this.profileOverlay?.classList.add('hidden');
            this.profileOverlay?.classList.remove('visible');
            menuCardMain?.classList.remove('hidden');
        };
    }

    if (this.profileLogoutBtn) {
        this.profileLogoutBtn.onclick = async () => {
            this.audio.playClick();
            if (!supabase) return;
            await supabase.auth.signOut();
            this.profileOverlay?.classList.add('hidden');
            this.profileOverlay?.classList.remove('visible');
            this.updateMainAuthUI();
        };
    }

    if (this.nicknameSaveBtn) {
        this.nicknameSaveBtn.onclick = async () => {
            this.audio.playClick();
            await this.handleNicknameSave();
        };
    }

    if (this.legalAcceptBtn) {
        this.legalAcceptBtn.onclick = () => {
            this.audio.playClick();
            localStorage.setItem('prism_legal_accepted', 'true');
            this.legalOverlay?.classList.add('hidden');
            this.legalOverlay?.classList.remove('visible');
            document.getElementById('menu-card-main')?.classList.remove('hidden');
            this.audio.playMusic('menu_music', 0.4);
        };
    }

    if (this.leaderboardCloseBtn) {
        this.leaderboardCloseBtn.onclick = () => {
            this.audio.playClick();
            this.leaderboardOverlay?.classList.add('hidden');
            this.leaderboardOverlay?.classList.remove('visible');
            menuCardMain?.classList.remove('hidden');
        };
    }

    document.querySelectorAll('.tab-btn').forEach(btn => {
        const el = btn as HTMLElement;
        el.onclick = () => {
            this.audio.playClick();
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            el.classList.add('active');
            this.currentTab = el.getAttribute('data-tab') || 'classic';
            this.fetchLeaderboardData();
        };
    });

    if (backBtn) {
      const newBtn = backBtn.cloneNode(true) as HTMLElement;
      backBtn.parentNode?.replaceChild(newBtn, backBtn);
      newBtn.onclick = () => {
        this.audio.playClick();
        modeSelectCard?.classList.add('hidden');
        menuCardMain?.classList.remove('hidden');
      };
    }

    document.querySelectorAll('.mode-btn').forEach((btn) => {
      const el = btn as HTMLElement;
      const newBtn = el.cloneNode(true) as HTMLElement;
      el.parentNode?.replaceChild(newBtn, el);
      newBtn.onclick = () => {
        this.audio.playClick();
        const mode = newBtn.getAttribute('data-mode');
        mainMenu?.classList.remove('visible');
        mainMenu?.classList.add('hidden');
        this.scene.start('GameScene', { mode: mode || 'classic' });
      };
    });
  }

  private checkLegalAgreement() {
      const accepted = localStorage.getItem('prism_legal_accepted');
      if (!accepted) {
          this.legalOverlay?.classList.remove('hidden');
          this.legalOverlay?.classList.add('visible');
          document.getElementById('menu-card-main')?.classList.add('hidden');
      }
  }

  private async updateMainAuthUI() {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      const menuCardMain = document.getElementById('menu-card-main');

      if (user) {
          this.mainLoginBtn?.classList.add('hidden');
          this.mainUserInfo?.classList.remove('user-profile-hidden');
          this.mainUserInfo?.classList.add('user-profile-visible');
          
          const { data: profile } = await supabase
              .from('profiles')
              .select('nickname, avatar_url')
              .eq('id', user.id)
              .maybeSingle();

          if (!profile || !profile.nickname) {
              this.nicknameOverlay?.classList.remove('hidden');
              this.nicknameOverlay?.classList.add('visible');
              menuCardMain?.classList.add('hidden');
              if (this.nicknameInput) this.nicknameInput.value = user.user_metadata.full_name || '';
          } else {
              localStorage.setItem('prism_nick_cache', profile.nickname);
              this.nicknameOverlay?.classList.add('hidden');
              if (localStorage.getItem('prism_legal_accepted')) {
                  menuCardMain?.classList.remove('hidden');
              }
          }

          if (this.mainUserAvatar) this.mainUserAvatar.src = profile?.avatar_url || user.user_metadata.avatar_url || '';
      } else {
          localStorage.removeItem('prism_nick_cache');
          this.mainLoginBtn?.classList.remove('hidden');
          this.mainUserInfo?.classList.add('user-profile-hidden');
          this.mainUserInfo?.classList.remove('user-profile-visible');
          if (localStorage.getItem('prism_legal_accepted')) {
              menuCardMain?.classList.remove('hidden');
          }
          this.nicknameOverlay?.classList.add('hidden');
      }
  }

  private async showProfileDetails() {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const menuCardMain = document.getElementById('menu-card-main');
      menuCardMain?.classList.add('hidden');

      this.profileOverlay?.classList.remove('hidden');
      this.profileOverlay?.classList.add('visible');

      const { data: profile } = await supabase
          .from('profiles')
          .select('nickname, avatar_url')
          .eq('id', user.id)
          .single();

      if (this.detailUserAvatar) this.detailUserAvatar.src = profile?.avatar_url || user.user_metadata.avatar_url;
      if (this.detailUserNickname) this.detailUserNickname.innerText = profile?.nickname || user.user_metadata.full_name;

      const { data: scores } = await supabase
          .from('scores')
          .select('mode, score')
          .eq('user_id', user.id);

      if (this.statClassic) this.statClassic.innerText = '0';
      if (this.statBlitz) this.statBlitz.innerText = '0';
      if (this.statBomb) this.statBomb.innerText = '0';

      scores?.forEach((s: any) => {
          if (s.mode === 'classic' && this.statClassic) this.statClassic.innerText = s.score.toLocaleString();
          if (s.mode === 'blitz' && this.statBlitz) this.statBlitz.innerText = s.score.toLocaleString();
          if (s.mode === 'bomb' && this.statBomb) this.statBomb.innerText = s.score.toLocaleString();
      });
  }

  private async handleNicknameSave() {
      const name = this.nicknameInput?.value.trim();
      if (!name) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from('profiles').upsert({
          id: user.id,
          nickname: name,
          avatar_url: user.user_metadata.avatar_url
      });
      if (error) {
          alert('Name already taken or database error.');
          return;
      }
      this.nicknameOverlay?.classList.add('hidden');
      this.nicknameOverlay?.classList.remove('visible');
      document.getElementById('menu-card-main')?.classList.remove('hidden');
      localStorage.setItem('prism_nick_cache', name);
  }

  private showLeaderboard() {
      const menuCardMain = document.getElementById('menu-card-main');
      menuCardMain?.classList.add('hidden');

      this.leaderboardOverlay?.classList.remove('hidden');
      this.leaderboardOverlay?.classList.add('visible');
      this.fetchLeaderboardData();
  }

  private async fetchLeaderboardData() {
      if (!this.leaderboardList) return;
      if (!supabase) {
          this.leaderboardList.innerHTML = '<div class="loading-text" style="color: #ff0055">Pulse Network Offline.</div>';
          return;
      }
      this.leaderboardList.innerHTML = '<div class="loading-text">Synchronizing...</div>';
      const { data: { user } } = await supabase.auth.getUser();
      
      // Capacitor native detection
      // @ts-ignore
      const platform = window.Capacitor ? (window.Capacitor.getPlatform() === 'ios' ? 'ios' : 'android') : 'android';

      const { data, error } = await supabase
          .from('scores')
          .select('score, user_id, profiles(nickname, avatar_url)')
          .eq('mode', this.currentTab)
          .eq('platform', platform)
          .order('score', { ascending: false })
          .limit(50);
      if (error) {
          this.leaderboardList.innerHTML = `<div class="loading-text" style="color: #ff0055">Error: ${error.message}</div>`;
          return;
      }
      if (!data || data.length === 0) {
          this.leaderboardList.innerHTML = '<div class="loading-text">No records.</div>';
          return;
      }
      this.leaderboardList.innerHTML = '';
      data.forEach((entry: any, index: number) => {
          const rank = index + 1;
          const profile = entry.profiles;
          const isMe = user && entry.user_id === user.id;
          const item = document.createElement('div');
          item.className = `leaderboard-entry ${isMe ? 'is-me' : ''}`;
          item.innerHTML = `
              <div class="rank rank-${rank <= 3 ? rank : 'other'}">${rank}</div>
              <div class="player-info">
                  <img class="player-avatar" src="${profile?.avatar_url || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=' + entry.user_id}" alt="Avatar">
                  <div class="player-name">${profile?.nickname || 'Unknown Agent'}</div>
              </div>
              <div class="player-score">${entry.score.toLocaleString()}</div>
          `;
          this.leaderboardList?.appendChild(item);
      });
  }

  private createBackground() {
    for (let i = 0; i < 15; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      const shard = this.add.image(x, y, 'shard')
        .setAlpha(Phaser.Math.FloatBetween(0.1, 0.4))
        .setScale(Phaser.Math.FloatBetween(1, 3))
        .setTint(i % 2 === 0 ? COLORS.ACCENT_CYAN : COLORS.ACCENT_PURPLE)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: shard,
        x: x + Phaser.Math.Between(-100, 100),
        y: y + Phaser.Math.Between(-100, 100),
        rotation: Math.PI * 2,
        duration: Phaser.Math.Between(5000, 15000),
        repeat: -1,
        yoyo: true
      });
    }
  }
}