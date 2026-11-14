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
  sendOtp: (target: string, type: 'phone' | 'email', name?: string) => Promise<{ success: boolean; error?: string }>;
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
    if (!supabase) {
      // Supabase credentials not set, fallback to local customer session
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
      return;
    }

    // 1. Initial Supabase session
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setSession(data.session);
        setUser(data.session.user);
        setLoading(false);
      } else {
        // 2. Check local session fallback
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

    // Listen for Supabase session changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) setUser(s.user);
    });

    return () => {
      listener?.subscription?.unsubscribe();
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
    if (!supabase) {
      return { error: 'Authentication service not configured. Please use OTP login.' };
    }
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
    if (!supabase) {
      return { error: 'Authentication service not configured. Please use OTP login.' };
    }
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message ?? null };
    } catch (e: any) {
      return { error: e?.message || 'Could not reach the sign-in service. Please try again.' };
    }
  };

  /**
   * Sends OTP - uses Supabase Auth natively for email OTP!
   */
  const sendOtp = async (target: string, type: 'phone' | 'email', name?: string) => {
    const cleanTarget = target.trim();

    // 1. Native Supabase Email OTP Auth
    if (type === 'email') {
      try {
        const supabase = getBrowserSupabase();
        if (supabase) {
          const { error } = await supabase.auth.signInWithOtp({
            email: cleanTarget.toLowerCase(),
            options: {
              shouldCreateUser: true,
              data: name ? { full_name: name } : undefined,
            },
          });

          if (error) {
            console.warn('Supabase signInWithOtp error:', error);
            return { success: false, error: error.message };
          }

          return { success: true };
        }
      } catch (err: any) {
        console.warn('Supabase email OTP error:', err);
      }
    }

    // 2. Phone OTP via Supabase (if configured) or Server Gateway
    if (type === 'phone') {
      try {
        const supabase = getBrowserSupabase();
        if (supabase) {
          const digits = cleanTarget.replace(/\D/g, '');
          const phoneFormatted = digits.length === 10 ? `+91${digits}` : (cleanTarget.startsWith('+') ? cleanTarget : `+${digits}`);
          const { error } = await supabase.auth.signInWithOtp({
            phone: phoneFormatted,
            options: { shouldCreateUser: true },
          });

          if (!error) {
            return { success: true };
          }
        }
      } catch {}
    }

    // 3. Fallback to API route
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: cleanTarget, type }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to send OTP.' };
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Network error sending OTP.' };
    }
  };

  /**
   * Verifies OTP - verifies natively with Supabase Auth for email!
   */
  const verifyOtp = async (target: string, type: 'phone' | 'email', code: string, name?: string) => {
    const cleanTarget = target.trim();
    const cleanCode = code.trim();

    // 1. Native Supabase Email OTP Verification
    if (type === 'email') {
      try {
        const supabase = getBrowserSupabase();
        if (supabase) {
          // Try type 'email'
          let { data, error } = await supabase.auth.verifyOtp({
            email: cleanTarget.toLowerCase(),
            token: cleanCode,
            type: 'email',
          });

          // If not found with type 'email', try 'signup'
          if (error || !data?.user) {
            const retrySignup = await supabase.auth.verifyOtp({
              email: cleanTarget.toLowerCase(),
              token: cleanCode,
              type: 'signup',
            });
            if (!retrySignup.error && retrySignup.data?.user) {
              data = retrySignup.data;
              error = null;
            }
          }

          if (error) {
            return { success: false, error: error.message };
          }

          if (data?.user) {
            setUser(data.user);
            setSession(data.session);
            return { success: true, user: data.user };
          }
        }
      } catch (err: any) {
        console.warn('Supabase verifyOtp error:', err);
      }
    }

    // 2. Phone OTP Verification via Supabase
    if (type === 'phone') {
      try {
        const supabase = getBrowserSupabase();
        if (supabase) {
          const digits = cleanTarget.replace(/\D/g, '');
          const phoneFormatted = digits.length === 10 ? `+91${digits}` : (cleanTarget.startsWith('+') ? cleanTarget : `+${digits}`);
          const { data, error } = await supabase.auth.verifyOtp({
            phone: phoneFormatted,
            token: cleanCode,
            type: 'sms',
          });

          if (!error && data?.user) {
            setUser(data.user);
            setSession(data.session);
            return { success: true, user: data.user };
          }
        }
      } catch {}
    }

    // 3. Fallback to API route
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: cleanTarget, type, code: cleanCode, name }),
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
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }
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
