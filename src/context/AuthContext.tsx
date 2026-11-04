'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { getBrowserSupabase } from '../lib/supabaseBrowser';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getBrowserSupabase();

    // Initial session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    const supabase = getBrowserSupabase();
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      return { error: error?.message ?? null };
    } catch (e: any) {
      /* A network-level failure (DNS, blocked request, offline) rejects rather
         than returning an error object — surface it instead of throwing through. */
      return { error: e?.message || 'Could not reach the sign-up service. Please try again.' };
    }
  };

  const signIn = async (email: string, password: string) => {
    const supabase = getBrowserSupabase();
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message ?? null };
    } catch (e: any) {
      return { error: e?.message || 'Could not reach the sign-in service. Please try again.' };
    }
  };

  const signOut = async () => {
    const supabase = getBrowserSupabase();
    try {
      await supabase.auth.signOut();
    } catch {
      /* Signing out must never block the UI. */
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};