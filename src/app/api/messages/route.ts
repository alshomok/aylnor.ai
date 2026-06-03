import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    console.debug('=== Messages API Called ===');
    console.debug('Conversation ID:', conversationId);

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
      console.error('=== Error Fetching Messages ===');
      console.error('Error:', error);
      console.error('Message:', error.message);
      console.error('Details:', error.details);
      console.error('Hint:', error.hint);
      console.error('Code:', error.code);
      return NextResponse.json({ error: 'Failed to fetch messages', details: error.message }, { status: 500 });
    }

    console.debug('=== Messages API Success ===');
    console.debug('Messages count:', messages?.length);
    console.debug('Messages data:', messages);
    
    // Always return messages array, even if empty
    return NextResponse.json({ messages: messages || [] });
  } catch (error) {
    console.error('=== Messages API Exception ===');
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}
