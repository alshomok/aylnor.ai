import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const HUGGINGFACE_SPACE_ENDPOINT = 'https://a7mdl0u-aylnor-compiler.hf.space';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, language, stdin } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Code is required', isError: true },
        { status: 400 }
      );
    }

    if (!language) {
      return NextResponse.json(
        { error: 'Language is required', isError: true },
        { status: 400 }
      );
    }

    const hfResponse = await fetch(`${HUGGINGFACE_SPACE_ENDPOINT}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        language,
        stdin: stdin || '',
      }),
    });

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text();
      console.error('Hugging Face Space error:', hfResponse.status, errorText);
      return NextResponse.json(
        { error: 'Failed to execute code', isError: true, details: errorText },
        { status: 500 }
      );
    }

    const result = await hfResponse.json();

    if (result.success === true) {
      const output = result.stdout + (result.stderr ? '\n' + result.stderr : '');
      return NextResponse.json({
        output: output || 'تم التنفيذ بنجاح',
        isError: !!result.stderr,
      });
    }

    if (result.success === false) {
      return NextResponse.json({
        output: result.error || 'Execution failed',
        isError: true,
      });
    }

    return NextResponse.json({
      output: 'Unknown response format',
      isError: true,
    });
  } catch (error) {
    console.error('Code execution error:', error);
    return NextResponse.json(
      { error: 'Internal server error', isError: true, details: String(error) },
      { status: 500 }
    );
  }
}
