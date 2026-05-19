import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const server = supabaseServer();
    if (!server) {
      return NextResponse.json({ error: 'Supabase server client not initialized' }, { status: 500 });
    }

    const { driveUrl, extractedText } = await request.json();

    if (!driveUrl) {
      return NextResponse.json({ error: 'No Google Drive URL provided' }, { status: 400 });
    }

    if (!extractedText) {
      return NextResponse.json({ error: 'No extracted text provided' }, { status: 400 });
    }

    // Extract file ID from Google Drive URL
    // Format: https://drive.google.com/file/d/{fileId}/view
    const fileIdMatch = driveUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (!fileIdMatch) {
      return NextResponse.json({ error: 'Invalid Google Drive URL format' }, { status: 400 });
    }

    const fileId = fileIdMatch[1];

    // Download file from Google Drive
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    const response = await fetch(downloadUrl);

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to download file from Google Drive' }, { status: 400 });
    }

    const blob = await response.blob();
    const file = new File([blob], `drive_${fileId}`, { type: blob.type });

    // Generate file path with timestamp
    const timestamp = Date.now();
    const fileName = `${timestamp}_drive_${fileId}`;
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

    // Determine file type from content type or default to unknown
    const contentType = blob.type || 'application/octet-stream';
    let fileType = 'unknown';
    if (contentType.includes('pdf')) fileType = 'pdf';
    else if (contentType.includes('word') || contentType.includes('docx')) fileType = 'docx';
    else if (contentType.includes('sheet') || contentType.includes('xlsx')) fileType = 'xlsx';
    else if (contentType.includes('text')) fileType = 'txt';

    // Save record to knowledge_base table
    const { data: insertData, error: insertError } = await server
      .from('knowledge_base')
      .insert({
        filename: `drive_${fileId}`,
        file_type: fileType,
        file_url: fileUrl,
        extracted_text: extractedText,
        source: 'google_drive',
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
    console.error('Google Drive import API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
