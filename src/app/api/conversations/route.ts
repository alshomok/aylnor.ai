import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseServer } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 });
    }

    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Conversations API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, title, mode } = body;

    if (!userId || !title || !mode) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, title, mode' },
        { status: 400 }
      );
    }

    // Use anon key client (RLS policy allows users to create their own conversations)
    const client = supabase || supabaseServer();
    if (!client) {
      return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 });
    }

    console.debug('Creating conversation with:', { userId, title, mode });

    const { data: conversation, error } = await client
      .from('conversations')
      .insert({
        user_id: userId,
        title,
        mode,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating conversation:', error.message, error);
      return NextResponse.json(
        { error: 'Failed to create conversation', details: error.message },
        { status: 500 }
      );
    }

    console.debug('Conversation created successfully:', conversation);
    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('Conversations API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
