import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseServer } from '@/lib/supabase';
import { generateAIResponse, BotMode, ChatMessage } from '@/lib/ai-service';

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

    // Step 1: Search knowledge_base table
    let foundFile: any = null;
    let fileContext = '';
    try {
      const { data: knowledgeFiles, error: knowledgeError } = await supabase
        .from('knowledge_base')
        .select('id, filename, file_type, file_url, description, extracted_text')
        .order('created_at', { ascending: false });

      if (!knowledgeError && knowledgeFiles) {
        // Search in filename, description, and extracted_text
        const userWords = message.toLowerCase().split(/\s+/).filter((word: string) => word.length > 2);
        const relevantFiles = knowledgeFiles.filter((file: any) => {
          const filenameLower = file.filename.toLowerCase();
          const descriptionLower = (file.description || '').toLowerCase();
          const textLower = file.extracted_text.toLowerCase();
          return userWords.some((word: string) => 
            filenameLower.includes(word) || descriptionLower.includes(word) || textLower.includes(word)
          );
        });

        if (relevantFiles.length > 0) {
          foundFile = relevantFiles[0];
          fileContext = `معلومات من ملف [${foundFile.filename}] - [${foundFile.description}]:
${foundFile.extracted_text}
---
أجب على سؤال الطالب بناءً على هذا المحتوى فقط. اشرح بأسلوب أكاديمي مبسط.`;
        }
      }
    } catch (error) {
      console.warn('Knowledge base search error:', error);
    }

    // Step 2: If no file found, try web search
    let webSearchContext = '';
    let source = 'ai';
    if (!foundFile) {
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

    // Generate AI response
    const aiResponse = await generateAIResponse(chatHistory, mode as BotMode, botPersonality);

    // Format the response based on source
    let formattedContent = aiResponse.content;
    if (source === 'file' && foundFile) {
      formattedContent = `📂 وجدت معلومات في ملف: ${foundFile.description}\n\n${aiResponse.content}`;
    } else if (source === 'web') {
      formattedContent = `🌐 لم أجد ملفاً محفوظاً، هذا ما وجدته على الإنترنت:\n\n${aiResponse.content}`;
    }

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

    // Track token usage (estimate based on message length)
    if (userId && mode !== 'quick') {
      const estimatedTokens = message.length / 4 + aiResponse.content.length / 4;
      await trackTokenUsage(userId, mode as BotMode, Math.floor(estimatedTokens));
    }

    // Save bot response to Supabase (skip if local conversation)
    if (!isLocalConversation) {
      const { error: botMessageError } = await server.from('messages').insert({
        conversation_id: conversationId,
        role: 'bot',
        content: formattedContent,
        mode: aiResponse.mode,
        code_block: aiResponse.codeBlock,
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

    return NextResponse.json({
      content: formattedContent,
      mode: aiResponse.mode,
      codeBlock: aiResponse.codeBlock,
      provider: aiResponse.provider,
      model: aiResponse.model,
      fileCard: foundFile ? {
        id: foundFile.id,
        filename: foundFile.filename,
        file_type: foundFile.file_type,
        file_url: foundFile.file_url,
        description: foundFile.description,
      } : null,
      source,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
