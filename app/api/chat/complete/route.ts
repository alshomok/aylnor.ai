import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Complete solution with all features
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

interface CompleteChatRequest {
  messages: ChatMessage[];
  model?: 'gemini' | 'grok' | 'auto';
  context?: 'general' | 'programming' | 'mathematics' | 'science' | 'arabic' | 'english';
  userId?: string;
  sessionId?: string;
}

// Enhanced responses based on context
const getContextualPrompt = (context: string = 'general') => {
  const prompts = {
    general: "أنت مساعد Aylnor.ai الذكي لمعهد الشموخ. تساعد الطلاب في جميع المواد الدراسية. كن واضحاً ومفيداً.",
    programming: "أنت خبير برمجة في Aylnor.ai. ساعد الطلاب في البرمجة، debugging، وشرح المفاهيم التقنية بالعربية.",
    mathematics: "أنت مدرس رياضيات في Aylnor.ai. اشرح المفاهيم الرياضية خطوة بخطوة وحل المسائل بوضوح.",
    science: "أنت مدرس علوم في Aylnor.ai. اشرح المفاهيم العلمية بشكل مبسط وقدم أمثلة عملية.",
    arabic: "أنت مدرس لغة عربية في Aylnor.ai. ساعد الطلاب في النحو، الصرف، والكتابة العربية الصحيحة.",
    english: "أنت مدرس لغة إنجليزية في Aylnor.ai. ساعد الطلاب في تعلم الإنجليزية بشكل فعال."
  };
  
  return prompts[context as keyof typeof prompts] || prompts.general;
};

// Call Gemini API with context
async function callGemini(messages: ChatMessage[], model: any, context?: string) {
  try {
    const genAI = new GoogleGenerativeAI(model.apiKey);
    const geminiModel = genAI.getGenerativeModel({ model: model.name });
    
    // Add contextual system message
    const contextualMessages = [
      { role: 'user', content: getContextualPrompt(context) },
      ...messages.filter(msg => msg.role !== 'system')
    ];
    
    const prompt = contextualMessages.map(msg => msg.content).join('\n\n');
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

// Call Grok API with context
async function callGrok(messages: ChatMessage[], model: any, context?: string) {
  try {
    // Clean messages and add context
    const cleanMessages = [
      { role: 'system', content: getContextualPrompt(context) },
      ...messages.filter(msg => msg.content && msg.content.trim() && msg.role !== 'system')
    ];
    
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${model.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model.name,
        messages: cleanMessages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Grok API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Grok API error:', error);
    throw error;
  }
}

// Get next available model
function getNextModel(provider: 'gemini' | 'grok') {
  const models = AI_MODELS[provider];
  const model = models[currentModelIndex[provider]];
  
  if (!model || !model.apiKey) {
    // Try to find available model
    for (let i = 0; i < models.length; i++) {
      if (models[i].apiKey) {
        currentModelIndex[provider] = i;
        return models[i];
      }
    }
    return null;
  }
  
  return model;
}

// Main handler with intelligent switching
async function handleCompleteChat(
  messages: ChatMessage[], 
  preferredModel?: 'gemini' | 'grok' | 'auto',
  context?: string,
  userId?: string,
  sessionId?: string
) {
  let lastError: Error | null = null;
  
  // Try preferred model first
  const modelsToTry = preferredModel === 'gemini' ? ['gemini', 'grok'] :
                      preferredModel === 'grok' ? ['grok', 'gemini'] :
                      ['gemini', 'grok']; // auto: prefer gemini first
  
  for (const provider of modelsToTry) {
    try {
      const model = getNextModel(provider as 'gemini' | 'grok');
      if (!model) continue;
      
      console.log(`Trying ${provider} model: ${model.name}`);
      
      let response: string;
      if (provider === 'gemini') {
        response = await callGemini(messages, model, context);
      } else {
        response = await callGrok(messages, model, context);
      }
      
      // Update usage
      modelUsage[provider as keyof typeof modelUsage]++;
      
      return {
        response,
        model: model.name,
        provider,
        context,
        usage: modelUsage,
        features: [
          '✅ ذكاء اصطناعي متقدم',
          '✅ دعم عربي كامل', 
          '✅ سياقات متعددة',
          '✅ failover تلقائي',
          '✅ تتبع الاستخدام'
        ]
      };
      
    } catch (error) {
      lastError = error as Error;
      console.error(`${provider} model failed:`, error);
      continue;
    }
  }
  
  throw lastError || new Error('All AI models failed');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, model = 'auto', context = 'general', userId, sessionId } = body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }
    
    console.log('=== Complete Aylnor.ai API ===');
    console.log('Context:', context);
    console.log('Model preference:', model);
    
    const result = await handleCompleteChat(messages, model, context, userId, sessionId);
    
    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Complete Chat API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'Aylnor.ai Complete API',
    version: '2.0.0',
    features: [
      '🤖 Multiple AI Models (Gemini + Grok)',
      '🎯 Context-Aware Responses',
      '🇸🇦 Full Arabic Support',
      '📚 Educational Contexts',
      '🔄 Intelligent Failover',
      '📊 Usage Tracking',
      '🛡️ Error Handling'
    ],
    contexts: ['general', 'programming', 'mathematics', 'science', 'arabic', 'english'],
    models: AI_MODELS,
    status: 'operational'
  });
}
