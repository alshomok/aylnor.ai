import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 });
    }

    const { data, error } = await supabase
      .from('knowledge_base')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching files:', error);
      return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
    }

    return NextResponse.json({ files: data });
  } catch (error) {
    console.error('Files API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 });
    }

    const body = await request.json();
    const { filename, file_type, file_url, extracted_text, description, source } = body;

    if (!filename || !file_url || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('knowledge_base')
      .insert({
        filename,
        file_type,
        file_url,
        extracted_text,
        description,
        source: source || 'upload',
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving file:', error);
      return NextResponse.json({ error: 'Failed to save file' }, { status: 500 });
    }

    return NextResponse.json({ file: data });
  } catch (error) {
    console.error('Files API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
