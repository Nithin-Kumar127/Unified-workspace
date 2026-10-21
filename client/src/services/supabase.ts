import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

let supabaseClient: SupabaseClient | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL and anon key are required for Google sign-in.');
  }

  supabaseClient ??= createClient(supabaseUrl, supabaseKey);
  return supabaseClient;
};
