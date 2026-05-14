import { NextResponse } from 'next/server';
import { getTokenStatus } from '@/lib/ai-service';

/**
 * API Route: Get current token status for all AI models
 * 
 * This endpoint returns the current token availability for all three models:
 * - fast: Llama 3 70B token status
 * - meditate: Gemini Pro token status
 * - code: Mixtral 8x7B token status
 * 
 * @route GET /api/tokens/status
 * @returns { success: boolean, status: object }
 */
export async function GET() {
  try {
    const status = getTokenStatus();

    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error) {
    console.error('Token status error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve token status' 
      },
      { status: 500 }
    );
  }
}
