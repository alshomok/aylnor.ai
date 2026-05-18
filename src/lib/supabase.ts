import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Client-side Supabase client (uses anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side Supabase client (uses service role key to bypass RLS)
export const supabaseServer = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export type Database = {
  public: {
    Tables: {
      conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          mode: 'quick' | 'thoughtful' | 'programming';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          mode: 'quick' | 'thoughtful' | 'programming';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          mode?: 'quick' | 'thoughtful' | 'programming';
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: 'user' | 'bot';
          content: string;
          mode?: 'quick' | 'thoughtful' | 'programming';
          code_block?: {
            language: string;
            code: string;
          };
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: 'user' | 'bot';
          content: string;
          mode?: 'quick' | 'thoughtful' | 'programming';
          code_block?: {
            language: string;
            code: string;
          };
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          role?: 'user' | 'bot';
          content?: string;
          mode?: 'quick' | 'thoughtful' | 'programming';
          code_block?: {
            language: string;
            code: string;
          };
          created_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          username: string;
          bot_name: string;
          bot_personality: string;
          theme: 'dark' | 'light';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          username: string;
          bot_name?: string;
          bot_personality?: string;
          theme?: 'dark' | 'light';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          username?: string;
          bot_name?: string;
          bot_personality?: string;
          theme?: 'dark' | 'light';
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
