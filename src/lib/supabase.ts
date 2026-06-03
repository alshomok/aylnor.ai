import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Client-side Supabase client (uses anon key)
// Safely initialize - return null if env vars are missing
export const supabase: SupabaseClient | null = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'supabase.auth.token',
      },
    })
  : null;

// Log warning if env vars are missing
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Server-side Supabase client (uses service role key to bypass RLS)
let supabaseServerInstance: SupabaseClient | null = null;

export const supabaseServer = (): SupabaseClient | null => {
  if (supabaseServerInstance) {
    return supabaseServerInstance;
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase server environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    return null;
  }

  supabaseServerInstance = createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  return supabaseServerInstance;
};

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
          ip_address: string;
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
          ip_address?: string;
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
          ip_address?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      knowledge_base: {
        Row: {
          id: string;
          filename: string;
          file_type: string;
          file_url: string;
          extracted_text: string;
          source: string;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          filename: string;
          file_type: string;
          file_url: string;
          extracted_text: string;
          source: 'upload' | 'google_drive';
          created_at?: string;
        };
        Update: {
          id?: string;
          filename?: string;
          file_type?: string;
          file_url?: string;
          extracted_text?: string;
          source?: 'upload' | 'google_drive';
          created_at?: string;
        };
      };
      token_usage: {
        Row: {
          id: string;
          user_id: string;
          mode: 'quick' | 'thoughtful' | 'programming';
          tokens_used: number;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          mode: 'quick' | 'thoughtful' | 'programming';
          tokens_used: number;
          date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          mode?: 'quick' | 'thoughtful' | 'programming';
          tokens_used?: number;
          date?: string;
          created_at?: string;
        };
      };
      educational_files: {
        Row: {
          id: number;
          title: string;
          description: string | null;
          drive_id: string;
          download_link: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          title: string;
          description?: string;
          drive_id: string;
          download_link?: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          title?: string;
          description?: string;
          drive_id?: string;
          download_link?: string;
          created_at?: string;
        };
      };
    };
  };
};
