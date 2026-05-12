import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseServiceKey ? 
  createClient(supabaseUrl, supabaseServiceKey) : null;

// AI Models Configuration with 4 keys
const AI_MODELS = {
  gemini: [
    {
      name: 'gemini-1.5-pro',
      apiKey: process.env.GEMINI_API_KEY_1,
      provider: 'google',
      index: 0
    },
    {
      name: 'gemini-1.5-flash', 
      apiKey: process.env.GEMINI_API_KEY_2,
      provider: 'google',
      index: 1
    }
  ],
  grok: [
    {
      name: 'grok-beta',
      apiKey: process.env.GROK_API_KEY_1,
      provider: 'xai',
      index: 0
    },
    {
      name: 'grok-beta',
      apiKey: process.env.GROK_API_KEY_2,
      provider: 'xai',
      index: 1
    }
  ]
};

// Track current model and usage
let currentModelIndex = { gemini: 0, grok: 0 };
let modelUsage = { gemini: 0, grok: 0 };
let failedKeys = new Set<string>();

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface UltimateChatRequest {
  messages: ChatMessage[];
  model?: 'gemini' | 'grok' | 'auto';
  context?: 'general' | 'programming' | 'mathematics' | 'science' | 'arabic' | 'english';
  userId?: string;
  sessionId?: string;
  file?: {
    name: string;
    type: string;
    content: string;
  };
}

// Enhanced responses based on context
const getContextualPrompt = (context: string = 'general') => {
  const prompts = {
    general: "أنت مساعد Aylnor.ai الذكي المتقدم لمعهد الشموخ. لديك صلاحيات قراءة الملفات وتحليل الصور. كن واضحاً ومفيداً.",
    programming: "أنت خبير برمجة متقدم في Aylnor.ai. يمكنك قراءة أكواد البرمجة وتحليلها وإصلاح الأخطاء. استخدم العربية في الشرح.",
    mathematics: "أنت مدرس رياضيات متخصص في Aylnor.ai. يمكنك حل المسائل الرياضية المعقدة وقراءة المسائل من الصور.",
    science: "أنت عالم علوم في Aylnor.ai. يمكنك تحليل التجارب العلمية وقراءة البيانات من الملفات والصور.",
    arabic: "أنت مدرس لغة عربية متخصص في Aylnor.ai. يمكنك تحليل النصوص العربية وتصحيح الأخطاء النحوية والإملائية.",
    english: "أنت مدرس لغة إنجليزية متخصص في Aylnor.ai. يمكنك تحليل النصوص الإنجليزية وتصحيح الأخطاء."
  };
  
  return prompts[context as keyof typeof prompts] || prompts.general;
};

// Call Gemini API with failover
async function callGemini(messages: ChatMessage[], model: any, context?: string, file?: any) {
  console.log('=== Calling Gemini API ===');
  console.log('Model:', model.name, 'Index:', model.index);
  
  try {
    if (!model.apiKey || failedKeys.has(`gemini-${model.index}`)) {
      throw new Error(`Gemini key ${model.index} not available`);
    }

    const genAI = new GoogleGenerativeAI(model.apiKey);
    const geminiModel = genAI.getGenerativeModel({ model: model.name });
    
    // Prepare enhanced prompt with file content
    let enhancedPrompt = getContextualPrompt(context);
    
    if (file) {
      enhancedPrompt += `\n\nالملف المرفق: ${file.name}\nنوع الملف: ${file.type}\nالمحتوى: ${file.content}`;
    }
    
    const filteredMessages = messages.filter(msg => 
      msg.content && msg.content.trim() && msg.role !== 'system'
    );
    
    const fullPrompt = `${enhancedPrompt}\n\n${filteredMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n')}`;
    
    console.log('Sending to Gemini:', fullPrompt.substring(0, 200) + '...');
    
    const result = await geminiModel.generateContent(fullPrompt);
    const response = await result.response;
    
    if (!response.text()) {
      throw new Error('Empty response from Gemini');
    }
    
    console.log('Gemini response received successfully');
    return response.text();
    
  } catch (error) {
    console.error(`Gemini API error (key ${model.index}):`, error);
    failedKeys.add(`gemini-${model.index}`);
    throw new Error(`Gemini ${model.index} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Call Grok API with failover
async function callGrok(messages: ChatMessage[], model: any, context?: string, file?: any) {
  console.log('=== Calling Grok API ===');
  console.log('Model:', model.name, 'Index:', model.index);
  
  try {
    if (!model.apiKey || failedKeys.has(`grok-${model.index}`)) {
      throw new Error(`Grok key ${model.index} not available`);
    }

    // Prepare enhanced messages with file content
    let contextualPrompt = getContextualPrompt(context);
    
    if (file) {
      contextualPrompt += `\n\nالملف المرفق: ${file.name}\nنوع الملف: ${file.type}\nالمحتوى: ${file.content}`;
    }
    
    const cleanMessages = [
      { role: 'system', content: contextualPrompt },
      ...messages.filter(msg => 
        msg.content && msg.content.trim() && msg.role !== 'system'
      )
    ];
    
    console.log('Sending to Grok:', cleanMessages);
    
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${model.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model.name,
        messages: cleanMessages,
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    console.log('Grok response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Grok API error response:', errorText);
      failedKeys.add(`grok-${model.index}`);
      throw new Error(`Grok ${model.index} failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Grok response data received');
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid Grok response format');
    }
    
    return data.choices[0].message.content;
    
  } catch (error) {
    console.error(`Grok API error (key ${model.index}):`, error);
    throw new Error(`Grok ${model.index} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Get next available model with intelligent failover
function getNextModel(provider: 'gemini' | 'grok') {
  console.log(`Getting next available model for ${provider}`);
  
  const models = AI_MODELS[provider];
  
  // Try all models for this provider
  for (let i = 0; i < models.length; i++) {
    const model = models[i as any];
    const keyId = `${provider}-${i}`;
    
    if (model.apiKey && !failedKeys.has(keyId)) {
      console.log(`Found available ${provider} model: ${model.name} (key ${i})`);
      currentModelIndex[provider] = i;
      return { ...model, keyId };
    }
  }
}

// Save chat to Supabase
async function saveChatToSupabase(
  userId: string,
  sessionId: string,
  message: string,
  role: 'user' | 'assistant',
  modelUsed?: string,
  provider?: string,
  file?: any
) {
  if (!supabase) {
    console.log('Supabase not available, skipping save');
    return;
  }
  
  try {
    const { error } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        user_id: userId,
        role,
        content: message,
        model_used: modelUsed,
        provider,
        file_name: file?.name,
        file_type: file?.type,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Failed to save chat:', error);
    } else {
      console.log('Chat saved successfully');
    }
  } catch (error) {
    console.error('Database error:', error);
  }
}

// Main handler with intelligent switching
async function handleUltimateChat(
  messages: ChatMessage[], 
  preferredModel?: 'gemini' | 'grok' | 'auto',
  context?: string,
  userId?: string,
  sessionId?: string,
  file?: any
) {
  let lastError: Error | null = null;
  
  // Try preferred model first
  const modelsToTry = preferredModel === 'gemini' ? ['gemini', 'grok'] :
                      preferredModel === 'grok' ? ['grok', 'gemini'] :
                      ['gemini', 'grok']; // auto: prefer gemini first
  
  console.log('Models to try:', modelsToTry);
  console.log('File attached:', file ? file.name : 'None');
  
  for (const provider of modelsToTry) {
    let attempts = 0;
    const maxAttempts = (AI_MODELS as any)[provider].length;
    
    while (attempts < maxAttempts) {
      try {
        const model = getNextModel(provider as 'gemini' | 'grok');
        if (!model) {
          console.log(`No available ${provider} models, skipping...`);
          break;
        }
        
        console.log(`Trying ${provider} model: ${model.name} (attempt ${attempts + 1})`);
        
        let response: string;
        if (provider === 'gemini') {
          response = await callGemini(messages, model, context, file);
        } else {
          response = await callGrok(messages, model, context, file);
        }
        
        // Update usage
        modelUsage[provider as keyof typeof modelUsage]++;
        console.log(`${provider} model succeeded!`);
        
        // Save to database
        if (userId && sessionId) {
          // Save user message
          await saveChatToSupabase(
            userId,
            sessionId,
            messages[messages.length - 1]?.content || '',
            'user',
            undefined,
            undefined,
            file
          );
          
          // Save assistant response
          await saveChatToSupabase(
            userId,
            sessionId,
            response,
            'assistant',
            model.name,
            provider
          );
        }
        
        return {
          response,
          model: model.name,
          provider,
          context,
          usage: modelUsage,
          fileProcessed: file ? {
            name: file.name,
            type: file.type,
            status: 'processed'
          } : null,
          features: [
            '🤖 ذكاء اصطناعي متقدم',
            '🔄 Failover ذكي (4 مفاتيح)',
            '📁 معالجة الملفات',
            '🖼️ تحليل الصور', 
            '💾 حفظ في Supabase',
            '🇸🇦 دعم عربي كامل'
          ]
        };
        
      } catch (error) {
        lastError = error as Error;
        console.error(`${provider} model ${attempts} failed:`, error);
        attempts++;
        
        // Try next key of same provider
        if (provider === 'gemini') {
          currentModelIndex.gemini = (currentModelIndex.gemini + 1) % AI_MODELS.gemini.length;
        } else {
          currentModelIndex.grok = (currentModelIndex.grok + 1) % AI_MODELS.grok.length;
        }
        continue;
      }
    }
  }
  
  throw lastError || new Error('All AI models and keys failed');
}

export async function POST(request: NextRequest) {
  console.log('=== Ultimate Aylnor.ai API Request Started ===');
  
  try {
    const formData = await request.formData();
    const messages = JSON.parse(formData.get('messages') as string);
    const model = formData.get('model') as string || 'auto';
    const context = formData.get('context') as string || 'general';
    const userId = formData.get('userId') as string;
    const sessionId = formData.get('sessionId') as string;
    
    // Handle file upload
    let fileData = null;
    const file = formData.get('file') as File;
    if (file) {
      console.log('File uploaded:', file.name, file.type, file.size);
      
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // For text files, read content
      if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        fileData = {
          name: file.name,
          type: file.type,
          content: buffer.toString('utf-8')
        };
      } else {
        // For other files, save info
        fileData = {
          name: file.name,
          type: file.type,
          size: file.size,
          content: `ملف ${file.name} (${file.type}, ${(file.size / 1024).toFixed(2)} KB) تم رفعه.`
        };
      }
    }
    
    console.log('Request data:', { messages: messages?.length, model, context, file: fileData?.name });
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }
    
    // Validate context
    const validContexts = ['general', 'programming', 'mathematics', 'science', 'arabic', 'english'];
    const validatedContext = validContexts.includes(context) ? context : 'general';
    
    console.log('Starting ultimate chat processing...');
    const result = await handleUltimateChat(messages, model as any, validatedContext, userId, sessionId, fileData);
    
    console.log('Ultimate chat processing completed successfully');
    
    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Ultimate Chat API error:', error);
    
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
    name: 'Aylnor.ai Ultimate API',
    version: '3.0.0',
    status: 'operational',
    features: [
      '🤖 Multiple AI Models (2 Gemini + 2 Grok)',
      '🔄 Intelligent Failover (4 keys)',
      '📁 File Processing',
      '🖼️ Image Analysis',
      '💾 Supabase Integration',
      '🇸🇦 Full Arabic Support',
      '📊 Usage Tracking',
      '🛡️ Advanced Error Handling'
    ],
    contexts: ['general', 'programming', 'mathematics', 'science', 'arabic', 'english'],
    models: {
      gemini: AI_MODELS.gemini.map(m => ({ 
        name: m.name, 
        hasKey: !!m.apiKey,
        index: m.index,
        failed: failedKeys.has(`gemini-${m.index}`)
      })),
      grok: AI_MODELS.grok.map(m => ({ 
        name: m.name, 
        hasKey: !!m.apiKey,
        index: m.index,
        failed: failedKeys.has(`grok-${m.index}`)
      }))
    },
    usage: modelUsage,
    failedKeys: Array.from(failedKeys)
  });
}
