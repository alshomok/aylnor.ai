import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

interface ChatRequest {
  messages: ChatMessage[];
  model?: 'gemini' | 'grok' | 'auto';
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

// Main chat handler with intelligent model switching
async function handleChat(messages: ChatMessage[], preferredModel?: 'gemini' | 'grok' | 'auto') {
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
    const body: ChatRequest = await request.json();
    const { messages, model = 'auto' } = body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }
    
    const result = await handleChat(messages, model);
    
    return NextResponse.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
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
