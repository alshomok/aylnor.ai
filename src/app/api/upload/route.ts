import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const extractedText = formData.get('extractedText') as string;
    const description = formData.get('description') as string;

    if (!file) {
      return Response.json({ success: false, error: 'لم يتم إرسال ملف' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Supabase storage
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if bucket exists, create if not
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some((bucket: any) => bucket.name === 'knowledge-base');

    if (!bucketExists) {
      const { error: createBucketError } = await supabase.storage.createBucket('knowledge-base', {
        public: true,
      });
      if (createBucketError) {
        console.error('Failed to create bucket:', createBucketError);
        return Response.json({ success: false, error: 'فشل إنشاء bucket في Supabase' }, { status: 500 });
      }
    }

    const fileName = `${Date.now()}_${file.name}`;
    const { data: storageData, error: storageError } = await supabase.storage
      .from('knowledge-base')
      .upload(`files/${fileName}`, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (storageError) {
      return Response.json({ success: false, error: storageError.message }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('knowledge-base')
      .getPublicUrl(`files/${fileName}`);

    // Extract text from PDF if not provided
    let finalExtractedText = extractedText;
    if (!finalExtractedText) {
      try {
        const pdfParse = await import('pdf-parse');
        // @ts-ignore
        const pdfData = await pdfParse.default(buffer);
        finalExtractedText = pdfData.text;
      } catch (e) {
        finalExtractedText = 'تعذر استخراج النص';
      }
    }

    // Save to database
    const { error: dbError } = await supabase
      .from('knowledge_base')
      .insert({
        filename: file.name,
        file_type: file.type,
        file_url: urlData.publicUrl,
        extracted_text: finalExtractedText,
        description: description || file.name,
        source: 'upload',
      });

    if (dbError) {
      return Response.json({ success: false, error: dbError.message }, { status: 500 });
    }

    return Response.json({ success: true, message: 'تم رفع الملف بنجاح' });
  } catch (error: any) {
    console.error('Upload error:', error);
    return Response.json(
      { success: false, error: error?.message || 'خطأ غير معروف' },
      { status: 500 }
    );
  }
}
