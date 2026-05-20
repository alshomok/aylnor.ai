import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { groq } from '@ai-sdk/groq';
import { aiKeyRotationService, BotMode } from '@/lib/ai-key-rotation';

export const runtime = 'nodejs';

// System prompt for automation
const AUTOMATION_SYSTEM_PROMPT = `أنت مساعد ذكي يدير قاعدة معرفة شاملة.

## عند رفع ملف:
- استخرج النص من الملف تلقائياً
- تولد وصف ذكي للمحتوى (بحد أقصى 50 كلمة)
- أنشئ كلمات مفتاحية للبحث (5-10 كلمات)
- حدد نوع الملف (شيت، مادة، مرجع، إلخ)

## عند البحث عن ملف:
- افهم نية الطالب
- ابحث عن أفضل ملف متطابق
- رتب النتائج حسب الصلة
- اعرض بطاقة الملف فوراً

## الكلمات المفتاحية للبحث:
- شيت، ملف، pdf، تحميل، أريد، نبي، أعطني، أرجو، لو سمحت، ممكن، هل يوجد

الرد يجب أن يكون JSON فقط بدون أي نص إضافي.`;

interface AutomationRequest {
  action: 'upload' | 'search' | 'describe';
  data: {
    filename?: string;
    extractedText?: string;
    query?: string;
    files?: Array<{
      id: string;
      filename: string;
      description: string;
      extracted_text: string;
    }>;
  };
}

interface AutomationResponse {
  success: boolean;
  result?: {
    description?: string;
    keywords?: string[];
    fileType?: string;
    matchedFile?: {
      id: string;
      filename: string;
      description: string;
      file_url: string;
    };
  };
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 });
    }

    const body: AutomationRequest = await request.json();
    const { action, data } = body;

    const keyConfig = aiKeyRotationService.getNextAvailableKey('thoughtful');

    if (!keyConfig) {
      return NextResponse.json({ error: 'No AI keys available' }, { status: 500 });
    }

    let result: any = {};

    if (action === 'upload') {
      // Generate smart description and keywords
      const prompt = `الملف: ${data.filename}
النص المستخرج: ${data.extractedText?.substring(0, 2000)}...

قوم بـ:
1. توليد وصف ذكي للمحتوى (بحد أقصى 50 كلمة)
2. إنشاء كلمات مفتاحية للبحث (5-10 كلمات مفصولة بفاصلة)
3. تحديد نوع الملف (شيت، مادة، مرجع، إلخ)

الرد بصيغة JSON:
{
  "description": "الوصف",
  "keywords": ["كلمة1", "كلمة2", ...],
  "fileType": "النوع"
}`;

      const response = await generateText({
        model: keyConfig.provider === 'google' ? google(keyConfig.model) : groq(keyConfig.model),
        messages: [
          { role: 'system', content: AUTOMATION_SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
      });

      try {
        result = JSON.parse(response.text);
      } catch {
        result = {
          description: data.filename,
          keywords: [],
          fileType: 'ملف',
        };
      }
    } else if (action === 'search') {
      // Intelligent file search
      const filesList = data.files?.map(f => 
        `- ${f.filename}: ${f.description}`
      ).join('\n') || '';

      const prompt = `قاعدة الملفات المتاحة:
${filesList}

سؤال الطالب: "${data.query}"

ابحث عن أفضل ملف متطابق وأرجع:
{
  "matchedFile": {
    "id": "ملف_المطابق",
    "filename": "اسم_الملف",
    "description": "الوصف",
    "file_url": "الرابط"
  }
}

إذا لم يوجد ملف مطابق، أرجع:
{
  "matchedFile": null
}`;

      const response = await generateText({
        model: keyConfig.provider === 'google' ? google(keyConfig.model) : groq(keyConfig.model),
        messages: [
          { role: 'system', content: AUTOMATION_SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
      });

      try {
        result = JSON.parse(response.text);
      } catch {
        result = { matchedFile: null };
      }
    } else if (action === 'describe') {
      // Generate description only
      const prompt = `الملف: ${data.filename}
النص المستخرج: ${data.extractedText?.substring(0, 1000)}...

توليد وصف ذكي للمحتوى (بحد أقصى 50 كلمة) بصيغة JSON:
{
  "description": "الوصف"
}`;

      const response = await generateText({
        model: keyConfig.provider === 'google' ? google(keyConfig.model) : groq(keyConfig.model),
        messages: [
          { role: 'system', content: AUTOMATION_SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
      });

      try {
        result = JSON.parse(response.text);
      } catch {
        result = { description: data.filename };
      }
    } else {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    const response: AutomationResponse = {
      success: true,
      result,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('AI Orchestration error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
