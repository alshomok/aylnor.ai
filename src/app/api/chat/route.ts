import { NextRequest, NextResponse } from 'next/server';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';
import { streamText } from 'ai';
import { aiKeyRotationService, BotMode } from '@/lib/ai-key-rotation';
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

// Initialize AI providers
const google = createGoogleGenerativeAI();
const groq = createGroq();

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationId, mode = 'thoughtful', botPersonality } = body;

    console.log('=== Chat API Called ===');
    console.log('Message length:', message.length);
    console.log('Conversation ID:', conversationId);
    console.log('Mode:', mode);
    console.log('Bot personality:', botPersonality);

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Load skill file based on mode
    const skillFile = mode === 'programming' ? 'skills/programmer.md' : 
                      mode === 'quick' ? 'skills/fast.md' : 'skills/thinker.md';
    
    let skillPrompt = '';
    try {
      const skillPath = path.join(process.cwd(), skillFile);
      if (fs.existsSync(skillPath)) {
        skillPrompt = fs.readFileSync(skillPath, 'utf-8');
      }
    } catch (error) {
      console.error('Error loading skill file:', error);
    }

    // Build system prompt
    const systemPrompt = skillPrompt || `You are a helpful AI assistant.`;
    
    if (botPersonality) {
      systemPrompt + `\n\nAdditional personality: ${botPersonality}`;
    }

    // Prepare messages
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ];

    // Generate AI response with retry logic
    let stream;
    let retryCount = 0;
    const maxRetries = 4;

    while (retryCount < maxRetries) {
      try {
        const keyConfig = aiKeyRotationService.getNextAvailableKey(mode as BotMode);
        
        if (!keyConfig) {
          throw new Error('No AI keys are currently available. All keys may be in cooldown or not configured.');
        }

        console.log(`=== Attempt ${retryCount + 1}/${maxRetries} ===`);
        console.log(`Using key: ${keyConfig.id} (${keyConfig.provider} - ${keyConfig.model})`);

        // Select AI provider
        let model;
        if (keyConfig.provider === 'gemini') {
          model = google(keyConfig.model);
          process.env.GOOGLE_GENERATIVE_AI_API_KEY = keyConfig.apiKey;
        } else if (keyConfig.provider === 'groq') {
          model = groq(keyConfig.model);
          process.env.GROQ_API_KEY = keyConfig.apiKey;
        } else {
          throw new Error(`Unsupported AI provider: ${keyConfig.provider}`);
        }

        // Get mode-specific settings
        const temperature = aiKeyRotationService.getTemperature(mode as BotMode);
        const maxTokens = aiKeyRotationService.getTokenLimit(mode as BotMode);

        console.log('Temperature:', temperature);
        console.log('Max tokens:', maxTokens);

        // Generate streaming response
        stream = streamText({
          model,
          messages,
          temperature,
          ...(maxTokens && { maxGenerationTokens: maxTokens }),
        });

        // Report success
        aiKeyRotationService.reportKeySuccess(keyConfig.id);
        console.log(`Key ${keyConfig.id} succeeded`);
        break;

      } catch (error) {
        const keyConfig = aiKeyRotationService.getNextAvailableKey(mode as BotMode);
        if (keyConfig) {
          aiKeyRotationService.reportKeyFailure(keyConfig.id, mode as BotMode, error as Error);
        }

        const errorMessage = (error as Error).message;
        const isRateLimitError = errorMessage.toLowerCase().includes('rate limit') ||
                                errorMessage.toLowerCase().includes('429') ||
                                errorMessage.toLowerCase().includes('quota');

        console.error(`Attempt ${retryCount + 1} failed:`, errorMessage);
        if (isRateLimitError) {
          console.warn('Rate limit detected, rotating to next key');
        }

        retryCount++;

        if (retryCount >= maxRetries) {
          throw new Error(`Maximum retry attempts (${maxRetries}) exceeded. All AI providers failed.`);
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Create streaming response
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          let fullContent = '';
          
          for await (const chunk of stream.textStream) {
            fullContent += chunk;
            controller.enqueue(encoder.encode(chunk));
          }

          // Extract code block if present
          const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
          const matches = [...fullContent.matchAll(codeBlockRegex)];
          let codeBlock;
          if (matches.length > 0) {
            const lastMatch = matches[matches.length - 1];
            codeBlock = {
              language: lastMatch[1] || 'text',
              code: lastMatch[2].trim(),
            };
          }

          // Save bot message to Supabase if conversation exists
          if (conversationId && supabase) {
            try {
              await supabase.from('messages').insert({
                conversation_id: conversationId,
                role: 'bot',
                content: fullContent,
                mode: mode as BotMode,
                code_block: codeBlock,
              });

              // Update conversation timestamp
              await supabase
                .from('conversations')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', conversationId);
            } catch (error) {
              console.error('Error saving bot message:', error);
            }
          }

        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error' },
      { status: 500 }
    );
  }
}
