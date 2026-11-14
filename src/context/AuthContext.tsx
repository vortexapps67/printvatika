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
  sendOtp: (target: string, type: 'phone' | 'email') => Promise<{ success: boolean; demoCode?: string; error?: string }>;
  verifyOtp: (target: string, type: 'phone' | 'email', code: string, name?: string) => Promise<{ success: boolean; user?: any; error?: string }>;
  setCustomUser: (user: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getBrowserSupabase();

    // 1. Initial Supabase session
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setSession(data.session);
        setUser(data.session.user);
        setLoading(false);
      } else {
        // 2. Check local OTP session fallback
        if (typeof window !== 'undefined') {
          try {
            const stored = localStorage.getItem('vatika_customer_session');
            if (stored) {
              const parsed = JSON.parse(stored);
              const customUser: any = {
                id: parsed.id,
                email: parsed.email || '',
                phone: parsed.phone || '',
                user_metadata: {
                  full_name: parsed.name || '',
                  phone: parsed.phone || '',
                },
              };
              setUser(customUser);
            }
          } catch {}
        }
        setLoading(false);
      }
    });

    // Listen for Supabase changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) setUser(s.user);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const setCustomUser = (u: any) => {
    if (!u) {
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('vatika_customer_session');
      }
      return;
    }

    const formatted: any = {
      id: u.id,
      email: u.email || '',
      phone: u.phone || '',
      user_metadata: {
        full_name: u.name || '',
        phone: u.phone || '',
      },
    };
    setUser(formatted);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vatika_customer_session', JSON.stringify(u));
    }
  };

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

  const sendOtp = async (target: string, type: 'phone' | 'email') => {
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, type }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to send OTP.' };
      }
      return { success: true, demoCode: data.demoCode };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Network error sending OTP.' };
    }
  };

  const verifyOtp = async (target: string, type: 'phone' | 'email', code: string, name?: string) => {
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, type, code, name }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Verification failed.' };
      }
      setCustomUser(data.user);
      return { success: true, user: data.user };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Network error verifying OTP.' };
    }
  };

  const signOut = async () => {
    const supabase = getBrowserSupabase();
    try {
      await supabase.auth.signOut();
    } catch {}
    setCustomUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        sendOtp,
        verifyOtp,
        setCustomUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
