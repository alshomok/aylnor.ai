'use client';
import React, { useState } from 'react';
import ChatSidebar from './ChatSidebar';
import ChatMain from './ChatMain';

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

const INITIAL_CONVERSATIONS: Conversation[] = [
  { id: 'conv-001', title: 'شرح شجرة البحث الثنائية', lastMessage: 'هل يمكنك شرح حذف BST؟', timestamp: 'منذ ساعتين', mode: 'thoughtful' },
  { id: 'conv-002', title: 'أنماط useEffect في React', lastMessage: 'أرني أمثلة على التنظيف', timestamp: 'منذ 5 ساعات', mode: 'programming' },
  { id: 'conv-003', title: 'حساب التفاضل — قاعدة السلسلة', lastMessage: 'اشتق sin(x²)', timestamp: 'أمس', mode: 'quick' },
  { id: 'conv-004', title: 'مخطط مقال: تغير المناخ', lastMessage: 'ساعدني في هيكلة المقدمة', timestamp: 'أمس', mode: 'thoughtful' },
  { id: 'conv-005', title: 'أنواع JOIN في SQL', lastMessage: 'متى أستخدم FULL OUTER JOIN؟', timestamp: 'منذ يومين', mode: 'programming' },
  { id: 'conv-006', title: 'التمثيل الضوئي بعمق', lastMessage: 'اشرح دورة كالفن', timestamp: 'منذ 3 أيام', mode: 'thoughtful' },
  { id: 'conv-007', title: 'قوائم الفهم في Python', lastMessage: 'أمثلة على القوائم المتداخلة', timestamp: 'منذ 4 أيام', mode: 'programming' },
  { id: 'conv-008', title: 'تاريخ الحرب الباردة', lastMessage: 'الأحداث الرئيسية 1947–1953', timestamp: 'منذ 5 أيام', mode: 'quick' },
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg-001',
    role: 'bot',
    content: 'مرحباً! أنا aylnor، مساعدك الذكي الأكاديمي والبرمجي. أنا حالياً في وضع **المتأمل** — سأعطيك شروحات مفصلة ومدروسة. ماذا تريد أن تستكشف اليوم؟',
    mode: 'thoughtful',
    timestamp: '10:32 ص',
  },
  {
    id: 'msg-002',
    role: 'user',
    content: 'اشرح كيف تعمل شجرة البحث الثنائية وأرني تطبيقاً بلغة Python',
    timestamp: '10:33 ص',
  },
  {
    id: 'msg-003',
    role: 'bot',
    content: '**شجرة البحث الثنائية (BST)** هي هيكل بيانات هرمي حيث يحتوي كل عقدة على طفلين كحد أقصى. الخاصية الأساسية: كل عقدة في الشجرة الفرعية اليسرى لها قيمة **أصغر** من الأب، وكل عقدة في الشجرة الفرعية اليمنى لها قيمة **أكبر** من الأب.\n\nهذه الخاصية تتيح البحث والإدراج والحذف بمتوسط O(log n) — مما يجعل BST أساسياً في قواعد البيانات وأنظمة الملفات وخوارزميات البحث.',
    mode: 'thoughtful',
    timestamp: '10:33 ص',
    codeBlock: {
      language: 'python',
      code: `class Node:
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None

class BinarySearchTree:
    def __init__(self):
        self.root = None

    def insert(self, value):
        if not self.root:
            self.root = Node(value)
        else:
            self._insert_recursive(self.root, value)

    def _insert_recursive(self, node, value):
        if value < node.value:
            if node.left is None:
                node.left = Node(value)
            else:
                self._insert_recursive(node.left, value)
        else:
            if node.right is None:
                node.right = Node(value)
            else:
                self._insert_recursive(node.right, value)

    def search(self, value):
        return self._search_recursive(self.root, value)

    def inorder(self):
        result = []
        self._inorder_recursive(self.root, result)
        return result

# الاستخدام
bst = BinarySearchTree()
for val in [5, 3, 7, 1, 4, 6, 8]:
    bst.insert(val)

print(bst.inorder())   # [1, 3, 4, 5, 6, 7, 8]`,
    },
  },
];

export default function ChatPageClient() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMode, setActiveMode] = useState<BotMode>('thoughtful');
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [activeConvId, setActiveConvId] = useState<string>('conv-001');
  const [showCodePanel, setShowCodePanel] = useState(true);
  const [botName, setBotName] = useState('aylnor');
  const [botPersonality, setBotPersonality] = useState('مساعد مفيد ودقيق وأكاديمي');
  const [username, setUsername] = useState('أمارا أوسي');

  const themeClass = theme === 'light' ? 'light' : '';

  return (
    <div className={`${themeClass} flex h-screen overflow-hidden bg-background text-foreground`} dir="rtl">
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
      />
      <ChatSidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        conversations={conversations}
        activeConvId={activeConvId}
        onSelectConversation={setActiveConvId}
        theme={theme}
        onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        botName={botName}
        onBotNameChange={setBotName}
        botPersonality={botPersonality}
        onBotPersonalityChange={setBotPersonality}
        username={username}
        onUsernameChange={setUsername}
        onNewChat={() => {
          const newId = `conv-${Date.now()}`;
          const newConv: Conversation = {
            id: newId,
            title: 'محادثة جديدة',
            lastMessage: '',
            timestamp: 'الآن',
            mode: activeMode,
          };
          setConversations([newConv, ...conversations]);
          setActiveConvId(newId);
          setMessages([{
            id: `msg-${Date.now()}`,
            role: 'bot',
            content: `مرحباً! أنا ${botName}. كيف يمكنني مساعدتك اليوم؟`,
            mode: activeMode,
            timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
          }]);
        }}
      />
    </div>
  );
}