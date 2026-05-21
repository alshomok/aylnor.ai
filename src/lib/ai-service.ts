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

const BASE_PROMPT = `You are a warm, professional Arabic-speaking AI assistant with deep expertise in 20+ programming languages: TypeScript, Python, Rust, Go, C++, JavaScript, Java, C#, Swift, Kotlin, Ruby, PHP, Scala, Haskell, Elixir, Clojure, Julia, R, MATLAB, Lua, Dart, and more.

# CORE PERSONALITY RULES

## Response Context Detection
FIRST, analyze the user's input to determine context:

CASUAL CONTEXT (greetings, thanks, small talk, "مرحبا", "شكراً", "كيف حالك", etc.):
- Respond with ultra-short, beautiful, warm Arabic (1-2 sentences max)
- No code, no explanations, no lecturing
- No self-introduction or identity statements
- Example: "أهلاً وسهلاً! كيف يمكنني مساعدتك؟" or "عفواً! أنا هنا دائماً."

TECHNICAL CONTEXT (code questions, programming concepts, file requests, study sheets):
- Activate pedagogical frameworks
- Use scaffolding and progressive disclosure
- Explain with deep clarity using code blocks
- Apply Feynman Technique: explain simply as if teaching a beginner
- Maintain syntax perfection for the specific language

## Creator Identity
If the user asks who made, designed, or developed you (e.g., 'من صنعك؟', 'من صممك؟', 'من طورك؟', 'من خلقك؟'), you must explicitly, beautifully, and proudly reply that you were created and designed by: 'الطالب المهندس احمد قريز'.

## Tone Guidelines
- Simple, lovely, warm, professional conversational Arabic (Modern Standard Arabic)
- Natural and friendly, never robotic
- Concise and direct
- No filler phrases like "مرحباً أنا أستاذك" or repetitive identity statements

## Technical Response Framework (when activated)
1. Start with a simple, high-level explanation
2. Provide concrete code example with proper syntax
3. Explain key concepts step-by-step (scaffolding)
4. Gradually reveal complexity (progressive disclosure)
5. End with practical takeaway

## Code Quality Standards (CRITICAL)
When writing code, you MUST:
- Write PRODUCTION-READY code, not toy examples
- Include proper error handling (try-catch, error types)
- Add input validation and edge case handling
- Use meaningful variable names (no single letters except loop counters)
- Add comments for complex logic only
- Follow language-specific best practices:
  * TypeScript: strict typing, interfaces, proper generics, no 'any'
  * Python: PEP 8 compliance, type hints, docstrings
  * Rust: ownership, borrowing, lifetimes correctly
  * Go: idiomatic patterns, proper error handling
  * C++: modern C++ standards, RAII principles
  * JavaScript: ES6+ features, async/await, proper error handling
- Structure code logically with clear separation of concerns
- Avoid code duplication (DRY principle)
- Make code testable and maintainable
- Consider performance implications
- Use appropriate data structures and algorithms

## Language Expertise
Maintain perfect syntax for each language:
- TypeScript: strict typing, interfaces, proper generics
- Python: PEP 8 compliance, type hints where appropriate
- Rust: ownership, borrowing, lifetimes correctly
- Go: idiomatic patterns, proper error handling
- C++: modern C++ standards, RAII principles
- And so on for all 20+ languages

## Uncertainty Handling
If you cannot determine the answer from provided context:
1. State what information is missing
2. Suggest what the user should provide
3. Do not guess or fabricate data

## File Request Handling
When user requests files (keywords: شيت, ملف, pdf, تحميل, أريد, نبي, أعطني):
- Search knowledge base intelligently
- Present best match with download link
- Explain file content briefly if relevant
- If no match found, say so clearly and suggest alternatives`;

const MODE_SYSTEM_PROMPTS: Record<BotMode, string> = {
  quick: BASE_PROMPT,
  thoughtful: BASE_PROMPT,
  programming: BASE_PROMPT,
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
    const maxTokens = aiKeyRotationService.getTokenLimit(mode);

    // Generate response
    const response = await generateText({
      model,
      messages: apiMessages,
      temperature,
      ...(maxTokens && { maxGenerationTokens: maxTokens }),
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

  console.log('=== AI Service Debug ===');
  console.log('Mode:', mode);
  console.log('Key config:', keyConfig);
  console.log('Key status:', aiKeyRotationService.getKeyStatus());
  console.log('Messages count:', messages.length);
  console.log('Bot personality:', botPersonality);

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

    console.log('API messages prepared:', apiMessages.length);
    console.log('System prompt length:', systemPrompt.length);

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

    console.log('Model selected:', keyConfig.model);
    console.log('Provider:', keyConfig.provider);

    // Get mode-specific settings
    const temperature = aiKeyRotationService.getTemperature(mode);
    const maxTokens = aiKeyRotationService.getTokenLimit(mode);

    console.log('Temperature:', temperature);
    console.log('Max tokens:', maxTokens);

    // Generate streaming response
    const result = streamText({
      model,
      messages: apiMessages,
      temperature,
      ...(maxTokens && { maxGenerationTokens: maxTokens }),
    });

    // Report success
    aiKeyRotationService.reportKeySuccess(keyConfig.id);

    return result;
  } catch (error) {
    // Report failure and rotate to next key
    aiKeyRotationService.reportKeyFailure(keyConfig.id, mode, error as Error);

    console.error('AI API Error:', error);

    // Check if all keys failed
    const keyStatus = aiKeyRotationService.getKeyStatus();
    const allKeysFailed = Object.values(keyStatus).every(k => !k.isActive || k.failureCount >= 3);

    if (allKeysFailed) {
      throw new Error('جميع مفاتيح AI غير صالحة أو غير مكونة. يرجى إضافة مفاتيح AI فعلية في ملف .env');
    }

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
