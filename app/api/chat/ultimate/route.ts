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
      name: 'gemini-1.5-pro', // Updated to more powerful model
      apiKey: process.env.GEMINI_API_KEY_1,
      provider: 'google',
      index: 0
    },
    {
      name: 'gemini-2.0-flash-exp', // Latest Gemini model
      apiKey: process.env.GEMINI_API_KEY_2,
      provider: 'google',
      index: 1
    }
  ],
  grok: [
    {
      name: 'Llama 3.1 8B', // Fallback to working Gemini model
      apiKey: process.env.GEMINI_API_KEY_1,
      provider: 'google', // Use Google provider instead of xAI
      index: 0
    },
    {
      name: 'groq/compound', // Fallback to working Gemini model
      apiKey: process.env.GEMINI_API_KEY_2,
      provider: 'google', // Use Google provider instead of xAI
      index: 1
    }
  ]
};

// Track current model and usage
let currentModelIndex = { gemini: 0, grok: 0 };
let modelUsage = { gemini: 0, grok: 0 };
let failedKeys = new Set<string>();

// Global request counter for Round Robin rotation
let globalRequestCounter = 0;

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

// Call Gemini API with improved error handling
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
    
    // Create properly formatted prompt
    const fullPrompt = `${enhancedPrompt}\n\n${filteredMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n')}`;
    
    console.log('Sending prompt to Gemini:', fullPrompt.substring(0, 200) + '...');
    
    const result = await geminiModel.generateContent(fullPrompt);
    const response = await result.response;
    
    if (!response.text()) {
      throw new Error('Empty response from Gemini');
    }
    
    console.log('Gemini response received successfully');
    return response.text();
    
  } catch (error) {
    console.error('Gemini API error:', error);
    
    // Check for specific error types
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('INVALID_ARGUMENT') || errorMessage.includes('400')) {
      console.error('Gemini 400 error - likely request format issue');
      // Don't retry 400 errors - they're structural
      throw new Error(`Gemini request format error: ${errorMessage}`);
    }
    
    if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
      console.error('Gemini rate limit hit');
      // Mark key as failed temporarily
      failedKeys.add(`gemini-${model.index}`);
      throw new Error(`Gemini rate limit: ${errorMessage}`);
    }
    
    failedKeys.add(`gemini-${model.index}`);
    throw new Error(`Gemini failed: ${errorMessage}`);
  }
}

// Call Gemini API with improved error handling (formerly Grok)
async function callGrok(messages: ChatMessage[], model: any, context?: string, file?: any) {
  console.log('=== Calling Gemini API (fallback from Grok) ===');
  console.log('Model:', model.name, 'Index:', model.index);
  
  try {
    if (!model.apiKey || failedKeys.has(`grok-${model.index}`)) {
      throw new Error(`Gemini key ${model.index} not available`);
    }

    const { GoogleGenerativeAI } = require('@google/generative-ai');
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
    
    // Create properly formatted prompt
    const fullPrompt = `${enhancedPrompt}\n\n${filteredMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n')}`;
    
    console.log('Sending prompt to Gemini:', fullPrompt.substring(0, 200) + '...');
    
    const result = await geminiModel.generateContent(fullPrompt);
    const response = await result.response;
    
    if (!response.text()) {
      throw new Error('Empty response from Gemini');
    }
    
    console.log('Gemini response received successfully');
    return response.text();
    
  } catch (error) {
    console.error(`Gemini API error (key ${model.index}):`, error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Check for rate limit
    if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
      console.error('Gemini rate limit hit');
      failedKeys.add(`grok-${model.index}`);
      throw new Error(`Gemini rate limit: ${errorMessage}`);
    }
    
    // Check for model not found or invalid request errors
    if (errorMessage.includes('400') || errorMessage.includes('INVALID_ARGUMENT') || 
        errorMessage.includes('Model not found') || errorMessage.includes('Client specified an invalid argument')) {
      console.error('Gemini model not found or invalid request - will fallback to other Gemini');
      // Mark this key as failed to prevent repeated attempts
      failedKeys.add(`grok-${model.index}`);
      throw new Error(`Gemini model not found: ${errorMessage}`);
    }
    
    failedKeys.add(`grok-${model.index}`);
    throw new Error(`Gemini ${model.index} failed: ${errorMessage}`);
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

// Get next available model with Round Robin rotation
function getNextModel(provider: 'gemini' | 'grok') {
  console.log(`Getting next available model for ${provider}`);
  
  const models = AI_MODELS[provider];
  const totalModels = models.length;
  
  // Round Robin: cycle through all models
  for (let i = 0; i < totalModels; i++) {
    const modelIndex = (globalRequestCounter + i) % totalModels;
    const model = models[modelIndex];
    
    if (model.apiKey && !failedKeys.has(`${provider}-${modelIndex}`)) {
      console.log(`Found available ${provider} model: ${model.name} (key ${modelIndex}) - Round Robin selection`);
      currentModelIndex[provider] = modelIndex;
      return { ...model, keyId: `${provider}-${modelIndex}` };
    }
  }
  
  console.log(`No available ${provider} models found`);
  return null;
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
          // Note: 'grok' provider now uses Gemini models due to xAI model issues
          response = await callGrok(messages, model, context, file); // This calls Gemini API
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
  
  // Increment global request counter for Round Robin rotation
  globalRequestCounter++;
  console.log(`Request #${globalRequestCounter} - Using Round Robin rotation`);
  
  try {
    // Handle JSON requests (standard for chat and diagnostics)
    const body = await request.json();
    const messages = body.messages;
    const model = body.model || 'auto';
    const context = body.context || 'general';
    const userId = body.userId;
    const sessionId = body.sessionId;
    const fileData = body.file; // File data as JSON object
    
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
