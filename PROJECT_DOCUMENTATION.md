# توثيق مشروع AYLNOR.AI

## نظرة عامة
AYLNOR.AI هو نظام ذكاء اصطناعي متقدم لإدارة قاعدة المعرفة للطلاب، يتيح لهم رفع الملفات والبحث عنها والحصول على إجابات أكاديمية دقيقة. يتميز النظام بنظام مصادقة متكامل، إدارة محادثات ذكية، ودعم متعدد اللغات.

**تاريخ بداية المشروع**: 16 مارس 2026
**الإصدار الحالي**: 2.0
**الحالة**: قيد التطوير والإنتاج

---

## جدول المحتويات

1. [الميزات الرئيسية](#الميزات-الرئيسية)
2. [التاريخ والتحديثات](#التاريخ-والتحديثات)
3. [الهيكل المعماري](#الهيكل-المعماري)
4. [قاعدة البيانات](#قاعدة-البيانات)
5. [نظام المصادقة](#نظام-المصادقة)
6. [إدارة المحادثات](#إدارة-المحادثات)
7. [الأدوات والتقنيات](#الأدوات-والتقنيات)
8. [هيكل المشروع](#هيكل-المشروع)
9. [أوضاع البوت](#أوضاع-البوت)
10. [تدوير مفاتيح AI](#تدوير-مفاتيح-ai)
11. [Environment Variables](#environment-variables)
12. [المشاكل والحلول](#المشاكل-والحلول)
13. [دليل التشغيل](#دليل-التشغيل)

---

## الميزات الرئيسية

### 1. نظام المصادقة المتكامل
- **التسجيل الجديد**: إنشاء حساب جديد مع auto-login فوري
- **تسجيل الدخول**: دعم تسجيل الدخول بالبريد وكلمة المرور
- **تذكر المستخدم**: حفظ حالة تسجيل الدخول عبر IP
- **إدارة الجلسات**: حفظ الجلسات تلقائياً في localStorage
- **تسجيل الخروج**: مسح البيانات المحلية بشكل آمن

### 2. إدارة المحادثات الذكية
- **إنشاء محادثات**: إضافة محادثات جديدة بسهولة
- **التبديل بين المحادثات**: الانتقال السريع بين المحادثات
- **حذف المحادثات**: حذف المحادثات غير المرغوبة
- **استمرارية البيانات**: حفظ المحادثات والرسائل في قاعدة البيانات
- **استعادة المحادثات**: استعادة جميع المحادثات عند تسجيل الدخول مرة أخرى

### 3. أوضاع البوت المتعددة
- **الوضع السريع**: إجابات سريعة وموجزة
- **الوضع المفكر**: شروحات عميقة ومفصلة
- **الوضع المبرمج**: أولوية الكود مع تمييز الصياغة

### 4. قاعدة المعرفة
- **رفع الملفات**: دعم رفع مختلف أنواع الملفات
- **استخراج النصوص**: استخراج النصوص من PDF و Excel
- **البحث الذكي**: البحث في الملفات المرفوعة
- **الملفات التعليمية**: دعم الملفات من Google Drive

### 5. البحث على الإنترنت
- **Serper API**: بحث متقدم على الإنترنت
- **نتائج دقيقة**: نتائج بحث عالية الجودة
- **تكامل مع AI**: استخدام نتائج البحث في الإجابات

---

## التاريخ والتحديثات

### 28 مايو 2026 (التحديثات الأخيرة)
- **إصلاح مشكلة اختفاء الرسائل عند التبديل بين المحادثات**:
  - إزالة `key={chatId}` من ChatMain لمنع إعادة التحميل غير الضرورية
  - الاعتماد على useEffect لتحميل الرسائل بناءً على chatId
  - إضافة console logging لتتبع تغييرات chatId

- **تحسين استمرارية المحادثات**:
  - تحديث conversations API route لاستخدام supabaseServer()
  - إزالة التكرار في جلب المحادثات من ChatPageClient
  - التأكد من جلب المحادثات من قاعدة البيانات عند تسجيل الدخول

- **إصلاح مشكلة "Add New Chat"**:
  - إزالة `key={chatId}` من ChatPageClient لمنع إعادة تحميل Sidebar
  - إضافة `key={chatId}` فقط إلى ChatMain
  - إضافة `router.refresh()` بعد إنشاء محادثة جديدة

- **إضافة التوجيه التلقائي للمستخدمين المسجلين**:
  - تحويل landing page إلى client component
  - إضافة فحص حالة المستخدم عند تحميل الصفحة
  - توجيه المستخدمين المسجلين تلقائياً إلى صفحة الشات

- **إضافة Suspense Boundary**:
  - إضافة Suspense حول useSearchParams() في chat page
  - حل مشكلة build error في Next.js 15

### 21 مايو 2026
- **إصلاح مشكلة الـ Stream الفارغ**: البوت كان يرد برسائل فارغة في جميع الأوضاع
- **السبب**: مفاتيح AI غير مكونة بشكل صحيح في Environment Variables
- **الحل**: 
  - تعديل ترتيب المفاتيح في `ai-key-rotation.ts` لاستخدام Groq أولاً
  - إضافة مفاتيح Groq و Gemini المطلوبة في Vercel Environment Variables
  - إضافة logging شامل لتتبع قراءة المفاتيح

- **إصلاح مشكلة انفصال METADATA عن JSON في الـ Stream**:
  - دمج إرسال METADATA في سطر واحد في السيرفر
  - إضافة `metadataReceived` flag في العميل

- **تحديث BASE_PROMPT**: 
  - تبسيط الـ prompt ليكون أكثر ودية واحترافية
  - إضافة سياق لتحديد نوع الرد (عام أو تقني)
  - إضافة هوية الخالق (الطالب المهندس أحمد قريز)
  - دعم 20+ لغة برمجة

- **تصحيح أخطاء في route.ts**:
  - إضافة backticks للنصوص العربية
  - إصلاح template literals
  - تحسين معالجة الأخطاء

---

## الهيكل المعماري

### Frontend Architecture
```
┌─────────────────────────────────────────┐
│           Next.js 15 App Router         │
├─────────────────────────────────────────┤
│  Landing Page (page.tsx)                │
│  - Auto-redirect for logged-in users   │
│  - Hero, Features, CTA sections        │
├─────────────────────────────────────────┤
│  Auth Pages (sign-up-login-screen)     │
│  - SignupForm with auto-login          │
│  - LoginForm with redirect              │
├─────────────────────────────────────────┤
│  Chat Page (chat-page/page.tsx)        │
│  - Suspense boundary                   │
│  - URL param handling (id)             │
│  - Auth check                          │
├─────────────────────────────────────────┤
│  ChatPageClient                        │
│  - Message loading (useEffect)         │
│  - Conversation fetching               │
│  - State management                    │
├─────────────────────────────────────────┤
│  Components                            │
│  - ChatMain (messages display)         │
│  - ChatSidebar (conversation list)     │
│  - CodeDisplayPanel                    │
│  - FileCard, FileDownloadCard          │
└─────────────────────────────────────────┘
```

### Backend Architecture
```
┌─────────────────────────────────────────┐
│         Next.js API Routes              │
├─────────────────────────────────────────┤
│  /api/chat                             │
│  - Streaming response                   │
│  - AI integration                      │
│  - Web search integration               │
├─────────────────────────────────────────┤
│  /api/conversations                    │
│  - GET: Fetch user conversations       │
│  - POST: Create new conversation       │
├─────────────────────────────────────────┤
│  /api/messages                         │
│  - GET: Fetch conversation messages    │
├─────────────────────────────────────────┤
│  /api/extract-text                     │
│  - Extract text from PDF/Excel         │
├─────────────────────────────────────────┤
│  /api/knowledge-base                   │
│  - File upload and management          │
└─────────────────────────────────────────┘
```

---

## قاعدة البيانات

### الجداول الرئيسية

#### 1. users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  username TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. conversations
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  title TEXT NOT NULL,
  mode TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. messages
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) NOT NULL,
  role TEXT NOT NULL, -- 'user' or 'bot'
  content TEXT NOT NULL,
  mode TEXT,
  code_block JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 4. knowledge_base
```sql
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  content TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 5. educational_files
```sql
CREATE TABLE educational_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  subject TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Row Level Security (RLS) Policies

#### conversations
```sql
-- Users can create their conversations
CREATE POLICY "Users can create their conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their conversations
CREATE POLICY "Users can view their conversations" ON conversations
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their conversations
CREATE POLICY "Users can update their conversations" ON conversations
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their conversations
CREATE POLICY "Users can delete their conversations" ON conversations
  FOR DELETE USING (auth.uid() = user_id);
```

#### messages
```sql
-- Users can create messages in their conversations
CREATE POLICY "Users can create messages in their conversations" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- Users can view messages in their conversations
CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );
```

---

## نظام المصادقة

### AuthContext
الموقع: `src/contexts/auth-context.tsx`

#### الوظائف الرئيسية
- **signUp**: إنشاء حساب جديد مع auto-login
- **signIn**: تسجيل الدخول
- **signOut**: تسجيل الخروج مع مسح البيانات المحلية
- **checkIpLogin**: التحقق من تذكر المستخدم عبر IP
- **onAuthStateChange**: الاستماع لتغييرات حالة المصادقة

#### إدارة الجلسات
```typescript
// Supabase client configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'supabase.auth.token',
  },
});
```

### Auto-Login بعد التسجيل
```typescript
const signUp = async (email: string, password: string, fullName: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${window.location.origin}/sign-up-login-screen`,
    },
  });
  
  return { error, session: data?.session || null };
};

// In SignupForm
const { error, session } = await signUp(data.email, data.password, data.fullName);
if (session) {
  window.location.href = '/chat-page'; // Auto-login
}
```

---

## إدارة المحادثات

### هيكل المحادثات
```
ChatPage (page.tsx)
├── Suspense boundary
└── ChatContent
    ├── Auth check
    └── ChatPageClient
        ├── Message loading (useEffect on chatId)
        ├── Conversation fetching (from Sidebar)
        ├── ChatMain (key={chatId})
        │   ├── Messages display
        │   ├── Input area
        │   └── Code panel
        └── ChatSidebar
            ├── Conversation list
            ├── New chat button
            └── Search
```

### تحميل الرسائل
```typescript
// In ChatPageClient
useEffect(() => {
  async function fetchChatMessages() {
    if (!chatId) {
      setMessages([]);
      return;
    }

    setIsMessagesLoading(true);
    const response = await fetch(`/api/messages?conversationId=${chatId}`);
    if (response.ok) {
      const data = await response.json();
      const formattedMessages = data.messages.map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        mode: msg.mode,
        timestamp: new Date(msg.created_at).toLocaleTimeString('ar-SA'),
        codeBlock: msg.code_block,
      }));
      setMessages(formattedMessages);
    }
    setIsMessagesLoading(false);
  }
  fetchChatMessages();
}, [chatId]);
```

### إنشاء محادثة جديدة
```typescript
const createNewConversation = async (): Promise<string | null> => {
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

  const data = await response.json();
  const conversationId = data.conversation.id;
  
  setConversations(prev => [newConv, ...prev]);
  setActiveConvId(conversationId);
  localStorage.setItem(`lastConvId_${user.id}`, conversationId);
  router.push(`/chat-page?id=${conversationId}`);
  
  return conversationId;
};
```

---

## الأدوات والتقنيات المستخدمة

### Frontend
- **Next.js 15** (App Router)
- **TypeScript** (Strict mode)
- **TailwindCSS** (Styling)
- **Lucide React** (Icons)
- **React** (Hooks: useState, useEffect, useRef, useCallback)

### Backend
- **Next.js API Routes** (Serverless functions)
- **Supabase** (PostgreSQL database)
- **Vercel AI SDK** (AI integration)
  - **Groq** (LLM provider)
  - **Google Gemini** (LLM provider)

### AI Providers
- **Groq**: 
  - llama-3.1-8b-instant (سريع وفعال)
  - gemma2-9b-it (دقيق ومفصل)
- **Google Gemini**: 
  - gemini-1.5-flash (سريع)
  - gemini-2.0-flash (متقدم)

### قواعد البيانات
- **Supabase PostgreSQL**
- **Row Level Security (RLS)**
- **Real-time subscriptions**

### Web Search
- **Serper API** (Google Search API)

### File Processing
- **pdf-parse** (استخراج النصوص من PDF)
- **xlsx** (استخراج النصوص من Excel)

---

## هيكل المشروع

```
aylnor/
├── src/
│   ├── app/
│   │   ├── page.tsx                      # Landing page with auto-redirect
│   │   ├── layout.tsx                    # Root layout
│   │   ├── sign-up-login-screen/         # Authentication pages
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   │       ├── SignupForm.tsx
│   │   │       └── LoginForm.tsx
│   │   ├── chat-page/                    # Chat application
│   │   │   ├── page.tsx                  # Chat page with Suspense
│   │   │   └── components/
│   │   │       ├── ChatPageClient.tsx    # Main chat logic
│   │   │       ├── ChatMain.tsx          # Messages display
│   │   │       ├── ChatSidebar.tsx       # Conversation list
│   │   │       ├── CodeDisplayPanel.tsx  # Code display
│   │   │       ├── FileCard.tsx          # File display
│   │   │       └── FileDownloadCard.tsx
│   │   ├── components/                   # Landing page components
│   │   │   ├── LandingNav.tsx
│   │   │   ├── HeroSection.tsx
│   │   │   ├── FeaturesSection.tsx
│   │   │   ├── CreatorSection.tsx
│   │   │   ├── CtaSection.tsx
│   │   │   └── LandingFooter.tsx
│   │   └── api/                          # API routes
│   │       ├── chat/route.ts             # Chat API with streaming
│   │       ├── conversations/route.ts   # Conversations CRUD
│   │       ├── messages/route.ts         # Messages CRUD
│   │       ├── extract-text/route.ts     # Text extraction
│   │       └── knowledge-base/route.ts   # File management
│   ├── contexts/
│   │   └── auth-context.tsx              # Authentication context
│   ├── lib/
│   │   ├── supabase.ts                   # Supabase client
│   │   ├── ai-service.ts                 # AI service
│   │   └── ai-key-rotation.ts            # AI key rotation
│   └── types/
│       └── index.ts                      # TypeScript types
├── supabase-schema.sql                   # Database schema
├── .env                                  # Environment variables
├── .env.example                          # Environment variables example
├── package.json                          # Dependencies
├── tsconfig.json                         # TypeScript config
├── tailwind.config.ts                    # Tailwind config
└── next.config.js                        # Next.js config
```

---

## أوضاع البوت

### 1. الوضع السريع (Quick)
- **الوصف**: إجابات سريعة وموجزة
- **الحد**: غير محدود
- **الترتيب**: model-3, model-4, model-2, model-1
- **الاستخدام**: للأسئلة السريعة والبسيطة

### 2. الوضع المفكر (Thoughtful)
- **الوصف**: شروحات عميقة ومفصلة
- **الحد**: 50 رسالة/ساعة
- **الترتيب**: model-3, model-4, model-2, model-1
- **الاستخدام**: للشروحات الأكاديمية والتحليلات العميقة

### 3. الوضع المبرمج (Programming)
- **الوصف**: أولوية الكود مع تمييز الصياغة
- **الحد**: 50 رسالة/ساعة
- **الترتيب**: model-3, model-4, model-2, model-1
- **الاستخدام**: للأسئلة البرمجية والكود

---

## تدوير مفاتيح AI

### المفاتيح المتاحة
- **model-1**: Gemini (gemini-1.5-flash)
- **model-2**: Gemini (gemini-2.0-flash)
- **model-3**: Groq (llama-3.1-8b-instant)
- **model-4**: Groq (gemma2-9b-it)

### استراتيجية التدوير
```typescript
const MODE_ROTATION_PRIORITIES: Record<BotMode, AIModel[]> = {
  quick: ['model-3', 'model-4', 'model-2', 'model-1'],
  thoughtful: ['model-3', 'model-4', 'model-2', 'model-1'],
  programming: ['model-3', 'model-4', 'model-2', 'model-1'],
};
```

### معالجة الأخطاء
- الحد الأقصى للفشلات: 3
- فترة التبريد: 5 دقائق
- التدوير التلقائي عند الفشل
- Logging شامل لتتبع الأخطاء

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# AI API Keys
GEMINI_API_KEY_1=your-gemini-api-key-1
GEMINI_API_KEY_2=your-gemini-api-key-2
GROQ_API_KEY_1=your-groq-api-key-1
GROQ_API_KEY_2=your-groq-api-key-2

# Web Search
SEARCH_API_KEY=your-serper-api-key

# App URL
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

---

## المشاكل والحلول

### 1. اختفاء الرسائل عند التبديل بين المحادثات
**المشكلة**: عند التبديل بين المحادثات، تختفي جميع الرسائل

**الأسباب المحتملة**:
- `key={chatId}` على ChatMain يسبب إعادة تحميل المكون بالكامل
- useEffect لتحميل الرسائل لا يعمل بشكل صحيح

**الحل**:
- إزالة `key={chatId}` من ChatMain
- الاعتماد على useEffect لتحميل الرسائل بناءً على chatId
- إضافة console logging لتتبع التغييرات

### 2. مشكلة "Add New Chat" بعد Suspense
**المشكلة**: بعد إضافة Suspense boundary، توقف زر "Add New Chat" عن العمل

**الأسباب المحتملة**:
- `key={chatId}` على ChatPageClient يسبب إعادة تحميل Sidebar
- Sidebar يفقد state عند إعادة التحميل

**الحل**:
- إزالة `key={chatId}` من ChatPageClient
- إضافة `key={chatId}` فقط إلى ChatMain
- إضافة `router.refresh()` بعد إنشاء محادثة جديدة

### 3. اختفاء المحادثات عند تسجيل الخروج والدخول
**المشكلة**: عند تسجيل الخروج والدخول مرة أخرى، تختفي المحادثات

**الأسباب المحتملة**:
- conversations API يستخدم client client بدلاً من server client
- RLS policies تمنع جلب المحادثات

**الحل**:
- تحديث conversations API لاستخدام supabaseServer()
- التأكد من أن RLS policies تسمح بجلب المحادثات
- إزالة التكرار في جلب المحادثات

### 4. البوت يرد برسائل فارغة
**المشكلة**: جميع الأوضاع تُرجع رسائل فارغة

**الأسباب المحتملة**:
- مفاتيح AI غير مكونة في Environment Variables
- ترتيب المفاتيح يبدأ بـ Gemini بينما مفاتيح Groq فقط متوفرة

**الحل**:
- تعديل ترتيب المفاتيح لاستخدام Groq أولاً
- إضافة المفاتيح في Vercel Environment Variables
- إضافة logging لتتبع حالة المفاتيح

### 5. انفصال METADATA عن JSON في الـ Stream
**المشكلة**: الـ metadata يُرسل في chunk منفصل عن JSON

**الحل**:
- دمج إرسال METADATA في سطر واحد في السيرفر
- إضافة `metadataReceived` flag في العميل

---

## دليل التشغيل

### التثبيت المحلي
```bash
# Clone the repository
git clone https://github.com/yourusername/aylnor.git
cd aylnor

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values

# Run the development server
npm run dev
```

### النشر على Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### إعداد Supabase
1. إنشاء مشروع جديد في Supabase
2. تشغيل SQL schema من `supabase-schema.sql`
3. نسخ URL و Keys إلى Environment Variables
4. تفعيل Row Level Security

### إعداد مفاتيح AI
1. الحصول على مفاتيح Groq من https://groq.com
2. الحصول على مفاتيح Gemini من https://ai.google.dev
3. إضافة المفاتيح في Vercel Environment Variables
4. Redeploy المشروع

---

## الخالق
تم تصميم وتطوير AYLNOR.AI بواسطة: **الطالب المهندس أحمد قريز**

---

## تاريخ التوثيق
آخر تحديث: 29 مايو 2026
