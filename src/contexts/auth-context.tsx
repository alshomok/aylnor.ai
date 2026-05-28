'use client';
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null; session: Session | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  checkIpLogin: () => Promise<boolean>;
  onAuthStateChange: (callback: (event: string, session: Session | null) => void) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const authStateChangeCallbackRef = useRef<((event: string, session: Session | null) => void) | undefined>(undefined);

  useEffect(() => {
    // Get initial session
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        // Trigger callback for initial session
        if (authStateChangeCallbackRef.current) {
          authStateChangeCallbackRef.current('INITIAL_SESSION', session);
        }
      });

      // Listen for auth changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        // Trigger callback for auth state changes
        if (authStateChangeCallbackRef.current) {
          authStateChangeCallbackRef.current(event, session);
        }
      });

      return () => subscription.unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!supabase) {
      return { error: { message: 'Supabase not initialized' } as AuthError, session: null };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/sign-up-login-screen`,
        },
      });

      // Log detailed error information for debugging
      if (error) {
        console.error('Signup error details:', {
          message: error.message,
          status: error.status,
          name: error.name,
          fullError: JSON.stringify(error, null, 2),
        });
      }

      // User profile is created automatically by database trigger
      return { error, session: data?.session || null };
    } catch (err) {
      console.error('Unexpected signup error:', err);
      return { error: { message: 'An unexpected error occurred during signup' } as AuthError, session: null };
    }
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

      if (!supabase) {
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
      // Clear all localStorage items related to the current user's conversations
      if (user?.id) {
        localStorage.removeItem(`lastConvId_${user.id}`);
      }
      
      // Clear all conversation-related localStorage items to prevent data leaks
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('lastConvId_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      await supabase.auth.signOut();
    }
  };

  const setAuthStateChangeCallback = (callback: (event: string, session: Session | null) => void) => {
    authStateChangeCallbackRef.current = callback;
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, checkIpLogin, onAuthStateChange: setAuthStateChangeCallback }}>
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
