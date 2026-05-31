import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, stdin } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Code is required', isError: true },
        { status: 400 }
      );
    }

    const pistonResponse = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        language: 'cpp',
        version: '10.2.0',
        files: [
          {
            content: code,
          },
        ],
        stdin: stdin || '',
      }),
    });

    if (!pistonResponse.ok) {
      const errorText = await pistonResponse.text();
      console.error('Piston API error:', pistonResponse.status, errorText);
      return NextResponse.json(
        { error: 'Failed to execute code', isError: true, details: errorText },
        { status: 500 }
      );
    }

    const result = await pistonResponse.json();

    if (result.run?.stderr) {
      return NextResponse.json({
        output: result.run.stderr,
        isError: true,
      });
    }

    if (result.compile?.stderr) {
      return NextResponse.json({
        output: result.compile.stderr,
        isError: true,
      });
    }

    return NextResponse.json({
      output: result.run?.output || '',
      isError: false,
    });
  } catch (error) {
    console.error('Code execution error:', error);
    return NextResponse.json(
      { error: 'Internal server error', isError: true, details: String(error) },
      { status: 500 }
    );
  }
}
