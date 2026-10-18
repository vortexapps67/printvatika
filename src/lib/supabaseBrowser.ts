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
  cached = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: true, autoRefreshToken: true } }
  );
  return cached;
}