import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import xlsx from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileType = formData.get('fileType') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let extractedText = '';

    switch (fileType) {
      case 'pdf':
        const data = await pdf(buffer);
        extractedText = data.text;
        break;

      case 'docx':
        const docxResult = await mammoth.extractRawText({ buffer });
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
    return NextResponse.json({ error: 'Failed to extract text' }, { status: 500 });
  }
}
