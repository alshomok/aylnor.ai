'use client';
import React, { useState, useEffect } from 'react';
import ChatSidebar from './ChatSidebar';
import ChatMain from './ChatMain';
import { useAuth } from '@/contexts/auth-context';

export type BotMode = 'quick' | 'thoughtful' | 'programming';
export type Theme = 'dark' | 'light';

export interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  mode?: BotMode;
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
  timestamp: string;
  mode: BotMode;
}

export default function ChatPageClient() {
  const { user, onAuthStateChange } = useAuth();
  const [theme, setTheme] = useState<Theme>('dark');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMode, setActiveMode] = useState<BotMode>('thoughtful');
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [showCodePanel, setShowCodePanel] = useState(true);
  const [botName, setBotName] = useState('aylnor');
  const [botPersonality, setBotPersonality] = useState('مساعد مفيد ودقيق وأكاديمي');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'chat' | 'code'>('chat');

  const themeClass = theme === 'light' ? 'light' : '';

  // Load user data from Supabase Auth
  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setUsername(user.user_metadata.full_name);
    } else if (user?.email) {
      setUsername(user.email.split('@')[0]);
    }
  }, [user]);

  // Register auth state change callback for historical data hydration
  useEffect(() => {
    if (onAuthStateChange) {
      const handleAuthStateChange = (event: string, session: any) => {
        console.log('Auth state changed:', event, 'Session:', !!session);
        
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          if (session?.user?.id) {
            console.log('User signed in, loading historical data');
            // Restore last active conversation from localStorage
            const savedConvId = localStorage.getItem(`lastConvId_${session.user.id}`) || undefined;
            if (savedConvId) {
              console.log('Restoring last conversation:', savedConvId);
              setActiveConvId(savedConvId);
            }
            loadConversations(savedConvId);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out, clearing all local state');
          // Clear all local state
          setConversations([]);
          setMessages([]);
          setActiveConvId('');
          setIsLoading(false);
        }
      };

      onAuthStateChange(handleAuthStateChange);
    }
  }, [onAuthStateChange]);

  // Load conversations whenever user changes (login/logout) - fallback for direct user changes
  useEffect(() => {
    console.log('User ID changed:', user?.id);
    if (user?.id) {
      // This is handled by auth state change callback, but we keep this as fallback
      const savedConvId = localStorage.getItem(`lastConvId_${user.id}`) || undefined;
      if (!isLoading) {
        loadConversations(savedConvId);
      }
    }
  }, [user?.id]);

  const loadConversations = async (savedConvId?: string) => {
    if (!user?.id) {
      console.warn('No user ID available');
      setIsLoading(false);
      return;
    }

    console.log('Loading conversations for user:', user.id);
    console.log('Saved conversation ID:', savedConvId);
    try {
      const response = await fetch(`/api/conversations?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Conversations loaded:', data.conversations?.length || 0);
        if (data.conversations && data.conversations.length > 0) {
          setConversations(data.conversations);
          // Use saved conversation ID if provided and exists in list
          let targetConvId = data.conversations[0].id;
          if (savedConvId && data.conversations.some((c: Conversation) => c.id === savedConvId)) {
            targetConvId = savedConvId;
            console.log('Using saved conversation ID:', targetConvId);
          } else {
            console.log('Saved conversation ID not found, using first conversation:', targetConvId);
          }
          setActiveConvId(targetConvId);
          // Save the selected conversation to localStorage
          localStorage.setItem(`lastConvId_${user.id}`, targetConvId);
          loadMessages(targetConvId);
        } else {
          console.log('No conversations found, creating new one');
          // Create initial conversation if none exists
          createNewConversation();
        }
      } else {
        console.error('Failed to load conversations, status:', response.status);
        // Fallback to local state if API fails
        createNewConversation();
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      createNewConversation();
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/messages?conversationId=${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.messages) {
          const formattedMessages: Message[] = data.messages.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            mode: msg.mode,
            timestamp: new Date(msg.created_at).toLocaleTimeString('ar-SA', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            codeBlock: msg.code_block,
          }));
          setMessages(formattedMessages);
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const createNewConversation = async (): Promise<string | null> => {
    if (!user?.id) {
      console.warn('No user ID available');
      return null;
    }

    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          title: 'محادثة جديدة',
          mode: activeMode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to create conversation:', response.status, errorData);
        // Use fallback local state if error
        const newId = `conv-${Date.now()}`;
        const newConv: Conversation = {
          id: newId,
          title: 'محادثة جديدة',
          lastMessage: '',
          timestamp: 'الآن',
          mode: activeMode,
        };
        setConversations([newConv]);
        setActiveConvId(newId);
        setMessages([]);
        return newId;
      }

      const data = await response.json();
      const conversationId = data.conversation.id;
      const newConv: Conversation = {
        id: conversationId,
        title: data.conversation.title,
        lastMessage: '',
        timestamp: 'الآن',
        mode: data.conversation.mode,
      };
      setConversations([newConv]);
      setActiveConvId(conversationId);
      // Save to localStorage for persistence
      if (user?.id) {
        localStorage.setItem(`lastConvId_${user.id}`, conversationId);
      }
      setMessages([]);
      console.debug('Conversation created successfully:', conversationId);
      return conversationId;
    } catch (error) {
      console.error('Error creating conversation:', error);
      // Fallback to local state
      const newId = `conv-${Date.now()}`;
      const newConv: Conversation = {
        id: newId,
        title: 'محادثة جديدة',
        lastMessage: '',
        timestamp: 'الآن',
        mode: activeMode,
      };
      setConversations([newConv]);
      setActiveConvId(newId);
      setMessages([]);
      console.debug('Using fallback conversation ID:', newId);
      return newId;
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    setActiveConvId(conversationId);
    // Save to localStorage for persistence
    if (user?.id) {
      localStorage.setItem(`lastConvId_${user.id}`, conversationId);
    }
    loadMessages(conversationId);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-muted-foreground">جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${themeClass} flex h-screen overflow-hidden bg-background text-foreground`}
      dir="rtl"
    >
      <ChatMain
        messages={messages}
        setMessages={setMessages}
        activeMode={activeMode}
        setActiveMode={setActiveMode}
        showCodePanel={showCodePanel}
        setShowCodePanel={setShowCodePanel}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        botName={botName}
        activeConvId={activeConvId}
        conversations={conversations}
        setConversations={setConversations}
        onCreateConversation={createNewConversation}
        mobileSidebarOpen={mobileSidebarOpen}
        onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        mobileTab={mobileTab}
        onMobileTabChange={setMobileTab}
      />
      <ChatSidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        conversations={conversations}
        activeConvId={activeConvId}
        onSelectConversation={handleSelectConversation}
        theme={theme}
        onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        botName={botName}
        onBotNameChange={setBotName}
        botPersonality={botPersonality}
        onBotPersonalityChange={setBotPersonality}
        username={username}
        onUsernameChange={setUsername}
        onNewChat={createNewConversation}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
    </div>
  );
}
