import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  mode?: 'quick' | 'thoughtful' | 'programming';
  timestamp: string;
  codeBlock?: { language: string; code: string };
  fileCard?: {
    id: string;
    filename: string;
    file_type: string;
    file_url: string;
    description: string;
  };
}

export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  mode: 'quick' | 'thoughtful' | 'programming';
  created_at: string;
}

interface ChatStore {
  messages: Message[];
  conversations: Conversation[];
  activeConvId: string | null;
  isLoading: boolean;
  setMessages: (messages: Message[]) => void;
  setConversations: (conversations: Conversation[]) => void;
  setActiveConvId: (activeConvId: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  addMessage: (message: Message) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      messages: [],
      conversations: [],
      activeConvId: null,
      isLoading: false,
      setMessages: (messages) => set({ messages }),
      setConversations: (conversations) => set({ conversations }),
      setActiveConvId: (activeConvId) => set({ activeConvId }),
      setIsLoading: (isLoading) => set({ isLoading }),
      addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
      clearMessages: () => set({ messages: [] }),
    }),
    {
      name: 'aylnor-chat-storage',
    }
  )
);
