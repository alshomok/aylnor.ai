import { NextRequest, NextResponse } from 'next/server';
import { handleTokenPurchase, ModelType } from '@/lib/ai-service';

/**
 * API Route: Purchase tokens for a specific AI model
 * 
 * This endpoint allows purchasing tokens for any of the three AI models:
 * - fast: Llama 3 70B for quick responses
 * - meditate: Gemini Pro for detailed explanations  
 * - code: Mixtral 8x7B for code generation
 * 
 * When tokens are purchased for a model, it becomes operational again
 * and can be used for AI requests. The system automatically transitions
 * to models with available tokens when a model's tokens are exhausted.
 * 
 * Logic Flow:
 * 1. User purchases tokens for "fast" model
 * 2. If "fast" model's token is exhausted, it automatically transitions to "meditate" model
 * 3. If "meditate" model's token is also exhausted, it transitions to "code" model
 * 4. If all models are exhausted, it uses reserve API keys
 * 
 * @route POST /api/tokens/purchase
 * @body { model: ModelType, amount: number }
 * @returns { success: boolean, message: string, newStatus: object }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { model, amount } = body;

    // Validate model type
    const validModels: ModelType[] = ['fast', 'meditate', 'code'];
    if (!validModels.includes(model)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid model. Must be one of: ${validModels.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Validate amount
    if (!amount || amount <= 0 || !Number.isInteger(amount)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid amount. Must be a positive integer.' 
        },
        { status: 400 }
      );
    }

    // Handle token purchase
    handleTokenPurchase(model as ModelType, amount);

    // Get updated token status
    const { getTokenStatus } = await import('@/lib/ai-service');
    const newStatus = getTokenStatus();

    return NextResponse.json({
      success: true,
      message: `Successfully purchased ${amount} tokens for ${model} model`,
      model,
      amount,
      newStatus,
    });

  } catch (error) {
    console.error('Token purchase error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to purchase tokens' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to retrieve current token status for all models
 * 
 * @route GET /api/tokens/purchase
 * @returns { success: boolean, status: object }
 */
export async function GET() {
  try {
    const { getTokenStatus } = await import('@/lib/ai-service');
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
