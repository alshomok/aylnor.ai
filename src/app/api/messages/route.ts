import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    console.debug('Messages API called with conversationId:', conversationId);

    if (!conversationId) {
      console.error('Missing conversationId parameter');
      return NextResponse.json({ error: 'Missing conversationId parameter' }, { status: 400 });
    }

    if (!supabase) {
      console.error('Supabase client not initialized');
      return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 });
    }

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    console.debug('Messages API returning messages:', messages?.length);
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Messages API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
