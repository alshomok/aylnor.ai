'use client';
import React, { useState, useRef, useEffect } from 'react';
import {
  Zap,
  Brain,
  Code2,
  Send,
  PanelRight,
  PanelRightClose,
  Menu,
  Copy,
  Check,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  MessageSquare,
  Download,
} from 'lucide-react';
import { BotMode, Message, Conversation } from './ChatPageClient';
import CodeDisplayPanel from './CodeDisplayPanel';
import FileCard from './FileCard';
import CodeExecution from './CodeExecution';
import { FileDownloadCard } from './FileDownloadCard';
import { useAuth } from '@/contexts/auth-context';

interface ChatMainProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  activeMode: BotMode;
  setActiveMode: (mode: BotMode) => void;
  showCodePanel: boolean;
  setShowCodePanel: (v: boolean) => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  botName: string;
  activeConvId: string;
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  onCreateConversation: () => Promise<string | null>;
  mobileSidebarOpen: boolean;
  onToggleMobileSidebar: () => void;
  mobileTab: 'chat' | 'code';
  onMobileTabChange: (tab: 'chat' | 'code') => void;
}

const BOT_MODES: { id: BotMode; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'quick', label: 'سريع', icon: Zap, description: 'إجابات سريعة وموجزة' },
  { id: 'thoughtful', label: 'مفكر', icon: Brain, description: 'شروحات عميقة ومفصلة' },
  { id: 'programming', label: 'مبرمج', icon: Code2, description: 'أولوية الكود مع تمييز الصياغة' },
];

const MOCK_RESPONSES: Record<BotMode, (q: string) => Partial<Message>> = {
  quick: (q) => ({
    content: `إجابة سريعة: ${q.length > 30 ? q.slice(0, 30) + '…' : q} — باختصار، يتضمن هذا تطبيق المبدأ الأساسي مباشرة على المشكلة. الفكرة الرئيسية هي تقسيمها خطوة بخطوة.`,
    mode: 'quick',
  }),
  thoughtful: (q) => ({
    content: `دعني أعطيك شرحاً مفصلاً لـ "${q.slice(0, 40)}…"\n\nهذا موضوع دقيق يتطلب فهم المفاهيم الأساسية وتطبيقاتها العملية. أولاً، فكر في المبادئ الأساسية — فهي تشكل الأساس لكل ما يليها.\n\nأهم شيء يجب فهمه هنا هو السياق. بدونه، حتى الإجابات الصحيحة تقنياً يمكن أن تكون مضللة. دعني أرشدك عبر الطبقات الرئيسية بشكل منهجي.`,
    mode: 'thoughtful',
  }),
  programming: (q) => ({
    content: `إليك تطبيقاً نظيفاً لطلبك: "${q.slice(0, 30)}…"\n\nأضفت تعليقات توضيحية وأتبعت أفضل الممارسات. تعقيد الوقت O(n log n) وتعقيد المساحة O(n).`,
    mode: 'programming',
    codeBlock: {
      language: 'python',
      code: `def solve(data: list[int]) -> dict:
    """
    يعالج البيانات المدخلة ويعيد نتيجة منظمة.
    
    Args:
        data: قائمة أعداد صحيحة للمعالجة
        
    Returns:
        قاموس يحتوي على 'result' و 'metadata'
    """
    if not data:
        return {"result": [], "metadata": {"count": 0}}
    
    # المنطق الأساسي
    processed = sorted(set(data))  # O(n log n)
    result = {
        "result": processed,
        "metadata": {
            "count": len(processed),
            "min": min(processed),
            "max": max(processed),
            "mean": sum(processed) / len(processed),
        }
    }
    
    return result

# مثال على الاستخدام
data = [5, 3, 8, 3, 1, 9, 1, 7]
output = solve(data)
print(output)`,
    },
  }),
};

export default function ChatMain({
  messages,
  setMessages,
  activeMode,
  setActiveMode,
  showCodePanel,
  setShowCodePanel,
  sidebarOpen,
  onToggleSidebar,
  botName,
  activeConvId,
  conversations,
  setConversations,
  onCreateConversation,
  mobileSidebarOpen,
  onToggleMobileSidebar,
  mobileTab,
  onMobileTabChange,
}: ChatMainProps) {
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [activeCodeBlock, setActiveCodeBlock] = useState<{ language: string; code: string } | null>(
    messages.find((m) => m.codeBlock)?.codeBlock ?? null
  );
  const [renderKey, setRenderKey] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const [showModeDropdown, setShowModeDropdown] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Force re-render when messages prop changes
  useEffect(() => {
    console.debug('Messages prop changed:', messages.length);
    // Force a re-render by updating a dummy state
    setRenderKey(prev => prev + 1);
  }, [messages]);

  // Reset internal state when conversation changes
  useEffect(() => {
    console.debug('Conversation changed, resetting state:', activeConvId);
    console.debug('Messages prop updated:', messages.length, messages);
    setActiveCodeBlock(messages.find((m) => m.codeBlock)?.codeBlock ?? null);
    setIsTyping(false);
  }, [activeConvId, messages]);

  // Debug: log button state
  useEffect(() => {
    console.debug('Button state:', {
      isSending,
      hasContent: inputValue.trim().length > 0,
      hasUser: !!user?.id,
      hasConversation: !!activeConvId,
      userId: user?.id,
      conversationId: activeConvId,
    });
  }, [isSending, inputValue, user, activeConvId]);

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const content = inputValue.trim();
    if (!content || isSending) return;

    if (!user?.id) {
      console.warn('No user ID available');
      return;
    }

    // Create conversation if none exists and get the conversation ID
    let conversationId: string | null = activeConvId;
    if (!conversationId) {
      console.debug('Creating new conversation before sending message');
      conversationId = await onCreateConversation();
      if (!conversationId) {
        console.error('Failed to create conversation');
        return;
      }
    }

    console.debug('Sending message', { conversationId, mode: activeMode });

    // Store the conversation ID at the start of the send operation
    // to prevent race conditions if the user switches conversations
    const sendingConversationId = conversationId;

    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content,
      timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsSending(true);
    setIsTyping(true);

    if (activeConv?.title === 'محادثة جديدة') {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === sendingConversationId
            ? { ...c, title: content.slice(0, 40), lastMessage: content, mode: activeMode }
            : c
        )
      );
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          conversationId: sendingConversationId,
          mode: activeMode,
          botPersonality: 'مساعد مفيد ودقيق وأكاديمي',
          userId: user.id,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Send failed', errorText);
        throw new Error('Failed to get response');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let metadata = null;
      let metadataReceived = false;

      if (!reader) {
        throw new Error('No response body');
      }

      // Create bot message with empty content initially
      const botMsg: Message = {
        id: `msg-${Date.now()}-bot`,
        role: 'bot',
        content: '',
        mode: activeMode,
        timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;

        // Check for metadata separator
        if (fullContent.includes('__METADATA__')) {
          const [contentPart, metadataPart] = fullContent.split('__METADATA__');
          fullContent = contentPart;
          try {
            metadata = JSON.parse(metadataPart.trim());
            metadataReceived = true;
          } catch (e) {
            console.error('Failed to parse metadata:', e);
          }
        }

        // Always update message content with the current fullContent (excluding metadata)
        // This ensures content is displayed even if metadata arrives early
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMsg.id ? { ...msg, content: fullContent } : msg
          )
        );
      }

      // Final update with metadata
      if (metadata) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMsg.id
              ? {
                  ...msg,
                  codeBlock: metadata.codeBlock,
                  fileCard: metadata.fileCard,
                }
              : msg
          )
        );

        if (metadata.codeBlock) {
          setActiveCodeBlock(metadata.codeBlock);
          setShowCodePanel(true);
        }
      }

      console.debug('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      const botMsg: Message = {
        id: `msg-${Date.now()}-bot`,
        role: 'bot',
        content: 'عذراً، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.',
        mode: activeMode,
        timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsSending(false);
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isSending) sendMessage();
    }
  };

  const handleCopyMessage = (msgId: string, content: string) => {
    navigator.clipboard.writeText(content).catch(() => {});
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  };

  const renderMessageContent = (content: string) => {
    // Convert Google Drive links to FileDownloadCard
    const driveLinkRegex = /\[([^\]]+)\]\(https:\/\/drive\.google\.com\/uc\?export=download&id=([a-zA-Z0-9_-]+)\)/g;
    const parts: (string | React.ReactNode)[] = [];
    let lastIndex = 0;
    let match;

    while ((match = driveLinkRegex.exec(content)) !== null) {
      // Add text before the link
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }

      // Add FileDownloadCard instead of simple button
      const title = match[1];
      const driveId = match[2];
      const downloadUrl = `https://drive.google.com/uc?export=download&id=${driveId}`;

      // Determine file type based on title or extension
      let fileType: 'pdf' | 'excel' | 'word' | 'zip' | 'general' = 'general';
      if (title.toLowerCase().includes('.pdf') || title.toLowerCase().includes('pdf')) {
        fileType = 'pdf';
      } else if (title.toLowerCase().includes('.xlsx') || title.toLowerCase().includes('.xls') || title.toLowerCase().includes('excel') || title.toLowerCase().includes('شيت')) {
        fileType = 'excel';
      } else if (title.toLowerCase().includes('.docx') || title.toLowerCase().includes('.doc') || title.toLowerCase().includes('word')) {
        fileType = 'word';
      } else if (title.toLowerCase().includes('.zip') || title.toLowerCase().includes('.rar')) {
        fileType = 'zip';
      }

      parts.push(
        <FileDownloadCard
          key={`drive-card-${match.index}`}
          fileName={title}
          fileType={fileType}
          downloadUrl={downloadUrl}
          fileSize="غير معروف"
        />
      );

      lastIndex = match.index + match.length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    // Process bold text in string parts
    return parts.map((part, i) => {
      if (typeof part === 'string') {
        const boldParts = part.split(/\*\*(.+?)\*\*/g);
        return boldParts.map((boldPart, j) =>
          j % 2 === 1 ? (
            <strong key={`bold-${i}-${j}`} className="font-semibold text-foreground">
              {boldPart}
            </strong>
          ) : (
            <React.Fragment key={`text-${i}-${j}`}>{boldPart}</React.Fragment>
          )
        );
      }
      return part;
    });
  };

  return (
    <div className="flex flex-1 min-w-0 overflow-hidden">
      {/* Chat area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-2">
            {/* Mobile menu button */}
            <button
              onClick={onToggleMobileSidebar}
              className="md:hidden text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-white/5"
            >
              <Menu size={18} />
            </button>
            <button
              onClick={() => setShowCodePanel(!showCodePanel)}
              className={`hidden md:flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 ${
                showCodePanel
                  ? 'badge-blue border-royal-blue/30'
                  : 'text-muted-foreground border-border hover:border-royal-blue/30 hover:text-foreground'
              }`}
              title={showCodePanel ? 'إخفاء لوحة الكود' : 'إظهار لوحة الكود'}
            >
              {showCodePanel ? <PanelRightClose size={14} /> : <PanelRight size={14} />}
              <span className="hidden sm:inline">لوحة الكود</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <h1 className="text-sm font-bold text-foreground truncate max-w-[160px] sm:max-w-xs">
                {activeConv?.title ?? 'محادثة جديدة'}
              </h1>
              <p className="text-2xs text-muted-foreground">
                {BOT_MODES.find((m) => m.id === activeMode)?.description} · {botName}
              </p>
            </div>
            {!sidebarOpen && (
              <button
                onClick={onToggleSidebar}
                className="hidden md:block text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-white/5"
              >
                <Menu size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="flex md:hidden border-b border-border bg-card/50 shrink-0">
          <button
            onClick={() => onMobileTabChange('chat')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-all duration-150 border-b-2 ${
              mobileTab === 'chat' ? 'text-gold border-gold' : 'text-muted-foreground border-transparent'
            }`}
          >
            <MessageSquare size={13} />
            الشات
          </button>
          {activeCodeBlock && (
            <button
              onClick={() => onMobileTabChange('code')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-all duration-150 border-b-2 ${
                mobileTab === 'code' ? 'text-gold border-gold' : 'text-muted-foreground border-transparent'
              }`}
            >
              <Code2 size={13} />
              الكود
            </button>
          )}
        </div>

        {/* Messages - hidden on mobile when code tab is active */}
        <div key={renderKey} className={`flex-1 overflow-y-auto scrollbar-thin px-3 sm:px-4 py-6 space-y-5 ${mobileTab === 'code' ? 'hidden md:block' : ''}`}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`message-enter flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'} gap-3`}
            >
              {msg.role === 'bot' && (
                <div className="w-8 h-8 rounded-full bg-royal-blue/20 border border-royal-blue/30 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-2xs font-bold text-royal-blue-light">
                    {botName.slice(0, 2).toUpperCase()}
                  </span>
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-xl group ${msg.role === 'user' ? 'items-start' : 'items-end'} flex flex-col gap-1`}
              >
                {/* Mode badge for bot */}
                {msg.role === 'bot' && msg.mode && (
                  <div className="flex items-center gap-1.5 mb-0.5 flex-row-reverse">
                    <span className="text-2xs text-muted-foreground font-medium">{botName}</span>
                    <span
                      className={`text-2xs px-1.5 py-0.5 rounded-full font-semibold ${
                        msg.mode === 'quick'
                          ? 'badge-gold'
                          : msg.mode === 'thoughtful'
                            ? 'badge-blue'
                            : 'badge-green'
                      }`}
                    >
                      {BOT_MODES.find((m) => m.id === msg.mode)?.label}
                    </span>
                  </div>
                )}

                <div
                  className={`px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-bot'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-right">
                    {renderMessageContent(msg.content)}
                  </p>

                  {/* File card */}
                  {msg.fileCard && (
                    <div className="mt-3">
                      <FileCard
                        filename={msg.fileCard.filename}
                        file_type={msg.fileCard.file_type}
                        file_url={msg.fileCard.file_url}
                        description={msg.fileCard.description}
                      />
                    </div>
                  )}

                  {/* Inline code block preview */}
                  {msg.codeBlock && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1.5 flex-row-reverse">
                        <span className="text-2xs font-mono text-muted-foreground uppercase tracking-widest">
                          {msg.codeBlock.language}
                        </span>
                        <button
                          onClick={() => {
                            setActiveCodeBlock(msg.codeBlock!);
                            setShowCodePanel(true);
                            onMobileTabChange('code');
                          }}
                          className="text-2xs text-royal-blue-light hover:text-gold transition-colors font-semibold"
                        >
                          ← فتح في اللوحة
                        </button>
                      </div>
                      <pre
                        className="code-block bg-black/40 rounded-lg p-3 text-xs overflow-x-auto max-h-40 text-green-300 text-left font-mono"
                        dir="ltr"
                      >
                        <code className="text-left">
                          {msg.codeBlock.code.slice(0, 300)}
                          {msg.codeBlock.code.length > 300 ? '\n…' : ''}
                        </code>
                      </pre>
                      {/* Code execution component */}
                      <CodeExecution code={msg.codeBlock.code} language={msg.codeBlock.language} />
                    </div>
                  )}
                </div>

                {/* Message actions */}
                <div
                  className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                    msg.role === 'user' ? 'flex-row' : 'flex-row-reverse'
                  }`}
                >
                  <span className="text-2xs text-muted-foreground px-1">{msg.timestamp}</span>
                  {msg.role === 'bot' && (
                    <>
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                        title="نسخ الرسالة"
                      >
                        {copiedMsgId === msg.id ? (
                          <Check size={12} className="text-green-400" />
                        ) : (
                          <Copy size={12} />
                        )}
                      </button>
                      <button
                        className="p-1 rounded text-muted-foreground hover:text-green-400 transition-colors"
                        title="مفيد"
                      >
                        <ThumbsUp size={12} />
                      </button>
                      <button
                        className="p-1 rounded text-muted-foreground hover:text-red-400 transition-colors"
                        title="غير مفيد"
                      >
                        <ThumbsDown size={12} />
                      </button>
                      <button
                        className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                        title="إعادة توليد الرد"
                      >
                        <RotateCcw size={12} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="message-enter flex items-start gap-3 justify-end">
              <div className="chat-bubble-bot px-4 py-3.5">
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={`dot-${i}`}
                      className="typing-dot w-2 h-2 rounded-full bg-muted-foreground"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-royal-blue/20 border border-royal-blue/30 flex items-center justify-center shrink-0">
                <span className="text-2xs font-bold text-royal-blue-light">
                  {botName.slice(0, 2).toUpperCase()}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area - hidden on mobile when code tab is active */}
        <div className={`px-2 sm:px-4 py-3 sm:py-4 border-t border-border bg-card shrink-0 ${mobileTab === 'code' ? 'hidden md:block' : ''}`}>
          <div className="flex items-end gap-2 bg-input border border-border rounded-2xl px-3 sm:px-4 py-2 sm:py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition-all flex-row-reverse">
            {/* Send button */}
            <button
              onClick={() => sendMessage()}
              disabled={isSending || !inputValue.trim()}
              className="btn-primary p-2 sm:p-2.5 rounded-xl shrink-0 mb-0.5 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
              title="إرسال الرسالة (Enter)"
            >
              <Send size={16} className="rotate-180" />
            </button>

            {/* Mode dropdown */}
            <div className="relative shrink-0 mb-0.5">
              <button
                onClick={() => setShowModeDropdown(!showModeDropdown)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 active:scale-95 ${
                  showModeDropdown
                    ? 'bg-muted border border-border'
                    : 'bg-muted/50 hover:bg-muted border border-transparent hover:border-border'
                }`}
                title="اختر وضع البوت"
              >
                {(() => {
                  const activeModeData = BOT_MODES.find((m) => m.id === activeMode);
                  const ActiveIcon = activeModeData?.icon;
                  return (
                    <>
                      {ActiveIcon && <ActiveIcon size={16} className={activeMode === 'quick' ? 'text-yellow-400' : activeMode === 'thoughtful' ? 'text-blue-400' : 'text-green-400'} />}
                      <span className="text-xs font-semibold">{activeModeData?.label}</span>
                      <ChevronDown size={14} className={`transition-transform duration-200 ${showModeDropdown ? 'rotate-180' : ''}`} />
                    </>
                  );
                })()}
              </button>

              {showModeDropdown && (
                <div className="absolute bottom-full right-0 mb-2 w-48 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                  {BOT_MODES.map((mode) => {
                    const ModeIcon = mode.icon;
                    return (
                      <button
                        key={mode.id}
                        onClick={() => {
                          setActiveMode(mode.id);
                          setShowModeDropdown(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-right hover:bg-muted/50 transition-colors ${
                          activeMode === mode.id ? 'bg-muted/70' : ''
                        }`}
                      >
                        <ModeIcon
                          size={16}
                          className={
                            mode.id === 'quick'
                              ? 'text-yellow-400'
                              : mode.id === 'thoughtful'
                                ? 'text-blue-400'
                                : 'text-green-400'
                          }
                        />
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-foreground">{mode.label}</div>
                          <div className="text-2xs text-muted-foreground">{mode.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={`اسأل ${botName} أي شيء… (Shift+Enter لسطر جديد)`}
              rows={1}
              className="flex-1 bg-transparent text-xs sm:text-sm text-foreground placeholder-muted-foreground resize-none focus:outline-none scrollbar-thin text-right"
              style={{ maxHeight: '120px' }}
              dir="rtl"
            />
          </div>
          <p className="text-2xs text-muted-foreground text-center mt-2 hidden sm:block">
            aylnor.ai قد يخطئ. تحقق من المعلومات المهمة بشكل مستقل.
          </p>
        </div>
      </div>

      {/* Code panel - desktop only */}
      {activeCodeBlock && showCodePanel && (
        <CodeDisplayPanel codeBlock={activeCodeBlock} onClose={() => setShowCodePanel(false)} />
      )}

      {/* Mobile code panel - shown when code tab is active */}
      {mobileTab === 'code' && activeCodeBlock && (
        <div className="md:hidden flex-1 overflow-hidden">
          <CodeDisplayPanel codeBlock={activeCodeBlock} onClose={() => onMobileTabChange('chat')} />
        </div>
      )}
    </div>
  );
}
