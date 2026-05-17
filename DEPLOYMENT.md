# Deployment Guide - aylnor.ai Chatbot Application

## Prerequisites

Before deploying to Vercel, ensure you have:

1. **Supabase Project**
   - Create a project at [supabase.com](https://supabase.com)
   - Get your project URL and anon key from project settings
   - Set up the required database tables (see SQL schema below)

2. **AI API Keys**
   - Gemini Flash API keys (2 keys for rotation)
   - Groq API keys (2 keys for rotation)
   - Get these from their respective developer portals

3. **Vercel Account**
   - Sign up at [vercel.com](https://vercel.com)
   - Install Vercel CLI (optional): `npm i -g vercel`

## Database Schema

Run this SQL in your Supabase SQL Editor to create the required tables:

```sql
-- Create users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  bot_name TEXT DEFAULT 'aylnor',
  bot_personality TEXT DEFAULT 'مساعد مفيد ودقيق وأكاديمي',
  theme TEXT DEFAULT 'dark',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('quick', 'thoughtful', 'programming')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'bot')),
  content TEXT NOT NULL,
  mode TEXT CHECK (mode IN ('quick', 'thoughtful', 'programming')),
  code_block JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Enable Row Level Security (optional, can be disabled for simplicity)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your security requirements)
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (true);

CREATE POLICY "Conversations are publicly accessible" ON conversations FOR SELECT USING (true);
CREATE POLICY "Anyone can create conversations" ON conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update conversations" ON conversations FOR UPDATE USING (true);

CREATE POLICY "Messages are publicly accessible" ON messages FOR SELECT USING (true);
CREATE POLICY "Anyone can create messages" ON messages FOR INSERT WITH CHECK (true);
```

## Environment Variables

### Local Development

1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. Fill in your actual values:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
GEMINI_API_KEY_1=your-gemini-api-key-1
GEMINI_API_KEY_2=your-gemini-api-key-2
GROK_API_KEY_1=your-grok-api-key-1
GROK_API_KEY_2=your-grok-api-key-2
```

### Vercel Deployment

#### Option 1: Using Vercel Dashboard

1. Push your code to GitHub/GitLab/Bitbucket
2. Import project in Vercel
3. Add environment variables in Vercel Dashboard:
   - Go to Settings → Environment Variables
   - Add all the variables from `.env.example`
   - Mark AI keys as "Secret" (they won't be exposed in logs)

#### Option 2: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add GEMINI_API_KEY_1
vercel env add GEMINI_API_KEY_2
vercel env add GROK_API_KEY_1
vercel env add GROK_API_KEY_2

# Production deployment
vercel --prod
```

## AI Key Rotation System

The application uses a 4-key rotation system:
1. Gemini Flash 1
2. Gemini Flash 2
3. Groq 1
4. Groq 2

**Rotation Logic:**
- Keys rotate in sequence: 1 → 2 → 3 → 4 → 1 (loop)
- If a key fails (rate limit, error, etc.), it automatically switches to the next
- Failed keys enter a 5-minute cooldown period
- After 3 consecutive failures, a key is temporarily disabled
- Successful responses reset the failure counter

**Key Configuration:**
- All keys are configured in `src/lib/ai-key-rotation.ts`
- Keys are loaded from environment variables
- Rotation happens automatically in the AI service layer

## Testing the Deployment

### 1. Test Database Connection
```bash
curl https://your-app.vercel.app/api/conversations?userId=demo-user
```

### 2. Test Chat API
```bash
curl -X POST https://your-app.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello",
    "conversationId": "test-id",
    "mode": "quick",
    "userId": "demo-user"
  }'
```

### 3. Test AI Key Rotation
- Send multiple requests to verify rotation works
- Intentionally use invalid keys to test failure handling
- Monitor logs for key rotation events

## Troubleshooting

### Common Issues

**1. Supabase Connection Errors**
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Check Supabase project is active
- Ensure RLS policies allow access

**2. AI API Failures**
- Verify all 4 API keys are valid
- Check API key quotas and limits
- Monitor key rotation logs
- Ensure keys have proper permissions

**3. Build Errors**
- Run `npm run build` locally first
- Check TypeScript errors: `npm run type-check`
- Verify all dependencies are installed

**4. Runtime Errors**
- Check Vercel deployment logs
- Verify environment variables are set correctly
- Ensure database schema matches the code expectations

## Monitoring

### Vercel Analytics
- Enable Vercel Analytics in project settings
- Monitor API response times
- Track error rates

### AI Key Usage
- Monitor key rotation in logs
- Track failure rates per key
- Set up alerts for high failure rates

### Database Performance
- Monitor Supabase dashboard
- Check query performance
- Optimize indexes if needed

## Security Considerations

**Note:** As per requirements, security features have been removed from the authentication system. The application now:
- Uses direct login without validation
- Removed password strength checks
- Removed demo credentials
- Removed remember me functionality
- Removed terms and conditions validation

**Important:** 
- Never commit `.env.local` to version control
- Use Vercel's environment variable secrets for sensitive data
- Rotate API keys regularly
- Monitor for unusual API usage patterns

## Scaling Considerations

### Database
- Supabase handles scaling automatically
- Consider connection pooling for high traffic
- Archive old conversations periodically

### AI APIs
- Monitor rate limits on all 4 keys
- Implement caching for repeated queries
- Consider adding more keys for higher traffic

### Vercel
- Start with hobby plan, upgrade as needed
- Enable edge functions for better performance
- Consider CDN for static assets

## Support

For issues related to:
- **Supabase**: [Supabase Documentation](https://supabase.com/docs)
- **Vercel**: [Vercel Documentation](https://vercel.com/docs)
- **Gemini API**: [Google AI Documentation](https://ai.google.dev/docs)
- **Groq API**: [Groq Documentation](https://console.groq.com/docs)

## Post-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database schema created
- [ ] AI keys tested individually
- [ ] Key rotation system tested
- [ ] Chat functionality tested
- [ ] Conversation persistence tested
- [ ] Error handling verified
- [ ] Monitoring enabled
- [ ] Backup strategy in place
- [ ] Documentation updated
