'use client';
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import {
  MessageSquare, Plus, Settings, User, Sun, Moon,
  LogOut, ChevronLeft, ChevronRight, Bot, Pencil,
  Check, X, Trash2, BookOpen, Search, ChevronDown,
  Palette, Bell, Shield, HelpCircle, Info,
} from 'lucide-react';
import { BotMode, Conversation, Theme } from './ChatPageClient';

interface ChatSidebarProps {
  open: boolean;
  onToggle: () => void;
  conversations: Conversation[];
  activeConvId: string;
  onSelectConversation: (id: string) => void;
  theme: Theme;
  onThemeToggle: () => void;
  botName: string;
  onBotNameChange: (name: string) => void;
  botPersonality: string;
  onBotPersonalityChange: (p: string) => void;
  username: string;
  onUsernameChange: (name: string) => void;
  onNewChat: () => void;
}

const MODE_COLORS: Record<BotMode, string> = {
  quick: 'text-yellow-400',
  thoughtful: 'text-royal-blue-light',
  programming: 'text-green-400',
};

const MODE_LABELS: Record<BotMode, string> = {
  quick: 'سريع',
  thoughtful: 'متأمل',
  programming: 'برمجة',
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
  activeConvId,
  onSelectConversation,
  theme,
  onThemeToggle,
  botName,
  onBotNameChange,
  botPersonality,
  onBotPersonalityChange,
  username,
  onUsernameChange,
  onNewChat,
}: ChatSidebarProps) {
  const [activeSection, setActiveSection] = useState<'chats' | 'settings' | 'persona'>('chats');
  const [editingBotName, setEditingBotName] = useState(false);
  const [tempBotName, setTempBotName] = useState(botName);
  const [editingUsername, setEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState(username);
  const [searchQuery, setSearchQuery] = useState('');
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);
  const settingsDropdownRef = useRef<HTMLDivElement>(null);

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
    <aside
      className="sidebar-transition flex flex-col border-l border-border bg-card shrink-0 relative z-10"
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
          onClick={onNewChat}
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
          {(
            [
              { key: 'chats', icon: MessageSquare, label: 'المحادثات' },
              { key: 'persona', icon: Bot, label: 'الشخصية' },
              { key: 'settings', icon: Settings, label: 'الإعدادات' },
            ] as { key: 'chats' | 'settings' | 'persona'; icon: React.ElementType; label: string }[]
          ).map((s) => {
            const SectionIcon = s.icon;
            return (
              <button
                key={`sidebar-section-${s.key}`}
                onClick={() => setActiveSection(s.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-all duration-150 border-b-2 ${
                  activeSection === s.key
                    ? 'text-gold border-gold' :'text-muted-foreground border-transparent hover:text-foreground'
                }`}
              >
                <SectionIcon size={13} />
                {s.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* CHATS section */}
        {(activeSection === 'chats' || !open) && (
          <div className="px-2 py-2">
            {open && (
              <div className="relative mb-3">
                <Search size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
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
                  onClick={() => onSelectConversation(conv.id)}
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
        )}

        {/* PERSONA section */}
        {activeSection === 'persona' && open && (
          <div className="px-3 py-3 space-y-5">
            <div>
              <p className="text-2xs text-muted-foreground uppercase tracking-widest font-semibold mb-3 text-right">
                هوية البوت
              </p>
              {/* Bot name */}
              <div className="mb-4">
                <label className="text-xs font-semibold text-foreground mb-1.5 block text-right">
                  اسم البوت
                </label>
                {editingBotName ? (
                  <div className="flex gap-1.5 flex-row-reverse">
                    <input
                      type="text"
                      value={tempBotName}
                      onChange={(e) => setTempBotName(e.target.value)}
                      className="input-field flex-1 px-3 py-1.5 rounded-lg text-xs text-right"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { onBotNameChange(tempBotName); setEditingBotName(false); }
                        if (e.key === 'Escape') { setTempBotName(botName); setEditingBotName(false); }
                      }}
                    />
                    <button onClick={() => { onBotNameChange(tempBotName); setEditingBotName(false); }} className="text-green-400 hover:text-green-300 p-1">
                      <Check size={14} />
                    </button>
                    <button onClick={() => { setTempBotName(botName); setEditingBotName(false); }} className="text-muted-foreground hover:text-foreground p-1">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                    <button
                      onClick={() => { setTempBotName(botName); setEditingBotName(true); }}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    <span className="text-sm font-semibold text-gold">{botName}</span>
                  </div>
                )}
              </div>

              {/* Personality */}
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block text-right">
                  الشخصية والأسلوب
                </label>
                <p className="text-2xs text-muted-foreground mb-2 text-right">
                  صف كيف يجب أن يتصرف البوت وما يركز عليه.
                </p>
                <textarea
                  value={botPersonality}
                  onChange={(e) => onBotPersonalityChange(e.target.value)}
                  rows={4}
                  className="input-field w-full px-3 py-2 rounded-lg text-xs resize-none text-right"
                  placeholder="مثال: مدرس ودود متخصص في الرياضيات، يشرح دائماً خطوة بخطوة"
                />
              </div>

              {/* Preset personalities */}
              <div className="mt-3">
                <p className="text-2xs text-muted-foreground mb-2 font-medium text-right">إعدادات مسبقة</p>
                <div className="space-y-1.5">
                  {[
                    { id: 'preset-tutor', label: 'مدرس أكاديمي', value: 'صبور وشامل وتعليمي. يشرح دائماً السبب وراء الإجابات مع أمثلة.' },
                    { id: 'preset-senior-dev', label: 'مطور متقدم', value: 'موجز ومركز على أفضل الممارسات. يراجع الكود بشكل نقدي ويقترح تحسينات.' },
                    { id: 'preset-socratic', label: 'مرشد سقراطي', value: 'يوجه من خلال الأسئلة بدلاً من الإجابات المباشرة. يشجع التفكير النقدي.' },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => onBotPersonalityChange(preset.value)}
                      className="w-full text-right px-3 py-2 rounded-lg bg-white/5 border border-border hover:border-gold/30 transition-colors"
                    >
                      <p className="text-xs font-semibold text-foreground">{preset.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS section */}
        {activeSection === 'settings' && open && (
          <div className="px-3 py-3 space-y-5">
            {/* Username */}
            <div>
              <p className="text-2xs text-muted-foreground uppercase tracking-widest font-semibold mb-3 text-right">
                الحساب
              </p>
              <div className="flex items-center gap-3 mb-4 flex-row-reverse">
                <div className="w-10 h-10 rounded-full bg-royal-blue/20 border border-royal-blue/30 flex items-center justify-center shrink-0">
                  <User size={18} className="text-royal-blue-light" />
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
                          if (e.key === 'Enter') { onUsernameChange(tempUsername); setEditingUsername(false); }
                          if (e.key === 'Escape') { setTempUsername(username); setEditingUsername(false); }
                        }}
                      />
                      <button onClick={() => { onUsernameChange(tempUsername); setEditingUsername(false); }} className="text-green-400 p-0.5">
                        <Check size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between flex-row-reverse">
                      <p className="text-sm font-semibold text-foreground truncate">{username}</p>
                      <button
                        onClick={() => { setTempUsername(username); setEditingUsername(true); }}
                        className="text-muted-foreground hover:text-foreground ml-1 shrink-0"
                      >
                        <Pencil size={12} />
                      </button>
                    </div>
                  )}
                  <p className="text-2xs text-muted-foreground text-right">student@aylnor.ai</p>
                </div>
              </div>
            </div>

            {/* Theme toggle */}
            <div>
              <p className="text-2xs text-muted-foreground uppercase tracking-widest font-semibold mb-3 text-right">
                المظهر
              </p>
              <div className="flex items-center justify-between bg-muted/50 rounded-xl px-4 py-3 flex-row-reverse">
                <div className="flex items-center gap-2.5 flex-row-reverse">
                  {theme === 'dark' ? (
                    <Moon size={16} className="text-royal-blue-light" />
                  ) : (
                    <Sun size={16} className="text-gold" />
                  )}
                  <span className="text-sm font-medium text-foreground">
                    {theme === 'dark' ? 'الوضع الداكن' : 'الوضع الفاتح'}
                  </span>
                </div>
                <button
                  onClick={onThemeToggle}
                  className={`relative w-11 h-6 rounded-full toggle-track ${
                    theme === 'light' ? 'bg-gold' : 'bg-border'
                  }`}
                  aria-label="تبديل الثيم"
                >
                  <span
                    className="toggle-thumb absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md"
                    style={{ left: theme === 'light' ? '22px' : '2px' }}
                  />
                </button>
              </div>
            </div>

            {/* Danger zone */}
            <div>
              <p className="text-2xs text-muted-foreground uppercase tracking-widest font-semibold mb-3 text-right">
                البيانات
              </p>
              <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors flex-row-reverse">
                <Trash2 size={14} />
                مسح جميع المحادثات
              </button>
            </div>
          </div>
        )}
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
                <span className="flex-1 text-right">التفضيلات</span>
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${settingsDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown menu */}
              {settingsDropdownOpen && (
                <div className="absolute bottom-full mb-1 left-0 right-0 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50">
                  <div className="p-1.5">
                    <p className="text-2xs text-muted-foreground uppercase tracking-widest font-semibold px-3 py-1.5 text-right">
                      الإعدادات
                    </p>
                    {SETTINGS_MENU_ITEMS.map((item) => {
                      const ItemIcon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            if (item.id === 'appearance') {
                              onThemeToggle();
                            }
                            setSettingsDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors flex-row-reverse"
                        >
                          <ItemIcon size={15} className="shrink-0" />
                          <div className="flex-1 text-right min-w-0">
                            <p className="text-xs font-semibold text-foreground">{item.label}</p>
                            <p className="text-2xs text-muted-foreground">{item.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="border-t border-border p-1.5">
                    <button
                      onClick={onThemeToggle}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors flex-row-reverse"
                    >
                      {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                      <span className="flex-1 text-right text-xs font-semibold">
                        {theme === 'dark' ? 'التبديل للوضع الفاتح' : 'التبديل للوضع الداكن'}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors flex-row-reverse"
            >
              <LogOut size={16} />
              <span className="flex-1 text-right">تسجيل الخروج</span>
            </Link>
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
            <Link
              href="/"
              className="w-full flex items-center justify-center py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
              title="تسجيل الخروج"
            >
              <LogOut size={16} />
            </Link>
          </>
        )}
      </div>
    </aside>
  );
}