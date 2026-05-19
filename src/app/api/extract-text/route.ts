import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import xlsx from 'xlsx';

export async function POST(request: NextRequest) {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Request timeout')), 30000)
  );

  try {
    const formData = await Promise.race([request.formData(), timeoutPromise]) as FormData;
    const file = formData.get('file') as File;
    const fileType = formData.get('fileType') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let extractedText = '';

    switch (fileType) {
      case 'pdf':
        const data = await Promise.race([pdf(buffer), timeoutPromise]);
        extractedText = data.text;
        break;

      case 'docx':
        const docxResult = await Promise.race([mammoth.extractRawText({ buffer }), timeoutPromise]) as { value: string };
        extractedText = docxResult.value;
        break;

      case 'xlsx':
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        let xlsxText = '';
        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          const sheetText = xlsx.utils.sheet_to_txt(worksheet);
          xlsxText += `Sheet: ${sheetName}\n${sheetText}\n\n`;
        });
        extractedText = xlsxText.trim();
        break;

      case 'txt':
        extractedText = buffer.toString('utf-8');
        break;

      default:
        return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    return NextResponse.json({ extractedText });
  } catch (error) {
    console.error('Text extraction error:', error);
    if (error instanceof Error && error.message === 'Request timeout') {
      return NextResponse.json({ error: 'Extraction timeout - file too large' }, { status: 408 });
    }
    return NextResponse.json({ error: 'Failed to extract text' }, { status: 500 });
  }
}
