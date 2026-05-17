import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateAIResponse, BotMode, ChatMessage } from '@/lib/ai-service';

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

    // Get conversation history from Supabase
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json({ error: 'Failed to fetch conversation history' }, { status: 500 });
    }

    // Convert to ChatMessage format
    const chatHistory: ChatMessage[] = (messages || []).map((msg: any) => ({
      role: msg.role === 'bot' ? 'assistant' : 'user',
      content: msg.content,
    }));

    // Add current user message
    chatHistory.push({
      role: 'user',
      content: message,
    });

    // Save user message to Supabase
    const { error: userMessageError } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      role: 'user',
      content: message,
      mode,
    });

    if (userMessageError) {
      console.error('Error saving user message:', userMessageError);
      // Continue anyway to generate response
    }

    // Generate AI response
    const aiResponse = await generateAIResponse(chatHistory, mode as BotMode, botPersonality);

    // Save bot response to Supabase
    const { error: botMessageError } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      role: 'bot',
      content: aiResponse.content,
      mode: aiResponse.mode,
      code_block: aiResponse.codeBlock,
    });

    if (botMessageError) {
      console.error('Error saving bot message:', botMessageError);
    }

    // Update conversation timestamp and last message
    const { error: updateError } = await supabase
      .from('conversations')
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    if (updateError) {
      console.error('Error updating conversation:', updateError);
    }

    return NextResponse.json({
      content: aiResponse.content,
      mode: aiResponse.mode,
      codeBlock: aiResponse.codeBlock,
      provider: aiResponse.provider,
      model: aiResponse.model,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
