import { NextRequest, NextResponse } from 'next/server';
import { performIntelligentTask, BotMode } from '@/lib/ai-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { task, context, mode } = body;

    if (!task) {
      return NextResponse.json({ error: 'Missing required field: task' }, { status: 400 });
    }

    const response = await performIntelligentTask(task, context, (mode as BotMode) || 'thoughtful');

    return NextResponse.json({
      content: response.content,
      mode: response.mode,
      codeBlock: response.codeBlock,
      provider: response.provider,
      model: response.model,
    });
  } catch (error) {
    console.error('Assistant API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
