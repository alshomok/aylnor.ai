import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const server = supabaseServer();
    if (!server) {
      return NextResponse.json({ error: 'Supabase server client not initialized' }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const extractedText = formData.get('extractedText') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!extractedText) {
      return NextResponse.json({ error: 'No extracted text provided' }, { status: 400 });
    }

    // Generate file path with timestamp
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const filePath = `files/${fileName}`;

    // Upload file to Supabase storage
    const { data: uploadData, error: uploadError } = await server
      .storage
      .from('knowledge-base')
      .upload(filePath, file, {
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = server
      .storage
      .from('knowledge-base')
      .getPublicUrl(filePath);

    const fileUrl = urlData.publicUrl;

    // Determine file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    const fileType = fileExtension;

    // Save record to knowledge_base table
    const { data: insertData, error: insertError } = await server
      .from('knowledge_base')
      .insert({
        filename: file.name,
        file_type: fileType,
        file_url: fileUrl,
        extracted_text: extractedText,
        source: 'upload',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      // Try to delete the uploaded file if database insert fails
      await server.storage.from('knowledge-base').remove([filePath]);
      return NextResponse.json({ error: 'Failed to save file record' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      file: insertData,
    });
  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
