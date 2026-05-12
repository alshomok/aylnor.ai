import { NextResponse } from 'next/server';

// Test API keys configuration
export async function GET() {
  const keys = {
    gemini_key_1: process.env.GEMINI_API_KEY_1 ? '✅ Configured' : '❌ Missing',
    gemini_key_2: process.env.GEMINI_API_KEY_2 ? '✅ Configured' : '❌ Missing',
    grok_key_1: process.env.GROK_API_KEY_1 ? '✅ Configured' : '❌ Missing',
    grok_key_2: process.env.GROK_API_KEY_2 ? '✅ Configured' : '❌ Missing',
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configured' : '❌ Missing',
    supabase_anon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configured' : '❌ Missing',
  };

  return NextResponse.json({
    status: 'Environment Variables Check',
    keys,
    total_configured: Object.values(keys).filter(k => k.includes('✅')).length,
    total_required: Object.keys(keys).length
  });
}
