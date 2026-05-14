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

The system implements a comprehensive token tracking mechanism:

```typescript
class TokenTracker {
  - Tracks available tokens per model
  - Automatic reset every 30 days
  - Real-time token deduction after each request
  - Token purchase functionality
}
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

- Token tracker uses in-memory storage (suitable for serverless)
- Consider Redis for production if persistence is needed
- Implement connection pooling for AI API clients

### Request Optimization

- Streaming responses for Groq models (Llama 3, Mixtral)
- Non-streaming for Gemini (current limitation)
- Automatic retry logic with exponential backoff

### Monitoring and Logging

```typescript
// System logs model transitions
console.log(`Transitioning from ${primaryModel} to ${model} due to token exhaustion`);

// API usage tracking
console.log(`Purchased ${amount} tokens for ${model} model`);
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

### Horizontal Scaling

- Each serverless function instance maintains its own token tracker
- For production, consider Redis for shared token state
- Implement distributed locking for token purchases

### Token Pool Management

- Implement token pooling for multiple users
- Add user-specific token quotas
- Implement token expiration and renewal

## Conclusion

This token-based AI model system ensures continuous operation of the aylnor.ai application by:

1. **Independent Model Operation**: Three models operate independently with dedicated token pools
2. **Automatic Failover**: Seamless transitions between models when tokens are exhausted
3. **Reserve System**: Backup API keys ensure operation even during primary key failures
4. **Token Management**: Comprehensive API for purchasing and monitoring tokens
5. **Vercel Optimization**: Designed for serverless architecture with cold start mitigation

The system guarantees that the bot remains operational at all times, providing users with uninterrupted AI assistance regardless of token availability or API key status.
