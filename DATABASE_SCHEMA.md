# Database Schema Documentation

This document outlines the database schema for the aylnor.ai application using Supabase.

## Tables

### 1. conversations
Stores chat sessions for users.

```sql
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 2. messages
Stores individual messages within conversations.

```sql
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
```

### 3. user_preferences
Stores user settings and bot persona configurations.

```sql
CREATE TABLE user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  bot_name TEXT NOT NULL DEFAULT 'aylnor',
  bot_style TEXT NOT NULL DEFAULT 'friendly' CHECK (bot_style IN ('formal', 'friendly', 'concise')),
  focus_area TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Trigger for updated_at
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 4. api_usage
Tracks AI tool usage and rate limiting.

```sql
CREATE TABLE api_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tool_used TEXT NOT NULL,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_api_usage_user_id ON api_usage(user_id);
CREATE INDEX idx_api_usage_created_at ON api_usage(created_at DESC);
```

## Row Level Security (RLS) Policies

Enable RLS on all tables:

```sql
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
```

### Conversations RLS Policies

```sql
-- Users can only see their own conversations
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own conversations
CREATE POLICY "Users can insert own conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own conversations
CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own conversations
CREATE POLICY "Users can delete own conversations"
  ON conversations FOR DELETE
  USING (auth.uid() = user_id);
```

### Messages RLS Policies

```sql
-- Users can view messages in their own conversations
CREATE POLICY "Users can view messages in own conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- Users can insert messages in their own conversations
CREATE POLICY "Users can insert messages in own conversations"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );
```

### User Preferences RLS Policies

```sql
-- Users can view their own preferences
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);
```

### API Usage RLS Policies

```sql
-- Users can view their own usage
CREATE POLICY "Users can view own usage"
  ON api_usage FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert usage records
CREATE POLICY "System can insert usage"
  ON api_usage FOR INSERT
  WITH CHECK (true);
```

## Database Functions

### Get Conversation Statistics

```sql
CREATE OR REPLACE FUNCTION get_conversation_stats(user_uuid UUID)
RETURNS TABLE (
  total_conversations BIGINT,
  total_messages BIGINT,
  total_tokens BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM conversations WHERE user_id = user_uuid),
    (SELECT COUNT(*) FROM messages m
     JOIN conversations c ON m.conversation_id = c.id
     WHERE c.user_id = user_uuid),
    (SELECT COALESCE(SUM(tokens_used), 0) FROM api_usage WHERE user_id = user_uuid);
END;
$$ LANGUAGE plpgsql;
```

### Search Messages

```sql
CREATE OR REPLACE FUNCTION search_messages(user_uuid UUID, search_term TEXT)
RETURNS TABLE (
  conversation_id UUID,
  conversation_title TEXT,
  message_id UUID,
  message_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS conversation_id,
    c.title AS conversation_title,
    m.id AS message_id,
    m.content AS message_content,
    m.created_at
  FROM messages m
  JOIN conversations c ON m.conversation_id = c.id
  WHERE c.user_id = user_uuid
  AND m.content ILIKE '%' || search_term || '%'
  ORDER BY m.created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql;
```

## Setup Instructions

1. Create a new Supabase project at https://supabase.com
2. Navigate to the SQL Editor in Supabase dashboard
3. Execute the SQL commands above in order:
   - Create tables
   - Create indexes
   - Create triggers
   - Enable RLS
   - Create RLS policies
   - Create functions
4. Copy your Supabase URL and anon key to your environment variables
5. Enable Email/Password authentication in Supabase dashboard
6. Configure email templates for verification and password reset

## Migration Notes

- Always test RLS policies in a development environment first
- Use the service role key for admin operations only
- Never expose service role keys in client-side code
- Regularly backup your database
- Monitor database performance and optimize indexes as needed
