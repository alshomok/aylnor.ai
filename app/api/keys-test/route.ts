import { NextResponse } from 'next/server';

// Test API keys configuration with Round Robin verification
export async function GET() {
  const keys = {
    gemini_key_1: process.env.GEMINI_API_KEY_1 ? '✅ Configured' : '❌ Missing',
    gemini_key_2: process.env.GEMINI_API_KEY_2 ? '✅ Configured' : '❌ Missing',
    grok_key_1: process.env.GROK_API_KEY_1 ? '✅ Configured' : '❌ Missing',
    grok_key_2: process.env.GROK_API_KEY_2 ? '✅ Configured' : '❌ Missing',
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configured' : '❌ Missing',
    supabase_anon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configured' : '❌ Missing',
  };

  // Round Robin model configuration verification
  const roundRobinConfig = {
    slot_0: {
      model: 'gemini-1.5-pro',
      provider: 'google',
      apiKey: process.env.GEMINI_API_KEY_1 ? '✅ Available' : '❌ Missing',
      keyId: 'gemini-0'
    },
    slot_1: {
      model: 'gemini-2.0-flash-exp',
      provider: 'google', 
      apiKey: process.env.GEMINI_API_KEY_2 ? '✅ Available' : '❌ Missing',
      keyId: 'gemini-1'
    },
    slot_2: {
      model: 'gemini-1.5-flash', // Grok fallback
      provider: 'google',
      apiKey: process.env.GEMINI_API_KEY_1 ? '✅ Available' : '❌ Missing',
      keyId: 'grok-0'
    },
    slot_3: {
      model: 'gemini-1.5-pro', // Grok fallback
      provider: 'google',
      apiKey: process.env.GEMINI_API_KEY_2 ? '✅ Available' : '❌ Missing',
      keyId: 'grok-1'
    }
  };

  const configuredSlots = Object.values(roundRobinConfig).filter(slot => slot.apiKey.includes('✅')).length;
  const rotationStatus = configuredSlots === 4 ? '🔄 Full Rotation Active' : configuredSlots >= 2 ? '⚠️ Partial Rotation' : '❌ Rotation Failed';

  return NextResponse.json({
    status: 'Environment Variables Check',
    keys,
    roundRobin: {
      status: rotationStatus,
      configuredSlots: `${configuredSlots}/4`,
      rotation: '0 → 1 → 2 → 3 → 0 (Round Robin)',
      slots: roundRobinConfig
    },
    total_configured: Object.values(keys).filter(k => k.includes('✅')).length,
    total_required: Object.keys(keys).length,
    rotation_ready: configuredSlots >= 2
  });
}
