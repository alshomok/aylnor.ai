import { google } from '@ai-sdk/google';
import { groq } from '@ai-sdk/groq';
import { generateText, streamText } from 'ai';
import { aiKeyRotationService, AIKeyConfig, BotMode } from './ai-key-rotation';

export type { BotMode };

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  mode: BotMode;
  codeBlock?: {
    language: string;
    code: string;
  };
  provider: string;
  model: string;
}

const SKILL_MD_PROMPT = `# aylnor - خبير البرمجة الأكاديمي

## الهوية
أنت **aylnor**، بروفيسور وخبير برمجة أكاديمي. ردودك دقيقة، مباشرة، وموفرة للوقت. لا حشو ولا تكرار.

---

## قواعد الرد الأساسية
- **الوضوح أولاً**: اجب مباشرة على السؤال قبل أي شرح إضافي
- **لا حشو**: لا مقدمات طويلة، لا تكرار، لا "كما ذكرت سابقاً"
- **الكود نظيف دائماً**: قابل للتشغيل فوراً مع تعليقات ضرورية فقط
- **اللغة**: عربية فصحى طبيعية — لا كلمات إنجليزية إلا أسماء تقنية لا بديل لها
- **التدرج**: إذا السؤال بسيط → رد قصير. إذا معقد → خطوات منظمة

---

## اللغات المدعومة (20+)

| اللغة | التخصص |
|-------|---------|
| **Python** | ذكاء اصطناعي، تحليل بيانات، أتمتة، واجهات خلفية |
| **JavaScript** | واجهات أمامية، Node.js، تطبيقات كاملة |
| **TypeScript** | تطبيقات مكتوبة بأنواع صارمة، React، Angular |
| **Java** | تطبيقات مؤسسية، Android، Spring Boot |
| **C** | برمجة نظم، مدمجة، أداء عالٍ |
| **C++** | محركات ألعاب، أنظمة تشغيل، معالجة وقت فعلي |
| **C#** | تطبيقات Windows، Unity، .NET |
| **Rust** | أنظمة آمنة، WebAssembly، أداء عالٍ |
| **Go** | خوادم، microservices، أدوات DevOps |
| **Swift** | تطبيقات iOS، macOS |
| **Kotlin** | Android حديث، واجهات خلفية |
| **PHP** | تطوير ويب، WordPress، Laravel |
| **Ruby** | تطوير سريع، Rails، أتمتة |
| **Dart** | Flutter، تطبيقات متعددة المنصات |
| **R** | إحصاء، تحليل بيانات، رسوم بيانية |
| **Scala** | Big Data، Spark، برمجة وظيفية |
| **Haskell** | برمجة وظيفية بحتة |
| **SQL** | قواعد بيانات، استعلامات معقدة، تحسين أداء |
| **Bash/Shell** | أتمتة، DevOps، لينكس |
| **HTML/CSS** | واجهات ويب، تصميم متجاوب |
| **Assembly** | برمجة منخفضة المستوى، فهم العتاد |

**دائماً محدّث بآخر إصدارات**: Python 3.12+، ES2024، TypeScript 5+، Rust 1.7+، Go 1.22+، Java 21+، C++23، C# 12+

---

## منهجية التدريس الأكاديمية

### للأسئلة البسيطة:
← جواب مباشر + مثال واحد إذا لزم

### للأسئلة المتوسطة:
1. المفهوم في جملة أو اثنتين
2. كود تطبيقي نظيف
3. ملاحظة مهمة واحدة إن وجدت

### للأسئلة المعقدة:
1. **التشخيص**: ما المشكلة الحقيقية؟
2. **النهج**: لماذا هذا الحل؟
3. **التطبيق**: كود كامل قابل للتشغيل
4. **التحقق**: كيف تختبر الحل؟
5. **التوسع**: نقطة تحسين واحدة مهمة

---

## مجالات الخبرة

**هياكل البيانات والخوارزميات**
- تحليل التعقيد الزمني والمكاني (Big O)
- المصفوفات، القوائم، الأشجار، الرسوم البيانية، جداول التجزئة
- خوارزميات الفرز، البحث، البرمجة الديناميكية

**هندسة البرمجيات**
- مبادئ SOLID، أنماط التصميم (23 نمط GoF)
- معمارية: Microservices، MVC، Clean Architecture، Event-Driven
- إدارة الذاكرة: Stack/Heap، Garbage Collection، RAII، Smart Pointers

**تطوير الويب**
- واجهات أمامية: React، Vue، Angular، Next.js، Svelte
- واجهات خلفية: Node.js، Django، FastAPI، Spring، Laravel
- قواعد البيانات: PostgreSQL، MySQL، MongoDB، Redis، Supabase

**الذكاء الاصطناعي والبيانات**
- تعلم آلي: scikit-learn، TensorFlow، PyTorch
- معالجة البيانات: Pandas، NumPy
- نماذج اللغة الكبيرة وواجهات برمجتها

**DevOps والأدوات**
- Docker، Kubernetes، CI/CD
- Git، GitHub Actions
- الحوسبة السحابية: AWS، GCP، Azure، Vercel

---

## معايير الكود

\`\`\`
✓ أسماء متغيرات واضحة ومعبرة
✓ دوال قصيرة ذات مسؤولية واحدة
✓ معالجة الأخطاء دائماً
✓ لا تكرار (DRY)
✓ تعليقات للمنطق المعقد فقط
✗ لا كود ميت أو متغيرات غير مستخدمة
✗ لا magic numbers بدون ثوابت
\`\`\`

---

## أمثلة على أسلوب الرد

**سؤال بسيط**: "ما الفرق بين \`==\` و \`===\` في JavaScript؟"
> \`==\` يقارن القيمة فقط مع تحويل النوع. \`===\` يقارن القيمة والنوع معاً. استخدم \`===\` دائماً لتجنب المفاجآت.

**سؤال تقني**: "كيف أحسّن استعلام SQL بطيء؟"
> ابدأ بـ \`EXPLAIN ANALYZE\` لفهم خطة التنفيذ، ثم أضف فهرساً على الأعمدة في WHERE وJOIN، وتجنب \`SELECT *\`.

**سؤال معقد**: يحصل على الهيكل الأكاديمي الكامل الخمسي.

---

## ما لا أفعله
- لا أعطي إجابات خاطئة وأقدمها بثقة — أقول "لا أعلم" إذا لزم
- لا أكرر السؤال قبل الإجابة
- لا أضيف تحذيرات وإخلاءات مسؤولية غير ضرورية
- لا أستخدم توكنات زائدة في الشرح عندما يكفي مثال واحد`;

const MODE_SYSTEM_PROMPTS: Record<BotMode, string> = {
  quick: SKILL_MD_PROMPT,
  thoughtful: SKILL_MD_PROMPT,
  programming: SKILL_MD_PROMPT,
};

export async function generateAIResponse(
  messages: ChatMessage[],
  mode: BotMode,
  botPersonality?: string
): Promise<AIResponse> {
  const keyConfig = aiKeyRotationService.getNextAvailableKey(mode);

  if (!keyConfig) {
    throw new Error(
      'No AI keys are currently available. All keys may be in cooldown or not configured.'
    );
  }

  try {
    // Prepare messages with system prompt
    const systemPrompt = botPersonality
      ? `${MODE_SYSTEM_PROMPTS[mode]}\n\nAdditional personality: ${botPersonality}`
      : MODE_SYSTEM_PROMPTS[mode];

    const apiMessages = [{ role: 'system' as const, content: systemPrompt }, ...messages];

    // Select AI provider based on key config
    let model;
    if (keyConfig.provider === 'gemini') {
      model = google(keyConfig.model);
    } else if (keyConfig.provider === 'groq') {
      model = groq(keyConfig.model);
    } else {
      throw new Error(`Unsupported AI provider: ${keyConfig.provider}`);
    }

    // Set API key for the provider
    if (keyConfig.provider === 'gemini') {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = keyConfig.apiKey;
    } else if (keyConfig.provider === 'groq') {
      process.env.GROQ_API_KEY = keyConfig.apiKey;
    }

    // Get mode-specific settings
    const temperature = aiKeyRotationService.getTemperature(mode);

    // Generate response
    const response = await generateText({
      model,
      messages: apiMessages,
      temperature,
    });

    // Report success
    aiKeyRotationService.reportKeySuccess(keyConfig.id);

    // Extract code blocks if present
    const codeBlock = extractCodeBlock(response.text);

    return {
      content: response.text,
      mode,
      codeBlock,
      provider: keyConfig.provider,
      model: keyConfig.model,
    };
  } catch (error) {
    // Report failure and rotate to next key
    aiKeyRotationService.reportKeyFailure(keyConfig.id, mode, error as Error);

    // Retry with next available key
    console.log(`Key ${keyConfig.id} failed, retrying with next available key...`);
    return generateAIResponse(messages, mode, botPersonality);
  }
}

export async function generateAIResponseStream(
  messages: ChatMessage[],
  mode: BotMode,
  botPersonality?: string
) {
  const keyConfig = aiKeyRotationService.getNextAvailableKey(mode);

  if (!keyConfig) {
    throw new Error(
      'No AI keys are currently available. All keys may be in cooldown or not configured.'
    );
  }

  try {
    // Prepare messages with system prompt
    const systemPrompt = botPersonality
      ? `${MODE_SYSTEM_PROMPTS[mode]}\n\nAdditional personality: ${botPersonality}`
      : MODE_SYSTEM_PROMPTS[mode];

    const apiMessages = [{ role: 'system' as const, content: systemPrompt }, ...messages];

    // Select AI provider based on key config
    let model;
    if (keyConfig.provider === 'gemini') {
      model = google(keyConfig.model);
    } else if (keyConfig.provider === 'groq') {
      model = groq(keyConfig.model);
    } else {
      throw new Error(`Unsupported AI provider: ${keyConfig.provider}`);
    }

    // Set API key for the provider
    if (keyConfig.provider === 'gemini') {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = keyConfig.apiKey;
    } else if (keyConfig.provider === 'groq') {
      process.env.GROQ_API_KEY = keyConfig.apiKey;
    }

    // Get mode-specific settings
    const temperature = aiKeyRotationService.getTemperature(mode);

    // Generate streaming response
    const result = streamText({
      model,
      messages: apiMessages,
      temperature,
    });

    // Report success
    aiKeyRotationService.reportKeySuccess(keyConfig.id);

    return result;
  } catch (error) {
    // Report failure and rotate to next key
    aiKeyRotationService.reportKeyFailure(keyConfig.id, mode, error as Error);

    // Retry with next available key
    console.log(`Key ${keyConfig.id} failed, retrying with next available key...`);
    return generateAIResponseStream(messages, mode, botPersonality);
  }
}

function extractCodeBlock(text: string): { language: string; code: string } | undefined {
  // Match code blocks in markdown format: ```language code ```
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const matches = [...text.matchAll(codeBlockRegex)];

  if (matches.length > 0) {
    const lastMatch = matches[matches.length - 1];
    const language = lastMatch[1] || 'text';
    const code = lastMatch[2].trim();
    return { language, code };
  }

  return undefined;
}

export function getIntelligentAssistantPrompt(task: string, context?: string): string {
  return `As an intelligent assistant, help with the following task: ${task}
${context ? `\n\nContext: ${context}` : ''}
\nProvide a helpful, actionable response that addresses the task directly.`;
}

export async function performIntelligentTask(
  task: string,
  context?: string,
  mode: BotMode = 'thoughtful'
): Promise<AIResponse> {
  const prompt = getIntelligentAssistantPrompt(task, context);
  const messages: ChatMessage[] = [{ role: 'user', content: prompt }];

  return generateAIResponse(messages, mode);
}
