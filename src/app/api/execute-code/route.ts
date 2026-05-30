import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { language, code, options = {} } = body;

    console.debug('Code execution request:', { language, codeLength: code?.length });

    if (!language || !code) {
      console.error('Missing language or code');
      return NextResponse.json({ error: 'Missing language or code' }, { status: 400 });
    }

    // Language mapping for Piston API
    const languageMap: Record<string, { language: string; version: string }> = {
      cpp: { language: 'c++', version: '10.2.0' },
      python: { language: 'python', version: '3.10.0' },
      javascript: { language: 'javascript', version: '18.15.0' },
      java: { language: 'java', version: '15.0.2' },
      rust: { language: 'rust', version: '1.68.2' },
      go: { language: 'go', version: '1.20.5' },
      typescript: { language: 'typescript', version: '5.0.3' },
    };

    const langConfig = languageMap[language.toLowerCase()];
    if (!langConfig) {
      console.error('Unsupported language:', language);
      return NextResponse.json({ error: 'Unsupported language' }, { status: 400 });
    }

    console.debug('Language config:', langConfig);

    // Call Piston API
    const requestBody = {
      language: langConfig.language,
      version: langConfig.version,
      files: [
        {
          name: language === 'java' ? 'Main.java' : `main.${language}`,
          content: code,
        },
      ],
      compile_timeout: 10000,
      run_timeout: 5000,
      memory_limit: 128,
    };

    console.debug('Piston API request:', requestBody);

    const pistonResponse = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.debug('Piston API response status:', pistonResponse.status);

    if (!pistonResponse.ok) {
      const errorData = await pistonResponse.text();
      console.error('Piston API error:', pistonResponse.status, errorData);
      return NextResponse.json({ error: 'Failed to execute code', details: errorData }, { status: 500 });
    }

    const result = await pistonResponse.json();
    console.debug('Piston API result:', result);

    return NextResponse.json({
      success: true,
      output: result.run?.output || result.compile?.output || '',
      errors: result.run?.stderr || result.compile?.stderr || '',
      executionTime: result.run?.cpu_time || 0,
      memoryUsage: result.run?.memory || 0,
    });
  } catch (error) {
    console.error('Code execution error:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}
