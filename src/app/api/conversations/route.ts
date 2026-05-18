import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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
    const { userId, title, mode, userEmail } = body;

    if (!userId || !title || !mode) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, title, mode' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Missing Supabase environment variables' },
        { status: 500 }
      );
    }

    // Create admin client with service role key to bypass RLS
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.debug('Creating conversation with:', { userId, title, mode });

    // Ensure user exists in users table (upsert with service role key to bypass RLS)
    const { error: userError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: userId,
        email: userEmail || 'user@example.com',
        username: userEmail?.split('@')[0] || 'User',
      });

    if (userError) {
      console.error('Error upserting user:', userError.message, userError);
    }

    const { data: conversation, error } = await supabaseAdmin
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
