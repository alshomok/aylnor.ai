# Token-Based AI Model System Deployment Guide

## Overview

This document provides comprehensive instructions for deploying the aylnor.ai application with a token-based AI model system on Vercel. The system ensures continuous operation by implementing three active models with automatic failover and three reserve models for backup.

## System Architecture

### Active Models (Independent Operation)

1. **Fast Model** (`fast`)
   - **AI Tool**: Llama 3 70B via Groq
   - **Purpose**: Quick, instant responses for fast mode
   - **Token Limit**: 1,000,000 tokens per month
   - **Priority**: 1 (highest priority for fast requests)

2. **Meditate Model** (`meditate`)
   - **AI Tool**: Gemini Pro via Google
   - **Purpose**: Deep, detailed explanations for thoughtful mode
   - **Token Limit**: 1,000,000 tokens per month
   - **Priority**: 2 (for thoughtful requests)

3. **Code Model** (`code`)
   - **AI Tool**: Mixtral 8x7B via Groq
   - **Purpose**: Code generation and debugging for programming mode
   - **Token Limit**: 1,000,000 tokens per month
   - **Priority**: 3 (for programming requests)

### Reserve Models (Backup System)

Each active model has a corresponding reserve model using a separate API key:
- **Fast Reserve**: Llama 3 70B with `GROQ_API_KEY_2`
- **Meditate Reserve**: Gemini Pro with `GEMINI_API_KEY_2`
- **Code Reserve**: Mixtral 8x7B with `GROQ_API_KEY_2`

## Token Tracking and Model Transition Logic

### Token Management System

The system implements a comprehensive token tracking mechanism with support for both in-memory and database-backed storage:

```typescript
class TokenTracker {
  - Tracks available tokens per model
  - Automatic reset every 30 days
  - Real-time token deduction after each request
  - Token purchase functionality
}
```

### Distributed Token Storage Architecture

**CRITICAL**: In a production serverless environment (Vercel), the token tracker **must** reside in a shared database rather than in-memory. In-memory storage is local to each serverless instance and will not persist across function invocations or provide consistency across multiple instances.

#### Using Supabase for Token Storage

Implement a token tracker table in Supabase to maintain consistent token state:

```sql
-- Create token_tracker table in Supabase
CREATE TABLE token_tracker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_type TEXT NOT NULL UNIQUE CHECK (model_type IN ('fast', 'meditate', 'code')),
  available_tokens INTEGER NOT NULL DEFAULT 1000000,
  total_tokens INTEGER NOT NULL DEFAULT 1000000,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX idx_token_tracker_model_type ON token_tracker(model_type);

-- Create token purchase history table
CREATE TABLE token_purchase_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  user_id UUID,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (model_type) REFERENCES token_tracker(model_type)
);

-- Set up Row Level Security (RLS) policies
ALTER TABLE token_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_purchase_history ENABLE ROW LEVEL SECURITY;
```

#### TypeScript Implementation for Supabase-Backed Token Tracker

```typescript
import { supabaseAdmin } from './supabase';

interface TokenStatus {
  availableTokens: number;
  totalTokens: number;
  lastUpdated: Date;
}

export class SupabaseTokenTracker {
  private readonly RESET_INTERVAL = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

  /**
   * Check if model has available tokens
   */
  async hasTokens(model: 'fast' | 'meditate' | 'code'): Promise<boolean> {
    if (!supabaseAdmin) {
      console.warn('Supabase admin client not available');
      return false;
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('token_tracker')
        .select('available_tokens, last_updated')
        .eq('model_type', model)
        .single();

      if (error) {
        console.error(`Error checking tokens for ${model}:`, error);
        return false;
      }

      if (!data) {
        console.warn(`No token record found for model: ${model}`);
        return false;
      }

      // Reset if interval has passed
      const lastUpdated = new Date(data.last_updated);
      if (Date.now() - lastUpdated.getTime() > this.RESET_INTERVAL) {
        await this.resetTokens(model);
        return true;
      }

      return data.available_tokens > 0;
    } catch (error) {
      console.error('Error checking token availability:', error);
      return false;
    }
  }

  /**
   * Deduct tokens from a model
   */
  async deductTokens(model: 'fast' | 'meditate' | 'code', tokensUsed: number): Promise<void> {
    if (!supabaseAdmin) {
      console.warn('Supabase admin client not available');
      return;
    }

    try {
      const { error } = await supabaseAdmin
        .from('token_tracker')
        .update({
          available_tokens: supabaseAdmin.sql`GREATEST(0, available_tokens - ${tokensUsed})`,
          updated_at: new Date().toISOString()
        })
        .eq('model_type', model);

      if (error) {
        console.error(`Error deducting tokens for ${model}:`, error);
      }
    } catch (error) {
      console.error('Error updating tokens:', error);
    }
  }

  /**
   * Purchase tokens for a model
   */
  async purchaseTokens(model: 'fast' | 'meditate' | 'code', amount: number, userId?: string): Promise<void> {
    if (!supabaseAdmin) {
      console.warn('Supabase admin client not available');
      return;
    }

    try {
      // Update token balance
      const { error: updateError } = await supabaseAdmin
        .from('token_tracker')
        .update({
          available_tokens: supabaseAdmin.sql`available_tokens + ${amount}`,
          total_tokens: supabaseAdmin.sql`total_tokens + ${amount}`,
          updated_at: new Date().toISOString()
        })
        .eq('model_type', model);

      if (updateError) {
        console.error(`Error updating tokens for ${model}:`, updateError);
        return;
      }

      // Record purchase history
      const { error: historyError } = await supabaseAdmin
        .from('token_purchase_history')
        .insert({
          model_type: model,
          amount,
          user_id: userId
        });

      if (historyError) {
        console.error('Error recording purchase history:', historyError);
      }

      console.log(`Successfully purchased ${amount} tokens for ${model} model`);
    } catch (error) {
      console.error('Error processing token purchase:', error);
    }
  }

  /**
   * Reset tokens for a model
   */
  async resetTokens(model: 'fast' | 'meditate' | 'code'): Promise<void> {
    if (!supabaseAdmin) {
      console.warn('Supabase admin client not available');
      return;
    }

    try {
      const { error } = await supabaseAdmin
        .from('token_tracker')
        .update({
          available_tokens: 1000000,
          total_tokens: 1000000,
          updated_at: new Date().toISOString()
        })
        .eq('model_type', model);

      if (error) {
        console.error(`Error resetting tokens for ${model}:`, error);
      } else {
        console.log(`Tokens reset for ${model} model`);
      }
    } catch (error) {
      console.error('Error resetting tokens:', error);
    }
  }

  /**
   * Get token status for all models
   */
  async getAllStatus(): Promise<Record<'fast' | 'meditate' | 'code', TokenStatus>> {
    if (!supabaseAdmin) {
      console.warn('Supabase admin client not available');
      return {};
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('token_tracker')
        .select('model_type, available_tokens, total_tokens, last_updated');

      if (error) {
        console.error('Error fetching token status:', error);
        return {};
      }

      const status: Record<'fast' | 'meditate' | 'code', TokenStatus> = {
        fast: { availableTokens: 0, totalTokens: 0, lastUpdated: new Date() },
        meditate: { availableTokens: 0, totalTokens: 0, lastUpdated: new Date() },
        code: { availableTokens: 0, totalTokens: 0, lastUpdated: new Date() }
      };

      data?.forEach((row) => {
        const modelType = row.model_type as 'fast' | 'meditate' | 'code';
        status[modelType] = {
          availableTokens: row.available_tokens,
          totalTokens: row.total_tokens,
          lastUpdated: new Date(row.last_updated)
        };
      });

      return status;
    } catch (error) {
      console.error('Error fetching all token statuses:', error);
      return {};
    }
  }
}

// Usage in API routes
export const tokenTracker = new SupabaseTokenTracker();
```

### Model Transition Logic Flow

**Example Scenario: User purchases tokens for "fast" model**

1. **Initial State**: Fast model has 0 tokens available
2. **Token Purchase**: User purchases 100,000 tokens for fast model
3. **Model Activation**: Fast model becomes operational with 100,000 tokens
4. **Request Processing**: System uses fast model for fast mode requests
5. **Token Exhaustion**: When fast model tokens reach 0:
   - System automatically transitions to meditate model
   - If meditate also exhausted, transitions to code model
   - If all models exhausted, uses reserve API keys
6. **Continuous Operation**: Bot remains operational at all times

### Automatic Failover Mechanism

The system implements three levels of failover:

1. **Primary to Reserve**: If primary API key fails, automatically uses reserve key
2. **Model Transition**: If model tokens exhausted, transitions to next available model
3. **Complete Failover**: If all models fail, attempts all available options before error

## Vercel Deployment Configuration

### Required Environment Variables

Add these variables in Vercel Project Settings → Environment Variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI API Keys (Primary)
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key

# AI API Keys (Reserve/Backup)
GEMINI_API_KEY_2=your_gemini_api_key_reserve
GROQ_API_KEY_2=your_groq_api_key_reserve

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://your-app.vercel.app

# Application Configuration
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Deployment Steps

#### 1. Prepare Your Codebase

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Test locally
npm run dev
```

#### 2. Connect to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to Vercel
vercel --prod
```

#### 3. Configure Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add all required environment variables
4. Select appropriate environments (Production, Preview, Development)
5. Click "Save"

#### 4. Redeploy After Configuration

1. Go to Deployments tab in Vercel
2. Click "..." on the latest deployment
3. Select "Redeploy"
4. Wait for deployment to complete

## API Endpoints for Token Management

### Purchase Tokens

```http
POST /api/tokens/purchase
Content-Type: application/json

{
  "model": "fast",
  "amount": 100000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully purchased 100000 tokens for fast model",
  "model": "fast",
  "amount": 100000,
  "newStatus": {
    "fast": {
      "availableTokens": 100000,
      "totalTokens": 100000,
      "lastUpdated": 1234567890
    },
    "meditate": { ... },
    "code": { ... }
  }
}
```

### Get Token Status

```http
GET /api/tokens/status
```

**Response:**
```json
{
  "success": true,
  "status": {
    "fast": {
      "availableTokens": 500000,
      "totalTokens": 1000000,
      "lastUpdated": 1234567890
    },
    "meditate": {
      "availableTokens": 750000,
      "totalTokens": 1000000,
      "lastUpdated": 1234567890
    },
    "code": {
      "availableTokens": 250000,
      "totalTokens": 1000000,
      "lastUpdated": 1234567890
    }
  }
}
```

## Dependencies and Configurations

### Required npm Packages

```json
{
  "dependencies": {
    "@google/generative-ai": "^0.1.0",
    "groq-sdk": "^0.1.0",
    "@supabase/supabase-js": "^2.0.0",
    "next": "^15.0.0",
    "react": "^19.0.0"
  }
}
```

### Vercel Configuration

Ensure your `vercel.json` (if present) includes:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

### Next.js Configuration

The `next.config.mjs` should include:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    // Environment variables are loaded from Vercel
  }
};

export default nextConfig;
```

## Performance Optimization for Serverless

### Cold Start Mitigation

- Token tracker uses Supabase for persistent storage across serverless invocations
- Alternative: Use Redis for high-performance in-memory caching with persistence
- Implement connection pooling for AI API clients and database connections

### Database Connection Pooling

For optimal performance with Supabase:

```typescript
// Connection pooling through Supabase JS client
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key, {
  auth: {
    persistSession: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
```

### Request Optimization

- Streaming responses for Groq models (Llama 3, Mixtral)
- Non-streaming for Gemini (current limitation)
- Automatic retry logic with exponential backoff
- Batch token updates to reduce database calls

### Monitoring and Logging

```typescript
// System logs model transitions
console.log(`Transitioning from ${primaryModel} to ${model} due to token exhaustion`);

// API usage tracking
console.log(`Purchased ${amount} tokens for ${model} model`);

// Database operation logging
console.log(`Token purchase recorded in Supabase for model: ${model}`);
```

## Testing the Deployment

### 1. Test Token Status

```bash
curl https://your-app.vercel.app/api/tokens/status
```

### 2. Test Token Purchase

```bash
curl -X POST https://your-app.vercel.app/api/tokens/purchase \
  -H "Content-Type: application/json" \
  -d '{"model":"fast","amount":100000}'
```

### 3. Test AI Response

```bash
curl -X POST https://your-app.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Hello","mode":"fast"}'
```

## Troubleshooting

### Common Issues

**Issue**: Models not responding
- **Solution**: Check API keys in Vercel environment variables
- **Solution**: Verify token status via `/api/tokens/status`

**Issue**: Token exhaustion
- **Solution**: Purchase tokens via `/api/tokens/purchase`
- **Solution**: Check automatic model transition logs

**Issue**: Reserve models not activating
- **Solution**: Verify reserve API keys (`_2` suffix)
- **Solution**: Check system logs for failover attempts

### Monitoring

Monitor the following metrics in Vercel:
- Function execution time
- Error rates
- API response times
- Token usage patterns

## Security Considerations

1. **API Key Management**: Never commit API keys to version control
2. **Environment Variables**: Use Vercel's encrypted environment variables
3. **Rate Limiting**: Implement user-level rate limiting
4. **Token Validation**: Validate token purchase requests
5. **Access Control**: Restrict token management endpoints to admin users

## Scaling Considerations

### Horizontal Scaling with Supabase

- Token state is centralized in Supabase, eliminating sync issues across serverless instances
- Each serverless function instance queries the same database for token status
- Database row-level locking ensures atomic token updates
- Use Supabase's real-time subscriptions for live token status updates

```typescript
// Real-time token updates with Supabase
supabaseAdmin
  .channel('token_tracker_updates')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'token_tracker'
    },
    (payload) => {
      console.log('Token status updated:', payload.new);
    }
  )
  .subscribe();
```

### Token Pool Management

- Implement token pooling for multiple users per model
- Add user-specific token quotas via a `user_token_allocation` table
- Implement token expiration and renewal policies
- Track token usage per user for analytics and billing

#### User Token Allocation Table

```sql
CREATE TABLE user_token_allocation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  model_type TEXT NOT NULL CHECK (model_type IN ('fast', 'meditate', 'code')),
  allocated_tokens INTEGER NOT NULL,
  used_tokens INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE,
  FOREIGN KEY (user_id) REFERENCES auth.users(id),
  FOREIGN KEY (model_type) REFERENCES token_tracker(model_type),
  UNIQUE(user_id, model_type)
);

-- Track individual request token consumption
CREATE TABLE token_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  model_type TEXT NOT NULL,
  tokens_consumed INTEGER NOT NULL,
  request_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES auth.users(id),
  FOREIGN KEY (model_type) REFERENCES token_tracker(model_type)
);
```

### Distributed Locking for Token Updates

To prevent race conditions when multiple instances update tokens simultaneously:

```typescript
import { supabaseAdmin } from './supabase';

export async function updateTokensSafely(
  model: 'fast' | 'meditate' | 'code',
  tokensToDeduct: number
): Promise<boolean> {
  if (!supabaseAdmin) return false;

  try {
    // Use a database transaction via Supabase RPC
    const { data, error } = await supabaseAdmin
      .rpc('deduct_tokens_safe', {
        p_model_type: model,
        p_tokens: tokensToDeduct
      });

    if (error) {
      console.error('Error updating tokens safely:', error);
      return false;
    }

    return data;
  } catch (error) {
    console.error('Error in safe token update:', error);
    return false;
  }
}

// Corresponding PostgreSQL function in Supabase
// CREATE OR REPLACE FUNCTION deduct_tokens_safe(
//   p_model_type TEXT,
//   p_tokens INT
// ) RETURNS BOOLEAN AS $$
// BEGIN
//   UPDATE token_tracker
//   SET available_tokens = GREATEST(0, available_tokens - p_tokens),
//       updated_at = CURRENT_TIMESTAMP
//   WHERE model_type = p_model_type;
//   RETURN TRUE;
// EXCEPTION WHEN OTHERS THEN
//   RETURN FALSE;
// END;
// $$ LANGUAGE plpgsql;

## Conclusion

This token-based AI model system ensures continuous operation of the aylnor.ai application by:

1. **Independent Model Operation**: Three models operate independently with dedicated token pools
2. **Automatic Failover**: Seamless transitions between models when tokens are exhausted
3. **Reserve System**: Backup API keys ensure operation even during primary key failures
4. **Database-Backed Token Management**: Supabase provides persistent, consistent token tracking across all serverless instances
5. **Distributed Consistency**: Centralized token state prevents synchronization issues in serverless environments
6. **Real-time Monitoring**: Track token usage with Supabase's real-time subscriptions
7. **Vercel Optimization**: Designed for serverless architecture with proper state management

**Key Implementation Note**: The token tracker is now backed by Supabase's PostgreSQL database rather than in-memory storage. This critical change ensures:
- Token state persists across serverless function invocations
- Multiple instances remain synchronized
- Atomic operations prevent race conditions
- Real-time visibility into token usage and status

The system guarantees that the bot remains operational at all times, providing users with uninterrupted AI assistance regardless of token availability or API key status.
