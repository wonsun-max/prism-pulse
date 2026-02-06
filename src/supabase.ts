import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isPlaceholder = (val: string) => !val || val.includes('YOUR_SUPABASE');

// Only create the client if we have valid-looking credentials
export const supabase = (!isPlaceholder(supabaseUrl) && !isPlaceholder(supabaseAnonKey)) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null as any;

if (!supabase) {
  console.warn('Supabase is not initialized. Cloud features (Leaderboard/Login) will be disabled. Update your .env file and restart the server.');
}
