import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const mode = searchParams.get('mode');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    const server = supabaseServer();
    if (!server) {
      return NextResponse.json({ error: 'Supabase server client not initialized' }, { status: 500 });
    }

    const today = new Date().toISOString().split('T')[0];

    let query = server
      .from('token_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today);

    if (mode) {
      query = query.eq('mode', mode);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching token usage:', error);
      return NextResponse.json({ error: 'Failed to fetch token usage' }, { status: 500 });
    }

    // Calculate total tokens used today
    const totalTokens = data?.reduce((sum, record) => sum + record.tokens_used, 0) || 0;

    return NextResponse.json({
      usage: data || [],
      totalTokens,
      date: today,
    });
  } catch (error) {
    console.error('Token usage API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, mode, tokensUsed } = body;

    if (!userId || !mode || tokensUsed === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, mode, tokensUsed' },
        { status: 400 }
      );
    }

    const server = supabaseServer();
    if (!server) {
      return NextResponse.json({ error: 'Supabase server client not initialized' }, { status: 500 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Check if record exists for today
    const { data: existingRecord } = await server
      .from('token_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('mode', mode)
      .eq('date', today)
      .single();

    let result;

    if (existingRecord) {
      // Update existing record
      const { data, error } = await server
        .from('token_usage')
        .update({ tokens_used: existingRecord.tokens_used + tokensUsed })
        .eq('id', existingRecord.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new record
      const { data, error } = await server
        .from('token_usage')
        .insert({
          user_id: userId,
          mode,
          tokens_used: tokensUsed,
          date: today,
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ success: true, record: result });
  } catch (error) {
    console.error('Token usage API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
