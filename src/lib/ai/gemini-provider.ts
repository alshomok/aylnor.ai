import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIRequest, AIResponse } from './types';

export async function geminiRequest(apiKey: string, req: AIRequest): Promise<AIResponse> {
  const client = new GoogleGenerativeAI(apiKey);
  const modelId = req.image ? 'gemini-pro-vision' : 'gemini-pro';
  const model = client.getGenerativeModel({ model: modelId });

  const result = await model.generateContent(req.image ? [req.prompt, req.image] : req.prompt);
  const response = await result.response;
  const text = response.text();

  return {
    content: text,
    tool: req.image ? 'gemini-pro-vision' : 'gemini-pro',
    tokensUsed: response.usageMetadata?.totalTokenCount || 0,
    modelUsed: 'meditate',
    isReserve: false,
  };
}
