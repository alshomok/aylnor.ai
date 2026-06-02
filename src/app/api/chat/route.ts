import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseServer } from '@/lib/supabase';
import { generateAIResponseStream, BotMode, ChatMessage } from '@/lib/ai-service';
import { findBestMatch } from '@/lib/matching-algorithm';
import { promises as fs } from 'fs';
import path from 'path';

const HOURLY_REQUEST_LIMITS: Record<BotMode, number> = {
  quick: Infinity,
  thoughtful: 50,
  programming: 50,
};

// Map mode names to skill file names
const MODE_TO_SKILL_FILE: Record<BotMode, string> = {
  quick: 'fast.md',
  thoughtful: 'thinker.md',
  programming: 'programmer.md',
};

async function loadSkillFile(mode: BotMode): Promise<string> {
  const skillFileName = MODE_TO_SKILL_FILE[mode];
  const skillFilePath = path.join(process.cwd(), 'skills', skillFileName);

  try {
    const skillContent = await fs.readFile(skillFilePath, 'utf-8');
    return skillContent;
  } catch (error) {
    console.error(`Failed to load skill file for mode ${mode}:`, error);
    // Fallback to a basic prompt if file loading fails
    return `You are "aylnor" (Aylnor.ai), an elite academic AI assistant specialized for computer science students. You were proudly created by the Student Engineer Ahmed Quraiz.`;
  }
}

async function checkHourlyRequestLimit(userId: string, mode: BotMode): Promise<{ allowed: boolean; remainingMinutes?: number }> {
  const server = supabaseServer();
  if (!server) {
    console.warn('Supabase server client not initialized, allowing request');
    return { allowed: true };
  }

  const limit = HOURLY_REQUEST_LIMITS[mode];
  if (limit === Infinity) return { allowed: true };

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  console.log('=== Hourly Limit Check ===');
  console.log('User ID:', userId);
  console.log('Mode:', mode);
  console.log('Limit:', limit);
  console.log('One hour ago:', oneHourAgo);

  const { count, error } = await server
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('mode', mode)
    .eq('role', 'user')
    .gte('created_at', oneHourAgo);

  if (error) {
    console.error('Error checking hourly limit:', JSON.stringify(error));
    console.error('Error details:', error);
    return { allowed: true }; // Allow on error
  }

  console.log('Request count:', count);

  const requestCount = count || 0;
  if (requestCount >= limit) {
    // Calculate remaining time until limit resets
    const oldestRequest = await server
      .from('messages')
      .select('created_at')
      .eq('user_id', userId)
      .eq('mode', mode)
      .eq('role', 'user')
      .gte('created_at', oneHourAgo)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    let remainingMinutes = 60;
    if (oldestRequest?.data?.created_at) {
      const oldestTime = new Date(oldestRequest.data.created_at).getTime();
      const elapsedTime = Date.now() - oldestTime;
      remainingMinutes = Math.max(0, Math.ceil((60 * 60 * 1000 - elapsedTime) / (60 * 1000)));
    }

    return { allowed: false, remainingMinutes };
  }

  return { allowed: true };
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

    // Check hourly request limit for non-quick modes
    if (userId && mode !== 'quick') {
      const { allowed, remainingMinutes } = await checkHourlyRequestLimit(userId, mode as BotMode);
      if (!allowed) {
        const modeNames = {
          thoughtful: 'المفكر',
          programming: 'المبرمج',
        };
        const modeName = modeNames[mode as keyof typeof modeNames] || mode;
        return NextResponse.json(
          { error: `لقد وصلت للحد الأقصى لاستخدام وضع ${modeName} المتقدم لهذه الساعة. يمكنك استخدام الوضع السريع حالياً، أو الانتظار حتى ينتهي وقت الحظر بعد ${remainingMinutes} دقيقة.` },
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

    // Build chat history with sliding window (last 5 messages to prevent context loops)
    const chatHistory: ChatMessage[] = messages.map((msg: any) => ({
      role: msg.role === 'bot' ? 'assistant' : 'user',
      content: msg.content,
    }));

    // Apply sliding window: keep last 5 messages to prevent context loops and hallucination bugs
    const optimizedChatHistory = chatHistory.slice(-5);

    // Step 1: Load all knowledge base files as context (only if needed)
    let fileContext = '';
    let foundFile: any = null;
    let isFileRequest = false;
    let educationalFile: any = null;

    // Check if user is requesting a specific file first (before loading files)
    const fileRequestKeywords = ['شيت', 'ملف', 'pdf', 'تحميل', 'أريد', 'نبي', 'أعطني', 'أرجو', 'لو سمحت', 'ممكن', 'هل يوجد'];
    isFileRequest = fileRequestKeywords.some(keyword => message.toLowerCase().includes(keyword));

    // Only load knowledge base files if it's a file request
    if (isFileRequest) {
      try {
        const { data: knowledgeFiles, error: knowledgeError } = await supabase
          .from('knowledge_base')
          .select('id, filename, file_type, file_url, description, extracted_text, created_at')
          .order('created_at', { ascending: false });

        if (!knowledgeError && knowledgeFiles && knowledgeFiles.length > 0) {
          // Use AI orchestration for intelligent search
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

          // Fallback to keyword search if AI didn't find a match
          if (!foundFile) {
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
    }

    // Step 1.5: Search educational_files table for Google Drive files (only if needed)
    // Check if user is requesting a file using specific keywords
    const educationalFileKeywords = ['مذكرة', 'شيت', 'ملف', 'منهج', 'تحميل'];
    const isEducationalFileRequest = educationalFileKeywords.some(keyword =>
      message.toLowerCase().includes(keyword)
    );

    console.log('=== File Search Debug ===');
    console.log('User message:', message);
    console.log('Is file request:', isEducationalFileRequest);
    console.log('Detected keywords:', educationalFileKeywords.filter(k => message.toLowerCase().includes(k)));

    if (isEducationalFileRequest) {
      try {
        // Extract key terms from the message for better matching
        const searchTerms = message
          .replace(/نبي|أريد|أرجو|ممكن|هل يوجد|شيت|ملف|مذكرة|منهج|تحميل/gi, '')
          .trim()
          .split(/\s+/)
          .filter((term: string) => term.length > 2);

        console.log('Extracted search terms:', searchTerms);

        // Build search query with relaxed terms
        let searchQuery = '';
        if (searchTerms.length > 0) {
          const termConditions = searchTerms.map((term: string) => 
            `title.ilike.%${term}%,description.ilike.%${term}%`
          );
          searchQuery = termConditions.join(',');
        } else {
          // Fallback to full message search if no terms extracted
          searchQuery = `title.ilike.%${message}%,description.ilike.%${message}%`;
        }

        console.log('Search query:', searchQuery);

        const { data: educationalFiles, error: educationalError } = await supabase
          .from('educational_files')
          .select('*')
          .or(searchQuery);

        console.log('Fetched Files from DB:', educationalFiles);
        console.log('Search error:', educationalError);

        if (!educationalError && educationalFiles && educationalFiles.length > 0) {
          // Score each file based on match quality
          const scoredFiles = educationalFiles.map(file => {
            let score = 0;
            const titleLower = file.title.toLowerCase();
            const descLower = (file.description || '').toLowerCase();
            const messageLower = message.toLowerCase();

            // Exact match in title gets highest score
            if (titleLower.includes(messageLower)) {
              score += 100;
            }

            // Match each search term
            searchTerms.forEach((term: string) => {
              const termLower = term.toLowerCase();
              if (titleLower.includes(termLower)) {
                score += 20; // Match in title
              }
              if (descLower.includes(termLower)) {
                score += 10; // Match in description
              }
            });

            // Bonus for "شيت" match in title
            if (message.includes('شيت') && titleLower.includes('شيت')) {
              score += 30;
            }

            // Bonus for "مذكرة" match in title
            if (message.includes('مذكرة') && titleLower.includes('مذكرة')) {
              score += 30;
            }

            console.log(`File "${file.title}" score: ${score}`);
            return { file, score };
          });

          // Sort by score (highest first)
          scoredFiles.sort((a, b) => b.score - a.score);

          // Get all matching files (not just the best match)
          const matchingFiles = scoredFiles.map(item => item.file);
          
          console.log('Number of matching files:', matchingFiles.length);
          console.log('Matching files:', matchingFiles.map(f => f.title));
          
          // Add all matching files to context
          fileContext += `\n\n---\n🎯 ملفات تعليمية مطابقة من Google Drive:\n`;
          matchingFiles.forEach((file, index) => {
            const downloadLink = `https://drive.google.com/uc?export=download&id=${file.drive_id}`;
            fileContext += `\n${index + 1}. العنوان: ${file.title}\n   الوصف: ${file.description || 'لا يوجد وصف'}\n   📥 رابط التحميل: ${downloadLink}\n`;
          });
          
          fileContext += `\n⚠️ تعليمات حرجة: الطالب يطلب ملفاً محدداً وجدنا ${matchingFiles.length} ملفات مطابقة في قاعدة البيانات. يجب عليك تقديم روابط التحميل لجميع الملفات المذكورة أعلاه بصيغة Markdown. لا تشرح الموضوع ولا تولد أي كود أو شروحات عامة إلا إذا طلب الطالب ذلك صراحة. الأولوية القصوى هي تقديم روابط التحميل لجميع الملفات المتاحة.\n---`;
        } else {
          console.log('No files found in database');
        }
      } catch (error) {
        console.warn('Educational files search error:', error);
      }
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

    optimizedChatHistory.push({
      role: 'user',
      content: finalMessage,
    });

    // Load skill file dynamically based on mode
    const skillPrompt = await loadSkillFile(mode as BotMode);

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

    // Generate AI response with streaming using optimized chat history and dynamic skill prompt
    console.log('=== Generating AI Response ===');
    console.log('Optimized chat history length:', optimizedChatHistory.length);
    console.log('Final message length:', finalMessage.length);
    console.log('Mode:', mode);
    console.log('Bot personality:', botPersonality);
    console.log('Skill prompt loaded from file:', skillPrompt.substring(0, 100) + '...');

    let stream;
    try {
      stream = await generateAIResponseStream(optimizedChatHistory, mode as BotMode, botPersonality, skillPrompt);
      console.log('Stream generated successfully');
      console.log('Stream object:', stream);
      console.log('Stream has textStream:', 'textStream' in stream);
    } catch (error) {
      console.error('ERROR: Failed to generate AI stream:', error);
      throw error;
    }

    // Collect the full response for database storage
    let fullContent = '';
    let codeBlock: { language: string; code: string } | undefined = undefined;
    let provider = '';
    let model = '';
    let chunkCount = 0;

    // Create a readable stream
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          console.log('=== Starting Stream ===');
          
          let hasChunks = false;
          for await (const chunk of stream.textStream) {
            hasChunks = true;
            chunkCount++;
            fullContent += chunk;
            console.log(`Chunk ${chunkCount}:`, chunk.length, 'chars');
            controller.enqueue(encoder.encode(chunk));
          }

          if (!hasChunks) {
            console.error('ERROR: Stream produced zero chunks');
            const errorMessage = 'عذراً، حدث خطأ في الاتصال بخدمة الذكاء الاصطناعي. لم يتم استلام أي رد.';
            controller.enqueue(encoder.encode(errorMessage));
            fullContent = errorMessage;
          }

          console.log('=== Stream Ended ===');
          console.log('Total chunks:', chunkCount);
          console.log('Full content length:', fullContent.length);

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

          // Remove __METADATA__ from content before saving to database
          const METADATA_MARKER = '\n\n__METADATA__';
          const metaIdx = fullContent.indexOf(METADATA_MARKER);
          const cleanContent = metaIdx !== -1
            ? fullContent.substring(0, metaIdx)
            : fullContent;

          // Format the response based on source
          let formattedContent = cleanContent;
          if (source === 'file' && foundFile) {
            formattedContent = `📂 وجدت معلومات في ملف: ${foundFile.description}\n\n${cleanContent}`;
          } else if (source === 'web') {
            formattedContent = `🌐 لم أجد ملفاً محفوظاً، هذا ما وجدته على الإنترنت:\n\n${cleanContent}`;
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

          // Send final metadata in a single chunk to prevent separation
          controller.enqueue(
            encoder.encode(
              '\n\n__METADATA__' + JSON.stringify({
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
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          console.error('Error details:', errorMessage);
          
          // Stream error message to UI instead of failing silently
          controller.enqueue(encoder.encode(`\n\nعذراً، حدث خطأ: ${errorMessage}`));
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('Error in POST /api/chat:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}
