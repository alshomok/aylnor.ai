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

const BASE_PROMPT = `أنت أستاذ جامعي متخصص في علوم الحاسب. اشرح مبسطاً ودقيقاً. استخدم المصطلحات الصحيحة. الكود في الآخر. الرد القصير أفضل. عربية فصحى فقط.

عندما يطلب الطالب شيتاً أو ملفاً معيناً (مثل: "شيت السلامة المهنية"، "شيت المختبر"، إلخ)، يجب أن ترسل له بطاقة الملف مباشرة. لا تشرح كثيراً، فقط أرسل البطاقة التي تحتوي على اسم الملف وزر التحميل.`;

const MODE_SYSTEM_PROMPTS: Record<BotMode, string> = {
  quick: BASE_PROMPT,
  thoughtful: `${BASE_PROMPT}

في وضع المفكر: اشرح بعمق وتفصيل. استخدم أمثلة عملية. ركز على الفهم الكامل للمفهوم.`,
  programming: `${BASE_PROMPT}

في وضع المبرمج: أنت مطور برمجيات خبير. اكتب كود نظيف وقابل للصيانة. استخدم أفضل الممارسات. اشرح الكود باختصار. ركز على الحل العملي.`,
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
