// lib/auth-utils.ts
import { supabase } from './supabase';

export const authUtils = {
  // Простой вход
  async signIn(email: string, password: string) {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  },
  
  // Регистрация
  async signUp(email: string, password: string, metadata?: any) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });
  },
  
  // Выход
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (!error && typeof window !== 'undefined') {
      window.location.href = '/';
    }
    return { error };
  },
};

// Или экспортируйте функции по отдельности
export const signIn = authUtils.signIn;
export const signUp = authUtils.signUp;
export const signOut = authUtils.signOut;