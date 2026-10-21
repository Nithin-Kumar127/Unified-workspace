import { createClient, type RealtimeClientOptions } from '@supabase/supabase-js';
import WebSocket from 'ws';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  '';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL and a Supabase API key must be configured.');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
  global: {
    fetch,
  },
  realtime: {
    transport: WebSocket as unknown as NonNullable<RealtimeClientOptions['transport']>,
  },
});