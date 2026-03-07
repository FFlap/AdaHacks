import { createClient } from '@supabase/supabase-js';

export function createAuthClient(env) {
  return createClient(env.supabaseUrl, env.supabasePublishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false
    }
  });
}

export function createRequestClient(env, token) {
  return createClient(env.supabaseUrl, env.supabasePublishableKey, {
    accessToken: async () => token,
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false
    }
  });
}
