import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.error('Upload Error Backend: Starting upload process');

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const extractedText = formData.get('extractedText') as string;
    const description = formData.get('description') as string;

    console.error('Upload Error Backend: File received:', file?.name, 'Size:', file?.size);

    if (!file) {
      console.error('Upload Error Backend: No file provided');
      return NextResponse.json({ success: false, error: 'لم يتم إرسال ملف' }, { status: 400 });
    }

    // Check file size (Vercel limit is 4.5MB)
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 4.5) {
      console.error('Upload Error Backend: File too large:', fileSizeMB, 'MB');
      return NextResponse.json({ success: false, error: `حجم الملف كبير جداً (${fileSizeMB.toFixed(2)}MB). الحد الأقصى 4.5MB` }, { status: 400 });
    }

    console.error('Upload Error Backend: Converting file to buffer');
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.error('Upload Error Backend: Initializing Supabase client');
    // Upload to Supabase storage
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.error('Upload Error Backend: Checking bucket existence');
    // Check if bucket exists, create if not
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some((bucket: any) => bucket.name === 'knowledge-base');

    if (!bucketExists) {
      console.error('Upload Error Backend: Creating bucket');
      const { error: createBucketError } = await supabase.storage.createBucket('knowledge-base', {
        public: true,
      });
      if (createBucketError) {
        console.error('Upload Error Backend: Failed to create bucket:', createBucketError);
        return NextResponse.json({ success: false, error: 'فشل إنشاء bucket في Supabase' }, { status: 500 });
      }
    }

    console.error('Upload Error Backend: Uploading to Supabase storage');
    const fileName = `${Date.now()}_${file.name}`;
    const { data: storageData, error: storageError } = await supabase.storage
      .from('knowledge-base')
      .upload(`files/${fileName}`, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (storageError) {
      console.error('Upload Error Backend: Storage upload error:', storageError);
      return NextResponse.json({ success: false, error: storageError.message }, { status: 500 });
    }

    console.error('Upload Error Backend: Getting public URL');
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('knowledge-base')
      .getPublicUrl(`files/${fileName}`);

    console.error('Upload Error Backend: Extracting text from PDF');
    // Extract text from PDF if not provided
    let finalExtractedText = extractedText;
    if (!finalExtractedText) {
      try {
        const pdfParse = await import('pdf-parse');
        // @ts-ignore
        const pdfData = await pdfParse.default(buffer);
        finalExtractedText = pdfData.text;
      } catch (e) {
        console.error('Upload Error Backend: PDF extraction error:', e);
        finalExtractedText = 'تعذر استخراج النص';
      }
    }

    console.error('Upload Error Backend: Saving to database');
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
      console.error('Upload Error Backend: Database insert error:', dbError);
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
    }

    console.error('Upload Error Backend: Upload successful');
    return NextResponse.json({ success: true, message: 'تم رفع الملف بنجاح' });
  } catch (error: any) {
    console.error('Upload Error Backend:', error);
    console.error('Upload Error Backend: Error stack:', error?.stack);
    return NextResponse.json(
      { success: false, error: error?.message || 'خطأ غير معروف' },
      { status: 500 }
    );
  }
}
