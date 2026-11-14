/* ─────────────────────────────────────────────────────────────────────────────
   Browser-side Supabase client.

   Uses the publishable (anon) key, which is safe to ship to the browser. This
   is the client that drives customer sign-in / sign-up / sign-out; the server
   still talks to Supabase through the secret key in supabaseStore.ts.
   ───────────────────────────────────────────────────────────────────────────── */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null = null;

export function isBrowserSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return Boolean(url && anonKey && !/your-|YOUR_|placeholder/i.test(anonKey));
}

export function getBrowserSupabase(): SupabaseClient | null {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !anonKey || /your-|YOUR_|placeholder/i.test(anonKey)) {
    return null;
  }
  try {
    cached = createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
    return cached;
  } catch (err) {
    console.warn('Failed to initialize browser Supabase client:', err);
    return null;
  }
}
