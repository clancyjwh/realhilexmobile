import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://avijzlkdukanneylvtrd.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2aWp6bGtkdWthbm5leWx2dHJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMzUxNTUsImV4cCI6MjA3NjkxMTE1NX0.w6C4WuyugBoZdFxp6kxPEUuMVgqIaokkhrTyck7hzTY';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
