import { STORAGE_KEY } from '../consts';
import { supabase } from '../supabase';

export interface GameSession {
  score: number;
  grid: (number | null)[][]; 
  blocks: { matrix: number[][], color: number }[];
  movesCount: number;
  timeLeft?: number;
  bombs?: { r: number, c: number, count: number }[];
}

export interface GameState {
  highScores: { [mode: string]: number };
  sessions: { [mode: string]: GameSession | null };
}

export class Storage {
  private static VALID_MODES = ['classic', 'blitz', 'bomb'];

  static save(data: Partial<GameState>): void {
    try {
      const existing = Storage.load();
      const merged = { ...existing, ...data };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch (e) {
      console.warn('Failed to save game state', e);
    }
  }

  static load(): GameState {
    const defaultState: GameState = {
      highScores: { classic: 0, blitz: 0, bomb: 0 },
      sessions: { classic: null, blitz: null, bomb: null }
    };

    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        const highScores: { [key: string]: number } = { ...defaultState.highScores };
        if (parsed.highScores) {
            this.VALID_MODES.forEach(mode => {
                if (typeof parsed.highScores[mode] === 'number') {
                    highScores[mode] = parsed.highScores[mode];
                }
            });
        }
        const sessions: { [key: string]: any } = { ...defaultState.sessions };
        if (parsed.sessions) {
            this.VALID_MODES.forEach(mode => {
                if (parsed.sessions[mode]) {
                    sessions[mode] = parsed.sessions[mode];
                }
            });
        }
        return { highScores, sessions: sessions as any };
      }
    } catch (e) {
      console.warn('Failed to load game state', e);
    }
    return defaultState;
  }

  static async saveHighScore(mode: string, score: number): Promise<void> {
      if (!this.VALID_MODES.includes(mode)) return;

      const state = this.load();
      if (!state.highScores[mode] || score > state.highScores[mode]) {
          state.highScores[mode] = score;
          this.save(state);

          if (supabase) {
              try {
                  const { data: { user } } = await supabase.auth.getUser();
                  if (user) {
                      // Platform detection for leaderboard separation
                      const platform = window.hasOwnProperty('Capacitor') ? 
                                       // @ts-ignore
                                       (window.Capacitor.getPlatform() === 'ios' ? 'ios' : 'android') : 
                                       'android'; // Default web to android-like bucket
                      
                      await supabase.from('scores').upsert({
                          user_id: user.id,
                          mode: mode,
                          score: score,
                          platform: platform
                      }, { onConflict: 'user_id,mode' });
                  }
              } catch (e) {
                  console.error("Cloud save failed", e);
              }
          }
      }
  }

  static getHighScore(mode: string): number {
      if (!this.VALID_MODES.includes(mode)) return 0;
      const state = this.load();
      return state.highScores[mode] || 0;
  }

  static saveSession(mode: string, session: GameSession | null): void {
      if (!this.VALID_MODES.includes(mode)) return;
      const state = this.load();
      state.sessions[mode] = session;
      this.save(state);
  }

  static getSession(mode: string): GameSession | null {
      if (!this.VALID_MODES.includes(mode)) return null;
      const state = this.load();
      return state.sessions[mode] || null;
  }

  static async syncWithCloud(): Promise<void> {
      if (!supabase) return;
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { data: cloudScores } = await supabase
              .from('scores')
              .select('mode, score')
              .eq('user_id', user.id);

          if (cloudScores) {
              const state = this.load();
              let changed = false;

              cloudScores.forEach((cs: any) => {
                  if (this.VALID_MODES.includes(cs.mode)) {
                      if (!state.highScores[cs.mode] || cs.score > state.highScores[cs.mode]) {
                          state.highScores[cs.mode] = cs.score;
                          changed = true;
                      }
                  }
              });

              if (changed) {
                  this.save(state);
              }

              // Push any local high scores that beat cloud
              for (const mode of this.VALID_MODES) {
                  const localScore = state.highScores[mode];
                  const cloudEntry = cloudScores.find((cs: any) => cs.mode === mode);
                  if (!cloudEntry || localScore > cloudEntry.score) {
                      // @ts-ignore
                      const platform = window.Capacitor ? (window.Capacitor.getPlatform() === 'ios' ? 'ios' : 'android') : 'android';
                      
                      await supabase.from('scores').upsert({
                          user_id: user.id,
                          mode: mode,
                          score: localScore,
                          platform: platform
                      }, { onConflict: 'user_id,mode' });
                  }
              }
          }
      } catch (e) {
          console.error("Sync failed", e);
      }
  }

  static clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}