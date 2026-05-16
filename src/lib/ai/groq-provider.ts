import Groq from 'groq-sdk';
import type { AIRequest, AIResponse } from './types';

export async function groqRequest(apiKey: string, req: AIRequest): Promise<AIResponse> {
  const client = new Groq({ apiKey });
  // Use chat completion API similar to previous implementation
  const completion = await client.chat.completions.create({
    messages: [{ role: 'user', content: req.prompt }],
    model: req.mode === 'fast' ? 'llama3-70b-8192' : 'mixtral-8x7b-32768',
    temperature: req.mode === 'fast' ? 0.7 : 0.3,
    max_tokens: req.mode === 'fast' ? 2048 : 4096,
  });

  return {
    content: completion.choices[0]?.message?.content || '',
    tool: req.mode === 'fast' ? 'llama3-70b' : 'mixtral-8x7b',
    tokensUsed: completion.usage?.total_tokens || 0,
    modelUsed: req.mode === 'fast' ? 'fast' : 'code',
    isReserve: false,
  };
}
