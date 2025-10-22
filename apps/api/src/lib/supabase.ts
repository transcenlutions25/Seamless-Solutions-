import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

export const supabase = createClient(
  config.supabase.url || 'https://placeholder.supabase.co',
  config.supabase.serviceRoleKey || 'placeholder-service-key',
  {
    auth: {
      persistSession: false,
    },
  }
);

export const supabaseAdmin = createClient(
  config.supabase.url || 'https://placeholder.supabase.co',
  config.supabase.serviceRoleKey || 'placeholder-service-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

export default supabase;