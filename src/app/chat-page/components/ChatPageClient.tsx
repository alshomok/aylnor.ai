'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ChatSidebar from './ChatSidebar';
import ChatMain from './ChatMain';
import { useAuth } from '@/contexts/auth-context';
import { supabaseChatService, Message as SupabaseMessage, Conversation as SupabaseConversation } from '@/lib/supabase-chat';

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

interface ChatPageClientProps {
  chatId: string;
}

export default function ChatPageClient({ chatId }: ChatPageClientProps) {
  const { user, onAuthStateChange } = useAuth();
  const router = useRouter();
  
  // Local state for chat management
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>(chatId);
  const [isLoading, setIsLoading] = useState(true);
  
  // Local state for UI-only properties
  const [theme, setTheme] = useState<Theme>('dark');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMode, setActiveMode] = useState<BotMode>('thoughtful');
  const [showCodePanel, setShowCodePanel] = useState(true);
  const [botName, setBotName] = useState('aylnor');
  const [botPersonality, setBotPersonality] = useState('مساعد مفيد ودقيق وأكاديمي');
  const [username, setUsername] = useState('');
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
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

  // Sync activeConvId with chatId prop (from URL)
  useEffect(() => {
    if (chatId && chatId !== activeConvId) {
      setActiveConvId(chatId);
    }
  }, [chatId, activeConvId]);

  // Load conversations when user changes
  useEffect(() => {
    if (user?.id) {
      loadConversations();
    }
  }, [user?.id]);

  // Load messages when activeConvId changes
  useEffect(() => {
    if (activeConvId) {
      loadMessages();
    }
  }, [activeConvId]);

  // Load conversations from Supabase
  const loadConversations = async () => {
    if (!user?.id) return;
    
    try {
      const convs = await supabaseChatService.getConversations(user.id);
      const formattedConversations: Conversation[] = convs.map(conv => ({
        id: conv.id,
        title: conv.title,
        lastMessage: '',
        timestamp: new Date(conv.updated_at).toLocaleTimeString('ar-SA', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        mode: conv.mode,
      }));
      setConversations(formattedConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  // Load messages from Supabase
  const loadMessages = async () => {
    if (!activeConvId) {
      setMessages([]);
      return;
    }

    setIsMessagesLoading(true);
    try {
      const msgs = await supabaseChatService.getMessages(activeConvId);
      const formattedMessages: Message[] = msgs.map(msg => ({
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
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    } finally {
      setIsMessagesLoading(false);
    }
  };

  // Register auth state change callback
  useEffect(() => {
    if (onAuthStateChange) {
      const handleAuthStateChange = (event: string, session: any) => {
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          if (session?.user?.id) {
            loadConversations();
            setIsLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          setMessages([]);
          setConversations([]);
          setActiveConvId('');
          setIsLoading(false);
        }
      };

      onAuthStateChange(handleAuthStateChange);
    }
  }, [onAuthStateChange]);

  const createNewConversation = async (): Promise<string | null> => {
    if (!user?.id) {
      console.warn('No user ID available');
      return null;
    }

    try {
      const newConv = await supabaseChatService.createConversation(
        user.id,
        'محادثة جديدة',
        activeMode
      );

      if (newConv) {
        const formattedConv: Conversation = {
          id: newConv.id,
          title: newConv.title,
          lastMessage: '',
          timestamp: 'الآن',
          mode: newConv.mode,
        };
        setConversations([formattedConv, ...conversations]);
        setActiveConvId(newConv.id);
        setMessages([]);
        router.push(`/chat-page?id=${newConv.id}`);
        return newConv.id;
      }
      return null;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    if (conversationId === activeConvId) return;
    setActiveConvId(conversationId);
    router.push(`/chat-page?id=${conversationId}`);
  };

  const handleSendMessage = async (content: string) => {
    if (!user?.id || !activeConvId) return;

    // Add user message to state
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      mode: activeMode,
      timestamp: new Date().toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    setMessages([...messages, userMessage]);

    // Save user message to Supabase
    await supabaseChatService.saveMessage(activeConvId, 'user', content, activeMode);

    // Update conversation timestamp
    await supabaseChatService.updateConversationTimestamp(activeConvId);
  };

  if (isLoading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-muted-foreground">جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${themeClass} flex h-[100dvh] w-full overflow-hidden bg-background text-foreground`}
      dir="rtl"
    >
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-[80%] max-w-[300px] bg-[#0b121f] md:hidden">
          <ChatSidebar
            open={true}
            onToggle={() => setMobileSidebarOpen(false)}
            conversations={conversations}
            setConversations={setConversations}
            activeConvId={activeConvId}
            setActiveConvId={setActiveConvId}
            theme={theme}
            onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            botName={botName}
            onBotNameChange={setBotName}
            botPersonality={botPersonality}
            onBotPersonalityChange={setBotPersonality}
            username={username}
            onUsernameChange={setUsername}
            onNewChat={createNewConversation}
            mobileOpen={true}
            onMobileClose={() => setMobileSidebarOpen(false)}
          />
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className={`hidden md:flex transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
        <ChatSidebar
          open={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          conversations={conversations}
          setConversations={setConversations}
          activeConvId={activeConvId}
          setActiveConvId={setActiveConvId}
          theme={theme}
          onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          botName={botName}
          onBotNameChange={setBotName}
          botPersonality={botPersonality}
          onBotPersonalityChange={setBotPersonality}
          username={username}
          onUsernameChange={setUsername}
          onNewChat={createNewConversation}
          mobileOpen={false}
          onMobileClose={() => {}}
        />
      </div>

      {/* Chat Main Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
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
          onSendMessage={handleSendMessage}
          mobileSidebarOpen={mobileSidebarOpen}
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          mobileTab={mobileTab}
          onMobileTabChange={setMobileTab}
        />
      </div>
    </div>
  );
}
