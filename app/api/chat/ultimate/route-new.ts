import { NextRequest, NextResponse } from 'next/server';

// Types for API requests
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  context?: string;
  userId?: string;
  sessionId?: string;
  file?: {
    name: string;
    type: string;
    content?: string;
    size?: number;
  };
}

// Universal request parser - tries JSON first, falls back to FormData
async function parseRequest(request: NextRequest): Promise<ChatRequest> {
  const contentType = request.headers.get('content-type') || '';
  
  try {
    // Try JSON parsing first (most common case)
    if (contentType.includes('application/json')) {
      const body = await request.json();
      return {
        messages: body.messages || [],
        model: body.model || 'auto',
        context: body.context || 'general',
        userId: body.userId,
        sessionId: body.sessionId,
        file: body.file
      };
    }
    
    // Fallback to FormData for file uploads
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const messages = JSON.parse(formData.get('messages') as string);
      const file = formData.get('file') as File;
      
      let fileData = null;
      if (file) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        fileData = {
          name: file.name,
          type: file.type,
          size: file.size,
          content: file.type.startsWith('text/') ? buffer.toString('utf-8') : undefined
        };
      }
      
      return {
        messages: messages || [],
        model: formData.get('model') as string || 'auto',
        context: formData.get('context') as string || 'general',
        userId: formData.get('userId') as string,
        sessionId: formData.get('sessionId') as string,
        file: fileData
      };
    }
    
    throw new Error('Unsupported content type');
    
  } catch (error) {
    console.error('Request parsing failed:', error);
    throw new Error(`Failed to parse request: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Placeholder for Gemini API integration
async function callGemini(messages: ChatMessage[], context?: string, file?: any): Promise<string> {
  console.log('=== Gemini API Call ===');
  
  // TODO: Implement actual Gemini API integration
  // const { GoogleGenerativeAI } = require('@google/generative-ai');
  // const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_1);
  // const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  // const result = await model.generateContent(messages.map(m => m.content).join('\n'));
  // return result.response.text();
  
  // Mock response for testing
  return `Gemini response for context: ${context || 'general'}`;
}

// Placeholder for Grok API integration
async function callGrok(messages: ChatMessage[], context?: string, file?: any): Promise<string> {
  console.log('=== Grok API Call ===');
  
  // TODO: Implement actual Grok API integration
  // const response = await fetch('https://api.x.ai/v1/chat/completions', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${process.env.GROK_API_KEY_1}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     model: 'grok-beta',
  //     messages: messages,
  //     max_tokens: 2000
  //   })
  // });
  // const data = await response.json();
  // return data.choices[0].message.content;
  
  // Mock response for testing
  return `Grok response for context: ${context || 'general'}`;
}

// Main API handler
export async function POST(request: NextRequest) {
  console.log('=== Ultimate Aylnor.ai API Request Started ===');
  
  try {
    // Parse request with universal parser
    const requestData = await parseRequest(request);
    console.log('Request parsed successfully:', {
      messages: requestData.messages.length,
      model: requestData.model,
      context: requestData.context,
      hasFile: !!requestData.file
    });
    
    // Validate messages
    if (!requestData.messages || !Array.isArray(requestData.messages) || requestData.messages.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid messages format',
          details: 'Messages array is required and cannot be empty'
        },
        { status: 400 }
      );
    }
    
    // Filter valid messages
    const validMessages = requestData.messages.filter(msg => 
      msg.content && 
      msg.content.trim() && 
      ['user', 'assistant', 'system'].includes(msg.role)
    );
    
    if (validMessages.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'No valid messages found',
          details: 'All messages must have content and valid role'
        },
        { status: 400 }
      );
    }
    
    // Choose AI provider based on model preference
    let response: string;
    try {
      if (requestData.model?.includes('grok') || Math.random() > 0.5) {
        response = await callGrok(validMessages, requestData.context, requestData.file);
      } else {
        response = await callGemini(validMessages, requestData.context, requestData.file);
      }
    } catch (aiError) {
      console.error('AI provider failed:', aiError);
      
      // Try fallback provider
      try {
        if (requestData.model?.includes('grok')) {
          response = await callGemini(validMessages, requestData.context, requestData.file);
        } else {
          response = await callGrok(validMessages, requestData.context, requestData.file);
        }
      } catch (fallbackError) {
        console.error('Fallback provider also failed:', fallbackError);
        return NextResponse.json(
          { 
            success: false,
            error: 'All AI providers failed',
            details: aiError instanceof Error ? aiError.message : 'Unknown AI error'
          },
          { status: 500 }
        );
      }
    }
    
    // Return successful response
    return NextResponse.json({
      success: true,
      response: response,
      model: requestData.model || 'auto',
      provider: 'ultimate',
      context: requestData.context,
      usage: {
        messages: validMessages.length,
        hasFile: !!requestData.file,
        timestamp: new Date().toISOString()
      },
      features: [
        '🤖 ذكاء اصطناعي متقدم',
        '🔄 Failover ذكي',
        '📁 معالجة الملفات',
        '🇸🇦 دعم عربي كامل'
      ]
    });
    
  } catch (error) {
    console.error('API request failed:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'API request failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'Aylnor.ai Ultimate API',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      chat: 'POST /api/chat/ultimate',
      health: 'GET /api/chat/ultimate'
    }
  });
}
