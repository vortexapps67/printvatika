/* ─────────────────────────────────────────────────────────────────────────────
   Browser-side Supabase client.

   Uses the publishable (anon) key, which is safe to ship to the browser. This
   is the client that drives customer sign-in / sign-up / sign-out; the server
   still talks to Supabase through the secret key in supabaseStore.ts.
   ───────────────────────────────────────────────────────────────────────────── */
import { createClient } from '@supabase/supabase-js';

let cached: ReturnType<typeof createClient> | null = null;

export function getBrowserSupabase() {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !anonKey) {
    throw new Error('Supabase public credentials not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }
  cached = createClient(
    url,
    anonKey,
    { auth: { persistSession: true, autoRefreshToken: true } }
  );
  return cached;
}