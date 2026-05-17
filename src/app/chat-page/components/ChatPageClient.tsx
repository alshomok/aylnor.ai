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
}

export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  mode: BotMode;
}

export default function ChatPageClient() {
  const { user } = useAuth();
  const [theme, setTheme] = useState<Theme>('dark');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMode, setActiveMode] = useState<BotMode>('thoughtful');
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [showCodePanel, setShowCodePanel] = useState(true);
  const [botName, setBotName] = useState('aylnor');
  const [botPersonality, setBotPersonality] = useState('مساعد مفيد ودقيق وأكاديمي');
  const [username, setUsername] = useState('أمارا أوسي');
  const [isLoading, setIsLoading] = useState(true);

  const themeClass = theme === 'light' ? 'light' : '';

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [user]);

  const loadConversations = async () => {
    if (!user?.id) {
      console.warn('No user ID available');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/conversations?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.conversations && data.conversations.length > 0) {
          setConversations(data.conversations);
          setActiveConvId(data.conversations[0].id);
          loadMessages(data.conversations[0].id);
        } else {
          // Create initial conversation if none exists
          createNewConversation();
        }
      } else {
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

  const createNewConversation = async () => {
    if (!user?.id) {
      console.warn('No user ID available');
      return;
    }

    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          title: 'محادثة جديدة',
          mode: activeMode,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newConv: Conversation = {
          id: data.conversation.id,
          title: data.conversation.title,
          lastMessage: '',
          timestamp: 'الآن',
          mode: data.conversation.mode,
        };
        setConversations([newConv]);
        setActiveConvId(newConv.id);
        setMessages([
          {
            id: `msg-${Date.now()}`,
            role: 'bot',
            content: `مرحباً! أنا ${botName}. كيف يمكنني مساعدتك اليوم؟`,
            mode: activeMode,
            timestamp: new Date().toLocaleTimeString('ar-SA', {
              hour: '2-digit',
              minute: '2-digit',
            }),
          },
        ]);
      }
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
      setMessages([
        {
          id: `msg-${Date.now()}`,
          role: 'bot',
          content: `مرحباً! أنا ${botName}. كيف يمكنني مساعدتك اليوم؟`,
          mode: activeMode,
          timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    setActiveConvId(conversationId);
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
      />
    </div>
  );
}
