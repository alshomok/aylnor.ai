import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const server = supabaseServer();
    if (!server) {
      return NextResponse.json({ error: 'Supabase server client not initialized' }, { status: 500 });
    }

    const fileId = params.id;

    // Get file record to extract file path
    const { data: fileRecord, error: fetchError } = await server
      .from('knowledge_base')
      .select('*')
      .eq('id', fileId)
      .single();

    if (fetchError || !fileRecord) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Extract file path from URL
    const urlParts = fileRecord.file_url.split('/files/');
    if (urlParts.length < 2) {
      return NextResponse.json({ error: 'Invalid file URL' }, { status: 400 });
    }
    const filePath = `files/${urlParts[1]}`;

    // Delete file from Supabase storage
    const { error: storageError } = await server
      .storage
      .from('knowledge-base')
      .remove([filePath]);

    if (storageError) {
      console.error('Storage delete error:', storageError);
      return NextResponse.json({ error: 'Failed to delete file from storage' }, { status: 500 });
    }

    // Delete record from knowledge_base table
    const { error: dbError } = await server
      .from('knowledge_base')
      .delete()
      .eq('id', fileId);

    if (dbError) {
      console.error('Database delete error:', dbError);
      return NextResponse.json({ error: 'Failed to delete file record' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete file API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
