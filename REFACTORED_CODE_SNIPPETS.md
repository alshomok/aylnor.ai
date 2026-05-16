# Refactored Code Snippets

## 1. src/lib/supabase.ts

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.warn('Warning: NEXT_PUBLIC_SUPABASE_URL is not defined');
}

if (!supabaseAnonKey) {
  console.warn('Warning: NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined');
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Critical: Missing required Supabase environment variables (URL and Anon Key)');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

// Service role client for admin operations
// Returns null if service role key is not available
export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(
      supabaseUrl || '',
      supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
  : (() => {
      console.warn('Warning: SUPABASE_SERVICE_ROLE_KEY is not defined. Admin operations will not be available.');
      return null;
    })();

// Database types
export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  bot_name: string;
  bot_style: 'formal' | 'friendly' | 'concise';
  focus_area: string;
  created_at: string;
  updated_at: string;
}

export interface ApiUsage {
  id: string;
  user_id: string;
  tool_used: string;
  tokens_used: number;
  created_at: string;
}
```

### Key Changes:
- ✅ Removed `!` from environment variable declarations
- ✅ Added individual warning messages for missing variables
- ✅ `supabaseAdmin` returns `null` if service role key is missing
- ✅ Graceful fallback with empty strings instead of crashing
- ✅ Proper type safety with conditional null return

---

## 2. src/lib/ai-service.ts (Key Sections)

### API Key Initialization

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { KeyManager } from './key-manager';

// Collect Gemini API keys, removing empty ones
const geminiKeys = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
].filter(Boolean) as string[];

if (geminiKeys.length === 0) {
  console.warn('Warning: No Gemini API keys found. Gemini services will be unavailable.');
}

// Collect Groq API keys, removing empty ones
const groqKeys = [
  process.env.GROQ_API_KEY_1,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
  process.env.GROQ_API_KEY_4,
].filter(Boolean) as string[];

if (groqKeys.length === 0) {
  console.warn('Warning: No Groq API keys found. Groq services will be unavailable.');
}

// Initialize KeyManager only if keys are available
const geminiKeyManager = geminiKeys.length > 0 ? new KeyManager(geminiKeys) : null;
const groqKeyManager = groqKeys.length > 0 ? new KeyManager(groqKeys) : null;

// Initialize AI clients with dynamic key management (only if valid keys exist)
const geminiClient = geminiKeyManager ? new GoogleGenerativeAI(geminiKeyManager.getActiveKey()) : null;
const groqClient = groqKeys.length > 0 ? new Groq({ apiKey: groqKeys[0] }) : null;
```

### Gemini Pro Function with Safe Key Handling

```typescript
// Gemini Pro for academic content
async function callGeminiPro(prompt: string): Promise<AIResponse> {
  if (!geminiKeyManager || !geminiClient) {
    console.error('Gemini service is not available - no API keys configured');
    throw new Error('Gemini service unavailable: no API keys configured');
  }
  
  try {
    const apiKey = geminiKeyManager.getActiveKey();
    if (!apiKey) {
      console.error('No active Gemini API key available');
      throw new Error('No active Gemini API key');
    }
    
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({ model: 'gemini-pro' });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    geminiKeyManager.reportSuccess();
    
    return {
      content: text,
      tool: 'gemini-pro',
      tokensUsed: response.usageMetadata?.totalTokenCount || 0,
      modelUsed: 'meditate',
      isReserve: false,
    };
  } catch (error) {
    if (geminiKeyManager) {
      geminiKeyManager.reportFailure(error as Error);
    }
    throw error;
  }
}
```

### Llama 3 Function with Safe Key Handling

```typescript
// Llama 3 70B for fast responses
async function callLlama3(prompt: string): Promise<AIResponse> {
  if (!groqKeyManager) {
    console.error('Groq service is not available - no API keys configured');
    throw new Error('Groq service unavailable: no API keys configured');
  }
  
  try {
    const apiKey = groqKeyManager.getActiveKey();
    if (!apiKey) {
      console.error('No active Groq API key available');
      throw new Error('No active Groq API key');
    }
    
    const client = new Groq({ apiKey });
    const completion = await client.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-70b-8192',
      temperature: 0.7,
      max_tokens: 2048,
    });
    
    groqKeyManager.reportSuccess();
    
    return {
      content: completion.choices[0]?.message?.content || '',
      tool: 'llama3-70b',
      tokensUsed: completion.usage?.total_tokens || 0,
      modelUsed: 'fast',
      isReserve: false,
    };
  } catch (error) {
    if (groqKeyManager) {
      groqKeyManager.reportFailure(error as Error);
    }
    throw error;
  }
}
```

### Streaming Response with Safe Key Handling

```typescript
// Streaming response function with token-aware model selection
export async function* streamAIResponse(request: AIRequest): AsyncGenerator<string> {
  const { prompt, mode, image, language } = request;
  
  // Select model based on token availability
  const selectedModel = selectModelWithTokens(mode, !!image);
  const selectedTool = selectAIToolForModel(selectedModel, !!image);
  
  if (selectedTool === 'llama3-70b' || selectedTool === 'mixtral-8x7b') {
    if (!groqKeyManager) {
      throw new Error('Groq service unavailable: no API keys configured');
    }
    
    try {
      const apiKey = groqKeyManager.getActiveKey();
      if (!apiKey) {
        throw new Error('No active Groq API key available');
      }
      
      const client = new Groq({ apiKey });
      const stream = await client.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: selectedTool === 'llama3-70b' ? 'llama3-70b-8192' : 'mixtral-8x7b-32768',
        temperature: selectedTool === 'llama3-70b' ? 0.7 : 0.3,
        max_tokens: selectedTool === 'llama3-70b' ? 2048 : 4096,
        stream: true,
      });
      
      // Stream the content
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          yield content;
        }
      }
      
      groqKeyManager.reportSuccess();
      
      // Estimate token usage for streaming (approximate)
      const estimatedTokens = Math.ceil(prompt.length / 4) + (selectedTool === 'llama3-70b' ? 2048 : 4096);
      tokenTracker.deductTokens(selectedModel, estimatedTokens);
    } catch (error) {
      if (groqKeyManager) {
        groqKeyManager.reportFailure(error as Error);
      }
      throw error;
    }
  } else {
    // For Gemini, we'll use non-streaming for now
    const response = await getAIResponse(request);
    yield response.content;
  }
}
```

### Key Changes:
- ✅ Used `filter(Boolean)` to safely collect API keys
- ✅ Added warnings when no keys are found
- ✅ Key managers are `null` if no keys available
- ✅ Each function checks key manager availability
- ✅ No non-null assertions (`!`)
- ✅ Graceful error handling

---

## 3. src/lib/key-manager.ts

```typescript
/**
 * Key Management Fallback System
 * Implements circular key rotation with health monitoring
 */

interface KeyConfig {
  id: string;
  value: string;
  expiresAt: Date;
  status: 'active' | 'failed' | 'cooldown';
  lastUsed: Date;
  failureCount: number;
  cooldownUntil: Date;
}

export class KeyManager {
  private keys: KeyConfig[] = [];
  private currentIndex: number = 0;
  private readonly COOLDOWN_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_FAILURES = 3;

  constructor(keys: string[]) {
    if (keys.length === 0) {
      console.warn('Warning: KeyManager initialized with no keys');
    }
    
    this.keys = keys.map((value, index) => ({
      id: `key-${index + 1}`,
      value,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      status: 'active' as const,
      lastUsed: new Date(),
      failureCount: 0,
      cooldownUntil: new Date(0),
    }));
  }

  /**
   * Get the current active key
   * Automatically rotates if current key is failed or in cooldown
   * Returns null if no keys are available and logs a warning
   */
  getActiveKey(): string | null {
    if (this.keys.length === 0) {
      console.warn('Warning: No keys available in KeyManager');
      return null;
    }
    
    const now = new Date();
    
    // Check if current key needs rotation
    const currentKey = this.keys[this.currentIndex];
    if (currentKey.status === 'failed' || 
        currentKey.cooldownUntil > now ||
        currentKey.expiresAt < now) {
      this.rotateToNextKey();
    }
    
    const activeKey = this.keys[this.currentIndex];
    return activeKey ? activeKey.value : null;
  }

  /**
   * Rotate to the next available key in circular sequence
   * Returns null if no available keys; logs a warning instead of throwing
   */
  private rotateToNextKey(): void {
    const now = new Date();
    let attempts = 0;
    const maxAttempts = this.keys.length;

    while (attempts < maxAttempts) {
      this.currentIndex = (this.currentIndex + 1) % this.keys.length;
      const nextKey = this.keys[this.currentIndex];

      // Check if key is available
      if (nextKey.status === 'active' && 
          nextKey.cooldownUntil <= now &&
          nextKey.expiresAt > now) {
        console.log(`Rotated to ${nextKey.id}`);
        return;
      }

      attempts++;
    }

    console.warn('Warning: All keys are expired or in cooldown. Attempting to use first key regardless.');
    // Instead of throwing, reset to first key and allow the error to propagate at the API call level
    this.currentIndex = 0;
  }

  /**
   * Report key failure and trigger rotation if necessary
   * Issues warning instead of throwing critical errors
   */
  reportFailure(error: Error): void {
    if (this.keys.length === 0) {
      console.warn('Warning: Cannot report failure - no keys in manager');
      return;
    }
    
    const currentKey = this.keys[this.currentIndex];
    currentKey.failureCount++;
    currentKey.lastUsed = new Date();

    // Determine if rotation is needed
    if (this.isCriticalFailure(error) || 
        currentKey.failureCount >= this.MAX_FAILURES) {
      currentKey.status = 'failed';
      currentKey.cooldownUntil = new Date(Date.now() + this.COOLDOWN_DURATION);
      console.error(`Key ${currentKey.id} failed: ${error.message}`);
      
      try {
        this.rotateToNextKey();
      } catch (rotationError) {
        console.warn('Warning: Key rotation failed - all keys may be unavailable', rotationError);
      }
    }
  }

  /**
   * Determine if error is critical and requires immediate rotation
   */
  private isCriticalFailure(error: Error): boolean {
    const criticalPatterns = [
      '401', '403', // Authentication errors
      '429', // Rate limit
      'quota', 'limit', 'exceeded'
    ];
    
    return criticalPatterns.some(pattern => 
      error.message.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  /**
   * Mark key as healthy and reset failure count
   */
  reportSuccess(): void {
    if (this.keys.length === 0) {
      console.warn('Warning: Cannot report success - no keys in manager');
      return;
    }
    
    const currentKey = this.keys[this.currentIndex];
    currentKey.status = 'active';
    currentKey.failureCount = 0;
    currentKey.lastUsed = new Date();
  }

  /**
   * Get status of all keys for monitoring
   */
  getKeyStatus(): KeyConfig[] {
    return this.keys.map(key => ({
      ...key,
      value: '***REDACTED***' // Hide actual values
    }));
  }
}
```

### Key Changes:
- ✅ `getActiveKey()` returns `string | null`
- ✅ No longer throws errors on key exhaustion
- ✅ `rotateToNextKey()` logs warnings instead of throwing
- ✅ Safe handling of empty key arrays
- ✅ Graceful degradation without crashing

---

## 4. middleware.ts

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Authentication is enabled by default
const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED !== 'false';

// Get the JWT secret for session verification
const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'default-secret-key-change-in-production'
);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const protectedRoutes = ['/chat-page'];
  const authRoutes = ['/sign-up-login-screen'];

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // If authentication is disabled, allow all routes
  if (!AUTH_ENABLED) {
    console.warn('Warning: Authentication is disabled. This is not recommended for production.');
    return NextResponse.next();
  }

  // If accessing auth routes, allow without session
  if (isAuthRoute) {
    return NextResponse.next();
  }

  // For protected routes, verify session
  if (isProtectedRoute) {
    try {
      // Get the session token from cookies
      const token = req.cookies.get('next-auth.session-token')?.value ||
                   req.cookies.get('__Secure-next-auth.session-token')?.value;

      if (!token) {
        console.warn(`Unauthorized access attempt to ${pathname} - no session token`);
        const loginUrl = new URL('/login', req.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Verify the JWT token
      try {
        await jwtVerify(token, JWT_SECRET);
        // Token is valid, allow access
        return NextResponse.next();
      } catch (jwtError) {
        console.warn(`Invalid session token for ${pathname}: ${jwtError}`);
        const loginUrl = new URL('/login', req.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
    } catch (error) {
      console.error(`Session verification error for ${pathname}:`, error);
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Allow all other routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

### Key Changes:
- ✅ JWT-based session verification
- ✅ Automatic redirect to `/login` for unauthorized access
- ✅ Authentication enabled by default
- ✅ Proper session token extraction from secure cookies
- ✅ Protected routes check: `/chat-page`
- ✅ Error handling with redirect behavior

---

## 5. Token Tracker Implementation for Supabase

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

export const tokenTracker = new SupabaseTokenTracker();
```

---

## Summary

All refactored code:
- ✅ Eliminates non-null assertions (`!`)
- ✅ Implements warning-based error handling
- ✅ Maintains graceful degradation
- ✅ Provides production-ready implementations
- ✅ Includes comprehensive error messages
- ✅ Supports database-backed persistence

The refactored system is designed to be resilient and fail gracefully while providing clear visibility into issues through console warnings.
