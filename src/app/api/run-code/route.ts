import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const HUGGINGFACE_SPACE_ENDPOINT = 'https://a7mdl0u-aylnor-compiler.hf.space';

// Strict TypeScript Discriminated Unions for HuggingFace Execution States
type HuggingFaceExecutionState =
  | { status: 'idle' }
  | { status: 'sending'; startTime: number }
  | { status: 'executing'; startTime: number }
  | { status: 'stdout'; output: string }
  | { status: 'stderr'; error: string }
  | { status: 'network_error'; error: string }
  | { status: 'execution_error'; error: string }
  | { status: 'completed'; executionTime: number };

// Strict type for HuggingFace request
interface HuggingFaceRequest {
  code: string;
  language: string;
  stdin: string;
}

// Strict type for HuggingFace response
interface HuggingFaceResponse {
  success: boolean;
  stdout?: string;
  stderr?: string;
  error?: string;
  execution_time?: number;
}

// Strict type for execution result
interface HuggingFaceExecutionResult {
  output: string;
  isError: boolean;
  executionTime?: number;
  state: HuggingFaceExecutionState;
}

export async function POST(request: NextRequest) {
  let currentState: HuggingFaceExecutionState = { status: 'idle' };
  
  try {
    const body = await request.json();
    const { code, language, stdin } = body;

    if (!code) {
      currentState = { status: 'execution_error', error: 'Code is required' };
      return NextResponse.json(
        { error: 'Code is required', isError: true, state: currentState },
        { status: 400 }
      );
    }

    if (!language) {
      currentState = { status: 'execution_error', error: 'Language is required' };
      return NextResponse.json(
        { error: 'Language is required', isError: true, state: currentState },
        { status: 400 }
      );
    }

    currentState = { status: 'sending', startTime: Date.now() };

    const hfRequest: HuggingFaceRequest = {
      code,
      language,
      stdin: stdin || '',
    };

    const hfResponse = await fetch(`${HUGGINGFACE_SPACE_ENDPOINT}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(hfRequest),
    });

    if (!hfResponse.ok) {
      currentState = { status: 'network_error', error: `HTTP ${hfResponse.status}` };
      const errorText = await hfResponse.text();
      console.error('Hugging Face Space error:', hfResponse.status, errorText);
      return NextResponse.json(
        { error: 'Failed to execute code', isError: true, details: errorText, state: currentState },
        { status: 500 }
      );
    }

    currentState = { status: 'executing', startTime: Date.now() };

    const result: HuggingFaceResponse = await hfResponse.json();

    const executionResult: HuggingFaceExecutionResult = {
      output: '',
      isError: false,
      state: currentState,
    };

    if (result.success === true) {
      const output = result.stdout + (result.stderr ? '\n' + result.stderr : '');
      executionResult.output = output || 'تم التنفيذ بنجاح';
      executionResult.isError = !!result.stderr;
      executionResult.executionTime = result.execution_time;
      currentState = {
        status: 'completed',
        executionTime: result.execution_time || 0,
      };
      executionResult.state = currentState;
    } else if (result.success === false) {
      executionResult.output = result.error || 'Execution failed';
      executionResult.isError = true;
      currentState = { status: 'execution_error', error: result.error || 'Execution failed' };
      executionResult.state = currentState;
    } else {
      executionResult.output = 'Unknown response format';
      executionResult.isError = true;
      currentState = { status: 'execution_error', error: 'Unknown response format' };
      executionResult.state = currentState;
    }

    return NextResponse.json(executionResult);
  } catch (error) {
    console.error('Code execution error:', error);
    currentState = { 
      status: 'network_error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    return NextResponse.json(
      { error: 'Internal server error', isError: true, details: String(error), state: currentState },
      { status: 500 }
    );
  }
}
