import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.warn('Warning: NEXT_PUBLIC_SUPABASE_URL is not defined');
}

if (!supabaseAnonKey) {
  console.warn('Warning: NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined');
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Critical: Missing required Supabase environment variables (URL and Anon Key)');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

// Service role client for admin operations
// Returns null if service role key is not available
export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(
      supabaseUrl || '',
      supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
  : (() => {
      console.warn('Warning: SUPABASE_SERVICE_ROLE_KEY is not defined. Admin operations will not be available.');
      return null;
    })();

// Database types
export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  bot_name: string;
  bot_style: 'formal' | 'friendly' | 'concise';
  focus_area: string;
  created_at: string;
  updated_at: string;
}

export interface ApiUsage {
  id: string;
  user_id: string;
  tool_used: string;
  tokens_used: number;
  created_at: string;
}
