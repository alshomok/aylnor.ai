import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== Simple Chat API Started ===');
    
    const body = await request.json();
    console.log('Request received:', body);
    
    const { messages } = body;
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }
    
    const userMessage = messages[messages.length - 1]?.content || '';
    console.log('User message:', userMessage);
    
    // Simple response without API keys
    const responses = [
      'أهلاً بك في Aylnor.ai! أنا مساعدك الذكي لمعهد الشموخ. كيف يمكنني مساعدتك اليوم؟',
      'مرحباً! أنا هنا لمساعدتك في البرمجة والتعلم. اسألني أي شيء!',
      'أهلاً بك! أنا مساعد Aylnor.ai الذكي. جاهز لمساعدتك في جميع المواد التقنية.',
      'مرحباً بك في Aylnor.ai! أنا متخصص في مساعدة الطلاب في البرمجة وتطوير المشاريع.'
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    const result = {
      success: true,
      response: randomResponse,
      model: 'simple-test',
      provider: 'test',
      usage: { test: 1 },
      timestamp: new Date().toISOString()
    };
    
    console.log('Sending response:', result);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Simple Chat API error:', error);
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
    status: 'Simple Chat API - Working',
    message: 'This endpoint works without API keys',
    version: '1.0.0'
  });
}
