import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabase';

// Model configuration
const AI_MODELS = {
  gemini: [
    {
      name: 'gemini-1.5-pro',
      apiKey: process.env.GEMINI_API_KEY_1,
      provider: 'google'
    },
    {
      name: 'gemini-1.5-flash',
      apiKey: process.env.GEMINI_API_KEY_2,
      provider: 'google'
    }
  ],
  grok: [
    {
      name: 'grok-beta',
      apiKey: process.env.GROK_API_KEY_1,
      provider: 'xai'
    },
    {
      name: 'grok-beta',
      apiKey: process.env.GROK_API_KEY_2,
      provider: 'xai'
    }
  ]
};

// Track current model and usage
let currentModelIndex = { gemini: 0, grok: 0 };
let modelUsage = { gemini: 0, grok: 0 };

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface EnhancedChatRequest {
  messages: ChatMessage[];
  model?: 'gemini' | 'grok' | 'auto';
  userId?: string;
  sessionId?: string;
}

// Function to get next available model with failover
function getNextModel(provider: 'gemini' | 'grok') {
  const models = AI_MODELS[provider];
  const currentIndex = currentModelIndex[provider];
  
  // Try current model
  const currentModel = models[currentIndex];
  if (currentModel.apiKey) {
    return currentModel;
  }
  
  // Try other models
  for (let i = 0; i < models.length; i++) {
    if (models[i].apiKey) {
      currentModelIndex[provider] = i;
      return models[i];
    }
  }
  
  throw new Error(`No available ${provider} models`);
}

// Function to call Gemini API
async function callGemini(messages: ChatMessage[], model: any) {
  const genAI = new GoogleGenerativeAI(model.apiKey);
  const geminiModel = genAI.getGenerativeModel({ model: model.name });
  
  // Convert messages to Gemini format
  const history = messages.slice(0, -1).map(msg => ({
    role: msg.role === 'assistant' ? 'model' : msg.role,
    parts: [{ text: msg.content }]
  }));
  
  const userMessage = messages[messages.length - 1].content;
  
  try {
    const chat = geminiModel.startChat({ history });
    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

// Function to call Grok API
async function callGrok(messages: ChatMessage[], model: any) {
  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${model.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model.name,
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Grok API error:', error);
    throw error;
  }
}

// Save message to Supabase
async function saveMessageToDatabase(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string,
  modelUsed?: string,
  provider?: string
) {
  if (!supabase) return;
  
  try {
    const { error } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        role,
        content,
        model_used: modelUsed,
        provider,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Failed to save message:', error);
    }
  } catch (error) {
    console.error('Database error:', error);
  }
}

// Track AI usage
async function trackAIUsage(
  userId: string,
  provider: 'gemini' | 'grok',
  model: string,
  tokensUsed: number
) {
  if (!supabase) return;
  
  try {
    const { error } = await supabase
      .from('ai_usage')
      .insert({
        user_id: userId,
        provider,
        model,
        tokens_used: tokensUsed,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Failed to track usage:', error);
    }
  } catch (error) {
    console.error('Usage tracking error:', error);
  }
}

// Main chat handler with intelligent model switching
async function handleChat(
  messages: ChatMessage[], 
  preferredModel?: 'gemini' | 'grok' | 'auto',
  userId?: string,
  sessionId?: string
) {
  let lastError: Error | null = null;
  
  // Determine which models to try
  const modelsToTry = preferredModel === 'gemini' ? ['gemini', 'grok'] :
                      preferredModel === 'grok' ? ['grok', 'gemini'] :
                      ['gemini', 'grok']; // auto: prefer gemini first
  
  for (const provider of modelsToTry) {
    try {
      const model = getNextModel(provider as 'gemini' | 'grok');
      let response: string;
      
      if (provider === 'gemini') {
        response = await callGemini(messages, model);
      } else {
        response = await callGrok(messages, model);
      }
      
      // Update usage and cycle to next model for load balancing
      modelUsage[provider as 'gemini' | 'grok']++;
      currentModelIndex[provider as 'gemini' | 'grok'] = 
        (currentModelIndex[provider as 'gemini' | 'grok'] + 1) % AI_MODELS[provider as 'gemini' | 'grok'].length;
      
      // Save to database if user and session are provided
      if (sessionId && userId) {
        // Save user message
        await saveMessageToDatabase(
          sessionId,
          'user',
          messages[messages.length - 1].content
        );
        
        // Save assistant response
        await saveMessageToDatabase(
          sessionId,
          'assistant',
          response,
          model.name,
          provider
        );
        
        // Track usage (estimated token count)
        const estimatedTokens = Math.ceil(response.length / 4);
        await trackAIUsage(userId, provider as 'gemini' | 'grok', model.name, estimatedTokens);
      }
      
      return {
        response,
        model: model.name,
        provider,
        usage: modelUsage
      };
      
    } catch (error) {
      lastError = error as Error;
      console.error(`${provider} model failed:`, error);
      
      // Try next model of same provider
      try {
        const nextModel = getNextModel(provider as 'gemini' | 'grok');
        let response: string;
        
        if (provider === 'gemini') {
          response = await callGemini(messages, nextModel);
        } else {
          response = await callGrok(messages, nextModel);
        }
        
        // Save to database if user and session are provided
        if (sessionId && userId) {
          await saveMessageToDatabase(
            sessionId,
            'user',
            messages[messages.length - 1].content
          );
          
          await saveMessageToDatabase(
            sessionId,
            'assistant',
            response,
            nextModel.name,
            provider
          );
          
          const estimatedTokens = Math.ceil(response.length / 4);
          await trackAIUsage(userId, provider as 'gemini' | 'grok', nextModel.name, estimatedTokens);
        }
        
        return {
          response,
          model: nextModel.name,
          provider,
          usage: modelUsage
        };
        
      } catch (fallbackError) {
        console.error(`Fallback ${provider} model failed:`, fallbackError);
        continue; // Try next provider
      }
    }
  }
  
  throw lastError || new Error('All AI models failed');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, model = 'auto', userId, sessionId } = body;
    
    // Check if this is a keys test request
    if (messages && messages[0]?.content === 'test_keys') {
      const keys = {
        gemini_key_1: process.env.GEMINI_API_KEY_1 ? '✅ Configured' : '❌ Missing',
        gemini_key_2: process.env.GEMINI_API_KEY_2 ? '✅ Configured' : '❌ Missing',
        grok_key_1: process.env.GROK_API_KEY_1 ? '✅ Configured' : '❌ Missing',
        grok_key_2: process.env.GROK_API_KEY_2 ? '✅ Configured' : '❌ Missing',
        supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configured' : '❌ Missing',
        supabase_anon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configured' : '❌ Missing',
      };
      
      return NextResponse.json({
        status: 'Environment Variables Check',
        keys,
        total_configured: Object.values(keys).filter(k => k.includes('✅')).length,
        total_required: Object.keys(keys).length
      });
    }
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }
    
    const result = await handleChat(messages, model, userId, sessionId);
    
    return NextResponse.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error('Chat API error:', error);
    
    // Return more specific error messages
    let errorMessage = 'Failed to process chat request';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = 'API keys not configured properly';
        statusCode = 503;
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Network error occurred';
        statusCode = 502;
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout';
        statusCode = 408;
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    );
  }
}

// Get model status and usage
export async function GET() {
  return NextResponse.json({
    models: AI_MODELS,
    currentModelIndex,
    usage: modelUsage,
    status: 'operational'
  });
}
