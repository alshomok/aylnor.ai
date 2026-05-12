# Aylnor.ai - AI Chatbot for Al-Shamoukh Institute

A sophisticated AI-powered chatbot built by Ahmed Quraiz for Al-Shamoukh Institute, featuring multi-model AI integration with seamless failover between Gemini and Grok models.

## 🚀 Features

### Multi-Model AI System
- **2 Gemini Models**: `gemini-1.5-pro` and `gemini-1.5-flash`
- **2 Grok Models**: `grok-beta` with dual API keys
- **Intelligent Failover**: Automatic switching between models when tokens are exhausted
- **Load Balancing**: Even distribution of requests across available models

### Database Integration
- **Supabase Backend**: Complete chat history and user management
- **Usage Tracking**: Token usage monitoring per user and model
- **Session Management**: Persistent chat sessions
- **Real-time Analytics**: Usage statistics and performance metrics

### Modern Frontend
- **Next.js 16**: Latest React framework with App Router
- **Beautiful UI**: Tailwind CSS with custom components
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Real-time Chat**: Smooth typing indicators and animations

## 🛠️ Technology Stack

### Frontend
- **Next.js 16.2.6** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Radix UI** - Accessible components

### Backend
- **Next.js API Routes** - Serverless functions
- **Google Generative AI** - Gemini model integration
- **X.AI Grok API** - Grok model integration
- **Supabase** - Database and authentication

### Deployment
- **Vercel** - Serverless deployment platform
- **Environment Variables** - Secure configuration management

## 📋 Setup Instructions

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd new-cypher
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env.local` and fill in your API keys:

```bash
cp .env.example .env.local
```

Required environment variables:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google Gemini API Keys
GEMINI_API_KEY_1=your_gemini_api_key_1
GEMINI_API_KEY_2=your_gemini_api_key_2

# X.AI Grok API Keys
GROK_API_KEY_1=your_grok_api_key_1
GROK_API_KEY_2=your_grok_api_key_2

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

### 4. Database Setup
1. Create a new Supabase project
2. Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor
3. Configure Row Level Security (RLS) policies as defined in the schema

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🏗️ Project Structure

```
new-cypher/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication pages
│   │   ├── login/
│   │   └── signup/
│   ├── (chat)/                   # Chat interface
│   │   └── chat/
│   ├── api/                      # API routes
│   │   └── chat/
│   │       ├── route.ts          # Basic chat API
│   │       └── enhanced/         # Enhanced API with database
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/                   # React components
│   ├── ui/                      # Base UI components
│   ├── aylnor-logo.tsx          # Custom logo
│   ├── chat-interface.tsx        # Main chat component
│   └── ...
├── lib/                         # Utility libraries
│   └── supabase.ts              # Supabase client
├── hooks/                        # Custom React hooks
├── styles/                       # Global styles
├── public/                       # Static assets
├── supabase-schema.sql           # Database schema
├── vercel.json                   # Vercel configuration
└── README.md                     # This file
```

## 🔧 API Endpoints

### Chat API
- **POST** `/api/chat/enhanced` - Send message with database integration
- **GET** `/api/chat/enhanced` - Get model status and usage
- **POST** `/api/chat` - Basic chat without database

### Request Format
```json
{
  "messages": [
    {
      "role": "user|assistant|system",
      "content": "message content"
    }
  ],
  "model": "gemini|grok|auto",
  "userId": "user-uuid",
  "sessionId": "session-uuid"
}
```

### Response Format
```json
{
  "success": true,
  "response": "AI response text",
  "model": "gemini-1.5-pro",
  "provider": "gemini",
  "usage": {
    "gemini": 10,
    "grok": 5
  }
}
```

## 🎯 Model Failover Logic

The system implements intelligent failover with the following priority:

1. **Primary Choice**: Gemini models (higher quality responses)
2. **Fallback**: Grok models (when Gemini tokens are exhausted)
3. **Load Balancing**: Automatic rotation between multiple API keys
4. **Error Recovery**: Immediate switching on API failures

### Failover Flow
```
User Request → Gemini 1 → Gemini 2 → Grok 1 → Grok 2 → Error
```

## 📊 Database Schema

### Tables
- **users** - User profiles and authentication
- **chat_sessions** - Chat conversation sessions
- **chat_messages** - Individual chat messages
- **ai_usage** - Token usage tracking

### Security
- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- API keys stored securely in environment variables

## 🚀 Deployment

### Vercel Deployment
1. Connect your repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on git push

### Environment Variables for Production
```env
NEXT_PUBLIC_APP_URL=https://aylnor.ai
```

## 🔍 Monitoring and Analytics

### Built-in Analytics
- Token usage per model
- Request success rates
- Error tracking and logging
- User session analytics

### Database Analytics
- Chat history persistence
- Usage statistics
- Performance metrics

## 🤝 Contributing

This project was developed by Ahmed Quraiz for Al-Shamoukh Institute.

## 📄 License

Proprietary - Al-Shamoukh Institute

## 🆘 Support

For technical support or questions, please contact the development team.

---

**Built with ❤️ by Ahmed Quraiz for Al-Shamoukh Institute**
