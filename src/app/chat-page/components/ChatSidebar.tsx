'use client';
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import {
  MessageSquare,
  Plus,
  Settings,
  User,
  Sun,
  Moon,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bot,
  Pencil,
  Check,
  X,
  Trash2,
  BookOpen,
  Search,
  ChevronDown,
  Palette,
  Bell,
  Shield,
  HelpCircle,
  Info,
} from 'lucide-react';
import { BotMode, Conversation, Theme } from './ChatPageClient';
import { useAuth } from '@/contexts/auth-context';

interface ChatSidebarProps {
  open: boolean;
  onToggle: () => void;
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  activeConvId: string;
  setActiveConvId: React.Dispatch<React.SetStateAction<string>>;
  theme: Theme;
  onThemeToggle: () => void;
  botName: string;
  onBotNameChange: (name: string) => void;
  botPersonality: string;
  onBotPersonalityChange: (p: string) => void;
  username: string;
  onUsernameChange: (name: string) => void;
  onNewChat: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const MODE_COLORS: Record<BotMode, string> = {
  quick: 'text-yellow-400',
  thoughtful: 'text-royal-blue-light',
  programming: 'text-green-400',
};

const MODE_LABELS: Record<BotMode, string> = {
  quick: 'سريع',
  thoughtful: 'المفكر',
  programming: 'مبرمج',
};

const SETTINGS_MENU_ITEMS = [
  { id: 'appearance', icon: Palette, label: 'المظهر والثيم', description: 'تخصيص الألوان والوضع' },
  { id: 'notifications', icon: Bell, label: 'الإشعارات', description: 'إدارة التنبيهات' },
  { id: 'privacy', icon: Shield, label: 'الخصوصية والأمان', description: 'إعدادات الحساب' },
  { id: 'help', icon: HelpCircle, label: 'المساعدة والدعم', description: 'الأسئلة الشائعة' },
  { id: 'about', icon: Info, label: 'حول aylnor.ai', description: 'الإصدار والمعلومات' },
];

export default function ChatSidebar({
  open,
  onToggle,
  conversations,
  setConversations,
  activeConvId,
  setActiveConvId,
  theme,
  onThemeToggle,
  botName,
  onBotNameChange,
  botPersonality,
  onBotPersonalityChange,
  username,
  onUsernameChange,
  onNewChat,
  mobileOpen,
  onMobileClose,
}: ChatSidebarProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState<'chats'>('chats');
  const [editingBotName, setEditingBotName] = useState(false);
  const [tempBotName, setTempBotName] = useState(botName);
  const [editingUsername, setEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState(username);
  const [searchQuery, setSearchQuery] = useState('');
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);
  const settingsDropdownRef = useRef<HTMLDivElement>(null);

  // Dynamic History Fetching - fetch all conversations for logged-in user
  useEffect(() => {
    const fetchConversations = async () => {
      if (!user?.id) return;

      try {
        const response = await fetch(`/api/conversations?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.conversations) {
            setConversations(data.conversations);
          }
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
      }
    };

    fetchConversations();
  }, [user?.id]);

  // Sync active conversation with URL query parameter
  useEffect(() => {
    const conversationId = searchParams.get('id');
    if (conversationId && conversationId !== activeConvId) {
      setActiveConvId(conversationId);
    }
  }, [searchParams, activeConvId, setActiveConvId]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/sign-up-login-screen');
  };

  const filteredConvs = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsDropdownRef.current && !settingsDropdownRef.current.contains(e.target as Node)) {
        setSettingsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar-transition flex flex-col border-l border-border bg-card shrink-0 relative z-10 ${
          mobileOpen ? 'md:hidden fixed inset-y-0 right-0 w-72' : ''
        }`}
        style={{ width: open ? '260px' : '64px', minHeight: '100vh' }}
      >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-border">
        {open && (
          <button
            onClick={onToggle}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-white/5"
            aria-label="طي الشريط الجانبي"
          >
            <ChevronRight size={16} />
          </button>
        )}
        {open && (
          <Link href="/" className="flex items-center gap-2 overflow-hidden">
            <span className="font-bold text-sm text-foreground whitespace-nowrap">
              aylnor<span className="text-gold">.ai</span>
            </span>
            <AppLogo size={28} />
          </Link>
        )}
        {!open && (
          <div className="mx-auto">
            <AppLogo size={28} />
          </div>
        )}
      </div>

      {/* Expand toggle when collapsed */}
      {!open && (
        <button
          onClick={onToggle}
          className="mx-auto mt-2 text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-white/5"
          aria-label="توسيع الشريط الجانبي"
        >
          <ChevronLeft size={16} />
        </button>
      )}

      {/* New chat button */}
      <div className="px-3 py-3">
        <button
          onClick={() => {
            onNewChat();
            onMobileClose?.();
          }}
          className={`btn-primary flex items-center gap-2 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-95 ${
            open ? 'w-full px-4 py-2.5' : 'w-10 h-10 justify-center mx-auto'
          }`}
          title="محادثة جديدة"
        >
          <Plus size={16} />
          {open && 'محادثة جديدة'}
        </button>
      </div>

      {/* Section nav */}
      {open && (
        <div className="flex border-b border-border mx-3 mb-1">
          <button
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-all duration-150 border-b-2 text-gold border-gold"
          >
            <MessageSquare size={13} />
            المحادثات
          </button>
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* CHATS section */}
        <div className="px-2 py-2">
          {open && (
            <div className="relative mb-3">
              <Search
                size={13}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="ابحث في المحادثات…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field w-full pr-8 pl-3 py-2 rounded-lg text-xs text-right"
              />
            </div>
          )}

          {open && (
            <p className="text-2xs text-muted-foreground uppercase tracking-widest font-semibold px-2 mb-2 text-right">
              الأخيرة
            </p>
          )}

          <div className="space-y-0.5">
            {filteredConvs.map((conv) => (
              <button
                key={conv.id}
                onClick={() => {
                  router.push(`/chat-page?id=${conv.id}`);
                  onMobileClose?.();
                }}
                className={`w-full text-right rounded-xl sidebar-item-hover transition-all ${
                  conv.id === activeConvId ? 'sidebar-item-active' : ''
                } ${open ? 'px-3 py-2.5' : 'flex items-center justify-center p-2.5'}`}
                title={!open ? conv.title : undefined}
              >
                {open ? (
                  <div className="flex items-start gap-2.5 min-w-0 flex-row-reverse">
                    <MessageSquare
                      size={14}
                      className={`mt-0.5 shrink-0 ${MODE_COLORS[conv.mode]}`}
                    />
                    <div className="min-w-0 flex-1 text-right">
                      <p className="text-xs font-semibold text-foreground truncate leading-tight">
                        {conv.title}
                      </p>
                      <p className="text-2xs text-muted-foreground mt-0.5 truncate">
                        {conv.timestamp} · {MODE_LABELS[conv.mode]}
                      </p>
                    </div>
                  </div>
                ) : (
                  <MessageSquare size={16} className={MODE_COLORS[conv.mode]} />
                )}
              </button>
            ))}

            {filteredConvs.length === 0 && open && (
              <div className="text-center py-6">
                <BookOpen size={24} className="text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-xs text-muted-foreground">لا توجد محادثات</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="border-t border-border px-2 py-3 space-y-1">
        {open ? (
          <>
            {/* Settings dropdown button */}
            <div className="relative" ref={settingsDropdownRef}>
              <button
                onClick={() => setSettingsDropdownOpen(!settingsDropdownOpen)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground sidebar-item-hover flex-row-reverse"
              >
                <Settings size={16} />
                <span className="flex-1 text-right">الإعدادات</span>
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${settingsDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown menu with Personality and Settings sections */}
              {settingsDropdownOpen && (
                <div className="absolute bottom-full mb-1 left-0 right-0 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50 max-h-[400px] overflow-y-auto">
                  {/* Personality section */}
                  <div className="p-3 border-b border-border">
                    <p className="text-2xs text-muted-foreground uppercase tracking-widest font-semibold px-2 py-1 text-right mb-2">
                      الشخصية
                    </p>
                    
                    {/* Bot name */}
                    <div className="mb-3">
                      <label className="text-xs font-semibold text-foreground mb-1 block text-right">
                        اسم البوت
                      </label>
                      {editingBotName ? (
                        <div className="flex gap-1.5 flex-row-reverse">
                          <input
                            type="text"
                            value={tempBotName}
                            onChange={(e) => setTempBotName(e.target.value)}
                            className="input-field flex-1 px-2 py-1 rounded text-xs text-right"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                onBotNameChange(tempBotName);
                                setEditingBotName(false);
                              }
                              if (e.key === 'Escape') {
                                setTempBotName(botName);
                                setEditingBotName(false);
                              }
                            }}
                          />
                          <button
                            onClick={() => {
                              onBotNameChange(tempBotName);
                              setEditingBotName(false);
                            }}
                            className="text-green-400 hover:text-green-300 p-1"
                          >
                            <Check size={12} />
                          </button>
                          <button
                            onClick={() => {
                              setTempBotName(botName);
                              setEditingBotName(false);
                            }}
                            className="text-muted-foreground hover:text-foreground p-1"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between bg-muted/50 rounded px-2 py-1.5">
                          <button
                            onClick={() => {
                              setTempBotName(botName);
                              setEditingBotName(true);
                            }}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Pencil size={11} />
                          </button>
                          <span className="text-xs font-semibold text-gold">{botName}</span>
                        </div>
                      )}
                    </div>

                    {/* Personality */}
                    <div>
                      <label className="text-xs font-semibold text-foreground mb-1 block text-right">
                        الشخصية والأسلوب
                      </label>
                      <textarea
                        value={botPersonality}
                        onChange={(e) => onBotPersonalityChange(e.target.value)}
                        rows={3}
                        className="input-field w-full px-2 py-1.5 rounded text-xs resize-none text-right"
                        placeholder="مثال: مدرس ودود متخصص في الرياضيات"
                      />
                    </div>

                    {/* Preset personalities */}
                    <div className="mt-2">
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          {
                            id: 'preset-tutor',
                            label: 'مدرس أكاديمي',
                            value: 'صبور وشامل وتعليمي. يشرح دائماً السبب وراء الإجابات مع أمثلة.',
                          },
                          {
                            id: 'preset-senior-dev',
                            label: 'مطور متقدم',
                            value: 'موجز ومركز على أفضل الممارسات. يراجع الكود بشكل نقدي ويقترح تحسينات.',
                          },
                          {
                            id: 'preset-socratic',
                            label: 'مرشد سقراطي',
                            value: 'يوجه من خلال الأسئلة بدلاً من الإجابات المباشرة. يشجع التفكير النقدي.',
                          },
                        ].map((preset) => (
                          <button
                            key={preset.id}
                            onClick={() => onBotPersonalityChange(preset.value)}
                            className="text-right px-2 py-1.5 rounded bg-white/5 border border-border hover:border-gold/30 transition-colors"
                          >
                            <p className="text-2xs font-semibold text-foreground">{preset.label}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Settings section */}
                  <div className="p-3">
                    <p className="text-2xs text-muted-foreground uppercase tracking-widest font-semibold px-2 py-1 text-right mb-2">
                      الإعدادات
                    </p>

                    {/* Username */}
                    <div className="mb-3">
                      <label className="text-xs font-semibold text-foreground mb-1 block text-right">
                        الحساب
                      </label>
                      <div className="flex items-center gap-2 flex-row-reverse">
                        <div className="w-8 h-8 rounded-full bg-royal-blue/20 border border-royal-blue/30 flex items-center justify-center shrink-0">
                          <User size={14} className="text-royal-blue-light" />
                        </div>
                        <div className="flex-1 min-w-0">
                          {editingUsername ? (
                            <div className="flex gap-1 flex-row-reverse">
                              <input
                                type="text"
                                value={tempUsername}
                                onChange={(e) => setTempUsername(e.target.value)}
                                className="input-field flex-1 px-2 py-1 rounded text-xs text-right"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    onUsernameChange(tempUsername);
                                    setEditingUsername(false);
                                  }
                                  if (e.key === 'Escape') {
                                    setTempUsername(username);
                                    setEditingUsername(false);
                                  }
                                }}
                              />
                              <button
                                onClick={() => {
                                  onUsernameChange(tempUsername);
                                  setEditingUsername(false);
                                }}
                                className="text-green-400 p-0.5"
                              >
                                <Check size={10} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between flex-row-reverse">
                              <p className="text-xs font-semibold text-foreground truncate">{username}</p>
                              <button
                                onClick={() => {
                                  setTempUsername(username);
                                  setEditingUsername(true);
                                }}
                                className="text-muted-foreground hover:text-foreground ml-1 shrink-0"
                              >
                                <Pencil size={10} />
                              </button>
                            </div>
                          )}
                          <p className="text-2xs text-muted-foreground text-right">student@aylnor.ai</p>
                        </div>
                      </div>
                    </div>

                    {/* Theme toggle */}
                    <div className="mb-3">
                      <label className="text-xs font-semibold text-foreground mb-1 block text-right">
                        المظهر
                      </label>
                      <div className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2 flex-row-reverse">
                        <div className="flex items-center gap-2 flex-row-reverse">
                          {theme === 'dark' ? (
                            <Moon size={14} className="text-royal-blue-light" />
                          ) : (
                            <Sun size={14} className="text-gold" />
                          )}
                          <span className="text-xs font-medium text-foreground">
                            {theme === 'dark' ? 'الوضع الداكن' : 'الوضع الفاتح'}
                          </span>
                        </div>
                        <button
                          onClick={onThemeToggle}
                          className={`relative w-9 h-5 rounded-full toggle-track ${
                            theme === 'light' ? 'bg-gold' : 'bg-border'
                          }`}
                          aria-label="تبديل الثيم"
                        >
                          <span
                            className="toggle-thumb absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md"
                            style={{ left: theme === 'light' ? '18px' : '2px' }}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Danger zone */}
                    <div>
                      <label className="text-xs font-semibold text-foreground mb-1 block text-right">
                        البيانات
                      </label>
                      <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors flex-row-reverse">
                        <Trash2 size={12} />
                        مسح جميع المحادثات
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors flex-row-reverse"
            >
              <LogOut size={16} />
              <span className="flex-1 text-right">تسجيل الخروج</span>
            </button>
          </>
        ) : (
          <>
            <button
              className="w-full flex items-center justify-center py-2.5 rounded-xl text-muted-foreground sidebar-item-hover"
              title="التفضيلات"
            >
              <Settings size={16} />
            </button>
            <button
              onClick={onThemeToggle}
              className="w-full flex items-center justify-center py-2.5 rounded-xl text-muted-foreground sidebar-item-hover"
              title="تبديل الثيم"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
              title="تسجيل الخروج"
            >
              <LogOut size={16} />
            </button>
          </>
        )}
      </div>
    </aside>
    </>
  );
}
