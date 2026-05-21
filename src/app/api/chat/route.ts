import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseServer } from '@/lib/supabase';
import { generateAIResponseStream, BotMode, ChatMessage } from '@/lib/ai-service';
import { findBestMatch } from '@/lib/matching-algorithm';

const DAILY_TOKEN_LIMITS: Record<BotMode, number> = {
  quick: Infinity,
  thoughtful: 400000,
  programming: 400000,
};

async function checkTokenBudget(userId: string, mode: BotMode): Promise<boolean> {
  const server = supabaseServer();
  if (!server) return true;

  const limit = DAILY_TOKEN_LIMITS[mode];
  if (limit === Infinity) return true;

  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await server
    .from('token_usage')
    .select('tokens_used')
    .eq('user_id', userId)
    .eq('mode', mode)
    .eq('date', today);

  if (error) {
    console.error('Error checking token budget:', error);
    return true; // Allow on error to not block users
  }

  const totalUsed = data?.reduce((sum, record) => sum + record.tokens_used, 0) || 0;
  return totalUsed < limit;
}

async function trackTokenUsage(userId: string, mode: BotMode, tokensUsed: number): Promise<void> {
  const server = supabaseServer();
  if (!server) return;

  const limit = DAILY_TOKEN_LIMITS[mode];
  if (limit === Infinity) return; // Don't track unlimited mode

  const today = new Date().toISOString().split('T')[0];

  // Check if record exists for today
  const { data: existingRecord } = await server
    .from('token_usage')
    .select('*')
    .eq('user_id', userId)
    .eq('mode', mode)
    .eq('date', today)
    .single();

  if (existingRecord) {
    // Update existing record
    await server
      .from('token_usage')
      .update({ tokens_used: existingRecord.tokens_used + tokensUsed })
      .eq('id', existingRecord.id);
  } else {
    // Create new record
    await server
      .from('token_usage')
      .insert({
        user_id: userId,
        mode,
        tokens_used: tokensUsed,
        date: today,
      });
  }
}

async function performWebSearch(query: string): Promise<string> {
  const apiKey = process.env.SEARCH_API_KEY;
  if (!apiKey) {
    console.warn('SEARCH_API_KEY not configured');
    return '';
  }

  try {
    const response = await fetch('https://api.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        num: 3,
      }),
    });

    if (!response.ok) {
      console.error('Web search API error:', response.status);
      return '';
    }

    const data = await response.json();
    if (!data.organic || data.organic.length === 0) {
      return '';
    }

    const results = data.organic.slice(0, 3).map((result: any) => {
      return `- ${result.title}\n  ${result.snippet}\n  ${result.link}`;
    }).join('\n\n');

    return results;
  } catch (error) {
    console.error('Web search error:', error);
    return '';
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationId, mode, botPersonality, userId } = body;

    if (!message || !conversationId || !mode) {
      return NextResponse.json(
        { error: 'Missing required fields: message, conversationId, mode' },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 });
    }

    const server = supabaseServer();
    if (!server) {
      return NextResponse.json({ error: 'Supabase server client not initialized' }, { status: 500 });
    }

    // Check token budget for non-quick modes
    if (userId && mode !== 'quick') {
      const hasBudget = await checkTokenBudget(userId, mode as BotMode);
      if (!hasBudget) {
        return NextResponse.json(
          { error: 'Daily token limit exceeded for this mode. Please try again tomorrow or use quick mode.' },
          { status: 429 }
        );
      }
    }

    // Check if this is a local conversation (fallback state)
    const isLocalConversation = conversationId.startsWith('conv-');

    // Get conversation history from Supabase (skip if local conversation)
    let messages = [];
    if (!isLocalConversation) {
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
      } else {
        messages = messagesData || [];
      }
    }

    // Build chat history
    const chatHistory: ChatMessage[] = messages.map((msg: any) => ({
      role: msg.role === 'bot' ? 'assistant' : 'user',
      content: msg.content,
    }));

    // Step 1: Load all knowledge base files as context
    let fileContext = '';
    let foundFile: any = null;
    let isFileRequest = false;
    let educationalFile: any = null;
    
    try {
      const { data: knowledgeFiles, error: knowledgeError } = await supabase
        .from('knowledge_base')
        .select('id, filename, file_type, file_url, description, extracted_text, created_at')
        .order('created_at', { ascending: false });

      if (!knowledgeError && knowledgeFiles && knowledgeFiles.length > 0) {
        // Check if user is requesting a specific file
        const fileRequestKeywords = ['شيت', 'ملف', 'pdf', 'تحميل', 'أريد', 'نبي', 'أعطني', 'أرجو', 'لو سمحت', 'ممكن', 'هل يوجد'];
        isFileRequest = fileRequestKeywords.some(keyword => message.toLowerCase().includes(keyword));

        // Use AI orchestration for intelligent search if it's a file request
        if (isFileRequest) {
          try {
            const aiResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai-orchestrate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'search',
                data: {
                  query: message,
                  files: knowledgeFiles,
                },
              }),
            });

            if (aiResponse.ok) {
              const aiData = await aiResponse.json();
              if (aiData.success && aiData.result?.matchedFile) {
                foundFile = aiData.result.matchedFile;
              }
            }
          } catch (error) {
            console.warn('AI search failed, falling back to keyword search:', error);
          }
        }

        // Fallback to keyword search if AI didn't find a match
        if (!foundFile && isFileRequest) {
          const bestMatch = findBestMatch(message, knowledgeFiles);
          if (bestMatch) {
            foundFile = bestMatch.file;
          }
        }

        // Combine all files as context
        const allFilesContext = knowledgeFiles.map((file: any) => 
          `ملف: ${file.filename} - ${file.description}\n${file.extracted_text}`
        ).join('\n\n---\n\n');
        
        fileContext = `قاعدة المعرفة (جميع الملفات):\n${allFilesContext}\n\n---\nأجب على سؤال الطالب بناءً على هذه المعلومات. اشرح بأسلوب أكاديمي مبسط.`;
      }
    } catch (error) {
      console.warn('Knowledge base load error:', error);
    }

    // Step 1.5: Search educational_files table for Google Drive files
    try {
      const { data: educationalFiles, error: educationalError } = await supabase
        .from('educational_files')
        .select('*')
        .ilike('description', `%${message}%`);

      if (!educationalError && educationalFiles && educationalFiles.length > 0) {
        // Get the first matching file
        educationalFile = educationalFiles[0];
        const downloadLink = `https://drive.google.com/uc?export=download&id=${educationalFile.drive_id}`;
        
        // Add to context
        fileContext += `\n\n---\nملف تعليمي من Google Drive:\nالعنوان: ${educationalFile.title}\nالوصف: ${educationalFile.description || 'لا يوجد وصف'}\nرابط التحميل: ${downloadLink}\n---`;
      }
    } catch (error) {
      console.warn('Educational files search error:', error);
    }

    // Step 2: If no files in knowledge base, try web search
    let webSearchContext = '';
    let source = 'ai';
    if (!fileContext) {
      const searchResults = await performWebSearch(message);
      if (searchResults) {
        webSearchContext = `نتائج البحث على الإنترنت:
${searchResults}
---
أجب بناءً على هذه المعلومات. وضح للطالب أن هذه المعلومات من الإنترنت وليس من ملف محفوظ.`;
        source = 'web';
      }
    } else {
      source = 'file';
    }

    // Prepare the user message with context
    let finalMessage = message;
    if (fileContext) {
      finalMessage = `${fileContext}\n\nسؤال الطالب: ${message}`;
    } else if (webSearchContext) {
      finalMessage = `${webSearchContext}\n\nسؤال الطالب: ${message}`;
    }

    chatHistory.push({
      role: 'user',
      content: finalMessage,
    });

    // Generate AI response with streaming
    const stream = await generateAIResponseStream(chatHistory, mode as BotMode, botPersonality);

    // Save user message to Supabase (skip if local conversation)
    if (!isLocalConversation) {
      const { error: userMessageError } = await server.from('messages').insert({
        conversation_id: conversationId,
        role: 'user',
        content: message,
        mode,
      });

      if (userMessageError) {
        console.error('Error saving user message:', userMessageError);
        // Continue anyway to generate response
      }
    }

    // Collect the full response for database storage
    let fullContent = '';
    let codeBlock: { language: string; code: string } | undefined = undefined;
    let provider = '';
    let model = '';

    // Create a readable stream
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream.textStream) {
            fullContent += chunk;
            controller.enqueue(encoder.encode(chunk));
          }

          // Extract code block from full content
          const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
          const matches = [...fullContent.matchAll(codeBlockRegex)];
          if (matches.length > 0) {
            const lastMatch = matches[matches.length - 1];
            codeBlock = {
              language: lastMatch[1] || 'text',
              code: lastMatch[2].trim(),
            };
          }

          // Format the response based on source
          let formattedContent = fullContent;
          if (source === 'file' && foundFile) {
            formattedContent = `📂 وجدت معلومات في ملف: ${foundFile.description}\n\n${fullContent}`;
          } else if (source === 'web') {
            formattedContent = `🌐 لم أجد ملفاً محفوظاً، هذا ما وجدته على الإنترنت:\n\n${fullContent}`;
          }

          // Track token usage (estimate based on message length)
          if (userId && mode !== 'quick') {
            const estimatedTokens = message.length / 4 + fullContent.length / 4;
            await trackTokenUsage(userId, mode as BotMode, Math.floor(estimatedTokens));
          }

          // Save bot response to Supabase (skip if local conversation)
          if (!isLocalConversation) {
            const { error: botMessageError } = await server.from('messages').insert({
              conversation_id: conversationId,
              role: 'bot',
              content: formattedContent,
              mode: mode as BotMode,
              code_block: codeBlock,
            });

            if (botMessageError) {
              console.error('Error saving bot message:', botMessageError);
            }

            // Update conversation timestamp and last message
            const { error: updateError } = await server
              .from('conversations')
              .update({
                updated_at: new Date().toISOString(),
              })
              .eq('id', conversationId);

            if (updateError) {
              console.error('Error updating conversation:', updateError);
            }
          }

          // Send final metadata
          controller.enqueue(encoder.encode('\n\n__METADATA__'));
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                mode,
                codeBlock,
                fileCard: (isFileRequest && foundFile) ? {
                  id: foundFile.id,
                  filename: foundFile.filename,
                  file_type: foundFile.file_type,
                  file_url: foundFile.file_url,
                  description: foundFile.description,
                } : null,
                source,
              })
            )
          );

          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
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
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
