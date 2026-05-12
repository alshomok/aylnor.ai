import { NextRequest, NextResponse } from 'next/server';

// Test API route that works without API keys
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }
    
    // Simulate AI response for testing
    const testResponse = `مرحباً بك في Aylnor.ai! أنا مساعد الذكاء الاصطناعي الخاص بمعهد الشموخ. 
    
هذه رسالة اختبار للتأكد من أن النظام يعمل بشكل صحيح. 

رسالتك الأخيرة: "${messages[messages.length - 1]?.content}"

يمكنني مساعدتك في:
- البرمجة وتطوير المشاريع
- شرح المفاهيم التقنية
- حل المشاكل البرمجية
- تصميم قواعد البيانات

ما الذي تريد مساعدتك فيه اليوم؟`;

    return NextResponse.json({
      success: true,
      response: testResponse,
      model: 'test-model',
      provider: 'test',
      usage: { test: 1 }
    });
    
  } catch (error) {
    console.error('Test Chat API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'test-mode-operational',
    message: 'Aylnor.ai API is running in test mode',
    models: {
      gemini: ['gemini-1.5-pro', 'gemini-1.5-flash'],
      grok: ['grok-beta']
    }
  });
}
