import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabase';

// Types
export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'bot';
  content: string;
  mode: 'quick' | 'thoughtful' | 'programming';
  code_block?: { language: string; code: string };
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  mode: 'quick' | 'thoughtful' | 'programming';
  created_at: string;
  updated_at: string;
}

// Clean Supabase Chat Service
export class SupabaseChatService {
  private supabase = supabase;

  // Get all conversations for a user
  async getConversations(userId: string): Promise<Conversation[]> {
    try {
      const { data, error } = await this.supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  }

  // Get messages for a conversation
  async getMessages(conversationId: string): Promise<Message[]> {
    try {
      const { data, error } = await this.supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  // Create a new conversation
  async createConversation(userId: string, title: string, mode: 'quick' | 'thoughtful' | 'programming'): Promise<Conversation | null> {
    try {
      const { data, error } = await this.supabase
        .from('conversations')
        .insert({
          user_id: userId,
          title,
          mode,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  }

  // Save a message
  async saveMessage(conversationId: string, role: 'user' | 'bot', content: string, mode: 'quick' | 'thoughtful' | 'programming', codeBlock?: { language: string; code: string }): Promise<Message | null> {
    try {
      const { data, error } = await this.supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role,
          content,
          mode,
          code_block: codeBlock,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving message:', error);
      return null;
    }
  }

  // Update conversation timestamp
  async updateConversationTimestamp(conversationId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating conversation timestamp:', error);
    }
  }

  // Delete a conversation
  async deleteConversation(conversationId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return false;
    }
  }

  // Delete all messages in a conversation
  async deleteConversationMessages(conversationId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting messages:', error);
      return false;
    }
  }
}

// Export singleton instance
export const supabaseChatService = new SupabaseChatService();
