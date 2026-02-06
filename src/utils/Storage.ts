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
        return {
          ...defaultState,
          ...parsed,
          highScores: { ...defaultState.highScores, ...(parsed.highScores || {}) },
          sessions: { ...defaultState.sessions, ...(parsed.sessions || {}) }
        };
      }
    } catch (e) {
      console.warn('Failed to load game state', e);
    }
    return defaultState;
  }

    static async saveHighScore(mode: string, score: number): Promise<void> {
        const state = this.load();
        if (!state.highScores[mode] || score > state.highScores[mode]) {
            state.highScores[mode] = score;
            this.save(state);
  
            // Push to Supabase if logged in and initialized
            if (supabase) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const platform = navigator.userAgent.toLowerCase().includes('iphone') || 
                                     navigator.userAgent.toLowerCase().includes('ipad') ? 'ios' : 'android';
                    
                    await supabase.from('scores').upsert({
                        user_id: user.id,
                        mode: mode,
                        score: score,
                        platform: platform
                    }, { onConflict: 'user_id,mode' });
                }
            }
        }
    }
    static getHighScore(mode: string): number {
      const state = this.load();
      return state.highScores[mode] || 0;
  }

  static saveSession(mode: string, session: GameSession | null): void {
      const state = this.load();
      state.sessions[mode] = session;
      this.save(state);
  }

  static getSession(mode: string): GameSession | null {
      const state = this.load();
      return state.sessions[mode] || null;
  }

  static async syncWithCloud(): Promise<void> {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch Cloud Scores
      const { data: cloudScores } = await supabase
          .from('scores')
          .select('mode, score')
          .eq('user_id', user.id);

      if (cloudScores) {
          const state = this.load();
          let changed = false;

          cloudScores.forEach(cs => {
              if (!state.highScores[cs.mode] || cs.score > state.highScores[cs.mode]) {
                  state.highScores[cs.mode] = cs.score;
                  changed = true;
              }
          });

          if (changed) {
              this.save(state);
          }

          // 2. Push any local scores that are higher than cloud
          for (const mode in state.highScores) {
              const localScore = state.highScores[mode];
              const cloudEntry = cloudScores.find(cs => cs.mode === mode);
              if (!cloudEntry || localScore > cloudEntry.score) {
                  const platform = navigator.userAgent.toLowerCase().includes('iphone') || 
                                   navigator.userAgent.toLowerCase().includes('ipad') ? 'ios' : 'android';
                  
                  await supabase.from('scores').upsert({
                      user_id: user.id,
                      mode: mode,
                      score: localScore,
                      platform: platform
                  }, { onConflict: 'user_id,mode' });
              }
          }
      }
  }

  static clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}
