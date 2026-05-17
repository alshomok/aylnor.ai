import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
