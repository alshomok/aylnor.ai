import { NextRequest, NextResponse } from 'next/server';

// Strict TypeScript Discriminated Unions for Piston Execution States
type PistonExecutionState =
  | { status: 'idle' }
  | { status: 'compiling'; startTime: number }
  | { status: 'running'; startTime: number }
  | { status: 'stdout'; output: string }
  | { status: 'stderr'; error: string }
  | { status: 'compile_error'; error: string }
  | { status: 'runtime_error'; error: string }
  | { status: 'timeout' }
  | { status: 'completed'; exitCode: number; executionTime: number; memoryUsage: number };

// Strict type for language configuration
interface LanguageConfig {
  language: string;
  version: string;
  fileExtension: string;
}

// Strict type for Piston API request
interface PistonRequest {
  language: string;
  version: string;
  files: Array<{ name: string; content: string }>;
  compile_timeout: number;
  run_timeout: number;
  memory_limit: number;
}

// Strict type for Piston API response
interface PistonResponse {
  run?: {
    stdout: string;
    stderr: string;
    exit_code: number;
    cpu_time: number;
    memory: number;
  };
  compile?: {
    stdout: string;
    stderr: string;
    exit_code: number;
  };
  message?: string;
}

// Strict type for execution result
interface ExecutionResult {
  success: boolean;
  output: string;
  errors: string;
  executionTime: number;
  memoryUsage: number;
  exitCode: number;
}

// Language mapping for Piston API with strict typing
const LANGUAGE_MAP: Record<string, LanguageConfig> = {
  cpp: { language: 'c++', version: '10.2.0', fileExtension: 'cpp' },
  python: { language: 'python', version: '3.10.0', fileExtension: 'py' },
  javascript: { language: 'javascript', version: '18.15.0', fileExtension: 'js' },
  java: { language: 'java', version: '15.0.2', fileExtension: 'java' },
  rust: { language: 'rust', version: '1.68.2', fileExtension: 'rs' },
  go: { language: 'go', version: '1.20.5', fileExtension: 'go' },
  typescript: { language: 'typescript', version: '5.0.3', fileExtension: 'ts' },
  c: { language: 'c', version: '10.2.0', fileExtension: 'c' },
};

export async function POST(request: NextRequest) {
  let currentState: PistonExecutionState = { status: 'idle' };
  
  try {
    const body = await request.json();
    const { language, code, options = {} } = body;

    console.debug('Code execution request:', { language, codeLength: code?.length });

    if (!language || !code) {
      console.error('Missing language or code');
      return NextResponse.json({ 
        success: false,
        error: 'Missing language or code',
        state: currentState 
      }, { status: 400 });
    }

    const langConfig = LANGUAGE_MAP[language.toLowerCase()];
    if (!langConfig) {
      console.error('Unsupported language:', language);
      return NextResponse.json({ 
        success: false,
        error: 'Unsupported language',
        state: currentState 
      }, { status: 400 });
    }

    console.debug('Language config:', langConfig);

    currentState = { status: 'compiling', startTime: Date.now() };

    // Build Piston API request with strict typing
    const pistonRequest: PistonRequest = {
      language: langConfig.language,
      version: langConfig.version,
      files: [
        {
          name: language === 'java' ? 'Main.java' : `main.${langConfig.fileExtension}`,
          content: code,
        },
      ],
      compile_timeout: 10000,
      run_timeout: 5000,
      memory_limit: 128,
    };

    console.debug('Piston API request:', pistonRequest);

    const pistonResponse = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pistonRequest),
    });

    console.debug('Piston API response status:', pistonResponse.status);

    if (!pistonResponse.ok) {
      currentState = { status: 'compile_error', error: `HTTP ${pistonResponse.status}` };
      const errorData = await pistonResponse.text();
      console.error('Piston API error:', pistonResponse.status, errorData);
      return NextResponse.json({ 
        success: false,
        error: 'Failed to execute code',
        details: errorData,
        state: currentState 
      }, { status: 500 });
    }

    currentState = { status: 'running', startTime: Date.now() };

    const result: PistonResponse = await pistonResponse.json();
    console.debug('Piston API result:', result);

    // Strict type checking for execution result
    const executionResult: ExecutionResult = {
      success: true,
      output: result.run?.stdout || result.compile?.stdout || '',
      errors: result.run?.stderr || result.compile?.stderr || '',
      executionTime: result.run?.cpu_time || 0,
      memoryUsage: result.run?.memory || 0,
      exitCode: result.run?.exit_code || result.compile?.exit_code || 0,
    };

    // Determine final state based on result
    if (executionResult.errors) {
      currentState = { 
        status: result.compile ? 'compile_error' : 'runtime_error',
        error: executionResult.errors 
      };
      executionResult.success = false;
    } else {
      currentState = {
        status: 'completed',
        exitCode: executionResult.exitCode,
        executionTime: executionResult.executionTime,
        memoryUsage: executionResult.memoryUsage,
      };
    }

    return NextResponse.json(executionResult);
  } catch (error) {
    console.error('Code execution error:', error);
    currentState = { 
      status: 'runtime_error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: String(error),
      state: currentState 
    }, { status: 500 });
  }
}
