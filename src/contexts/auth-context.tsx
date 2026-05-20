'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  checkIpLogin: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      });

      // Listen for auth changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!supabase) {
      return { error: { message: 'Supabase not initialized' } as AuthError };
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    // User profile is created automatically by database trigger
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { error: { message: 'Supabase not initialized' } as AuthError };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error) {
      // Store IP address after successful login
      try {
        const ipResponse = await fetch('/api/get-ip');
        const ipData = await ipResponse.json();
        if (ipData.ip && ipData.ip !== 'unknown' && supabase) {
          await supabase
            .from('users')
            .update({ ip_address: ipData.ip })
            .eq('email', email);
        }
      } catch (err) {
        console.error('Error storing IP:', err);
      }
    }

    return { error };
  };

  const checkIpLogin = async (): Promise<boolean> => {
    try {
      const ipResponse = await fetch('/api/get-ip');
      const ipData = await ipResponse.json();
      
      if (!ipData.ip || ipData.ip === 'unknown') {
        return false;
      }

      const { data: userData, error } = await supabase
        .from('users')
        .select('email')
        .eq('ip_address', ipData.ip)
        .single();

      if (error || !userData) {
        return false;
      }

      // Auto-login with the found user's email
      // Note: We can't auto-login with password, so we need to redirect to login with email pre-filled
      return true;
    } catch (err) {
      console.error('Error checking IP login:', err);
      return false;
    }
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, checkIpLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
