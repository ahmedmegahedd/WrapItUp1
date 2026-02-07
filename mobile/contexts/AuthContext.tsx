import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { getSession, onAuthStateChange, signIn as supabaseSignIn, signUp as supabaseSignUp, signOut as supabaseSignOut } from '@/lib/supabase';

type AuthContextType = {
  session: Session | null;
  loading: boolean;
  signedIn: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setLoading(false);
    });

    const result = onAuthStateChange((_event, s) => {
      setSession(s);
    });
    const subscription = result?.data?.subscription;

    return () => subscription?.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabaseSignIn(email, password);
      return { error: error ? new Error(error.message) : null };
    } catch (e) {
      return { error: e instanceof Error ? e : new Error('Sign in failed') };
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      const { error } = await supabaseSignUp(email, password, name ? { name } : undefined);
      return { error: error ? new Error(error.message) : null };
    } catch (e) {
      return { error: e instanceof Error ? e : new Error('Sign up failed') };
    }
  };

  const signOut = async () => {
    await supabaseSignOut();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        signedIn: !!session?.user,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
