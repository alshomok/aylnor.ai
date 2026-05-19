import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Request timeout')), 30000)
  );

  try {
    const server = supabaseServer();
    if (!server) {
      return NextResponse.json({ error: 'Supabase server client not initialized' }, { status: 500 });
    }

    const formData = await Promise.race([
      request.formData(),
      timeoutPromise
    ]) as FormData;

    const file = formData.get('file') as File;
    const extractedText = formData.get('extractedText') as string;
    const description = formData.get('description') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!extractedText) {
      return NextResponse.json({ error: 'No extracted text provided' }, { status: 400 });
    }

    if (!description) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const filePath = `files/${fileName}`;

    const uploadResult = await Promise.race([
      server.storage.from('knowledge-base').upload(filePath, file, { upsert: true }),
      timeoutPromise
    ]);

    if (uploadResult instanceof Error) {
      console.error('Upload error:', uploadResult);
      return NextResponse.json({ error: uploadResult.message }, { status: 500 });
    }

    const { data: uploadData, error: uploadError } = uploadResult as { data: any; error: any };

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    const { data: urlData } = server.storage.from('knowledge-base').getPublicUrl(filePath);
    const fileUrl = urlData.publicUrl;
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    const fileType = fileExtension;

    const { data: insertData, error: insertError } = await server
      .from('knowledge_base')
      .insert({
        filename: file.name,
        file_type: fileType,
        file_url: fileUrl,
        extracted_text: extractedText,
        description,
        source: 'upload',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      await server.storage.from('knowledge-base').remove([filePath]);
      return NextResponse.json({ error: 'Failed to save file record' }, { status: 500 });
    }

    return NextResponse.json({ success: true, file: insertData, filename: file.name });
  } catch (error) {
    console.error('Upload API error:', error);
    if (error instanceof Error && error.message === 'Request timeout') {
      return NextResponse.json({ error: 'Upload timeout - file too large or connection slow' }, { status: 408 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
