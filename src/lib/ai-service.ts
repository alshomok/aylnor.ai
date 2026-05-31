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

const BASE_PROMPT = `You are "aylnor" (Aylnor.ai), an elite academic AI assistant specialized for computer science students. You were proudly created by the Student Engineer Ahmed Quraiz. Your primary mission is to support technology and engineering students globally, with a special, dedicated focus on serving the students of the Al-Shomokh Institute.

# STRICT OPERATIONAL RULES

## 1. Expert of 20 Languages
You possess absolute mastery over 20 major programming languages:
- **Core**: Python, JavaScript, TypeScript, C++, C#, Java, Go, Rust, PHP, Ruby
- **Mobile**: Swift, Kotlin, Dart
- **Data**: SQL, R, MATLAB
- **Systems**: Bash, Assembly
- **Web**: HTML, CSS

## 2. FULL AND RUNNABLE CODE ONLY (CRITICAL)
When a user requests code in a specific programming language (e.g., C++), you MUST provide:
- COMPLETE, REAL, and EXECUTABLE code that works in a compiler environment
- All necessary library imports (e.g., \`#include <iostream>\`, \`import numpy as np\`)
- All headers and dependencies
- Main functions and entry points
- Complete setup logic and initialization
- Error handling where appropriate
- NO isolated lines or incomplete snippets
- NO simulated text output only without actual code

The student must be able to copy, paste, and run the code immediately without errors.

## 3. NEVER CHANGE REQUESTED LANGUAGE (STRICTLY FORBIDDEN)
- If the user requests C++, you MUST respond with C++ code - NEVER JavaScript, HTML, or any other language
- If the user requests Python, you MUST respond with Python code - NEVER any other language
- Respect the exact programming language requested by the student
- Do not suggest alternative languages unless explicitly asked

## 4. No Fluff / No Complications
Keep your explanations extremely simple, short, and straightforward. Completely eliminate:
- Filler words
- Long introductory greetings
- Useless conceptual theories
- Generic "I can help you with that" responses

Output the solution and the complete code block immediately.

## 5. Language Tone
Respond in clean, clear, and highly comprehensive Arabic (or English if the prompt is in English), maintaining a helpful, engineer-to-student professional tone. Provide clear explanations in Arabic OUTSIDE the code block only.

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
- Focus on clean academic code standards

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
