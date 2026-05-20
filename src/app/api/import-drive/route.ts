import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Request timeout')), 30000)
  );

  try {
    const server = supabaseServer();
    if (!server) {
      return NextResponse.json({ success: false, error: 'Supabase server client not initialized' }, { status: 500 });
    }

    const body = await Promise.race([request.json(), timeoutPromise]) as { driveUrl: string; extractedText: string; description: string };

    if (!body.driveUrl || !body.extractedText || !body.description) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const { driveUrl, extractedText, description } = body;

    const fileIdMatch = driveUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (!fileIdMatch) {
      return NextResponse.json({ success: false, error: 'Invalid Google Drive URL format' }, { status: 400 });
    }

    const fileId = fileIdMatch[1];
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

    const fetchResult = await Promise.race([fetch(downloadUrl), timeoutPromise]);
    if (fetchResult instanceof Error) {
      return NextResponse.json({ success: false, error: fetchResult.message }, { status: 500 });
    }

    const response = fetchResult as Response;
    if (!response.ok) {
      return NextResponse.json({ success: false, error: 'Failed to download file from Google Drive' }, { status: 500 });
    }

    const blob = await response.blob();
    const fileName = `drive_${fileId}`;
    const filePath = `files/${fileName}`;

    const uploadResult = await Promise.race([
      server.storage.from('knowledge-base').upload(filePath, blob, {
        upsert: true,
        contentType: blob.type || 'application/octet-stream',
      }),
      timeoutPromise
    ]);

    if (uploadResult instanceof Error) {
      console.error('Upload error:', uploadResult);
      return NextResponse.json({ success: false, error: uploadResult.message }, { status: 500 });
    }

    const { data: uploadData, error: uploadError } = uploadResult as { data: any; error: any };

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ success: false, error: 'Failed to upload file to Supabase' }, { status: 500 });
    }

    const { data: urlData } = server.storage.from('knowledge-base').getPublicUrl(filePath);
    const fileUrl = urlData.publicUrl;

    const contentType = blob.type || 'application/octet-stream';
    let fileType = 'unknown';
    if (contentType.includes('pdf')) fileType = 'pdf';
    else if (contentType.includes('word') || contentType.includes('docx')) fileType = 'docx';
    else if (contentType.includes('sheet') || contentType.includes('xlsx')) fileType = 'xlsx';
    else if (contentType.includes('text')) fileType = 'txt';

    const { data: insertData, error: insertError } = await server
      .from('knowledge_base')
      .insert({
        filename: fileName,
        file_type: fileType,
        file_url: fileUrl,
        extracted_text: extractedText,
        description,
        source: 'google_drive',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      await server.storage.from('knowledge-base').remove([filePath]);
      return NextResponse.json({ success: false, error: 'Failed to save file record' }, { status: 500 });
    }

    return NextResponse.json({ success: true, file: insertData });
  } catch (error) {
    console.error('Import Drive API error:', error);
    if (error instanceof Error && error.message === 'Request timeout') {
      return NextResponse.json({ success: false, error: 'Import timeout - connection slow' }, { status: 408 });
    }
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
