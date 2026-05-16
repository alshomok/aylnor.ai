export type AIMode = 'fast' | 'thoughtful' | 'programming';
export type AITool = 'gemini-pro' | 'gemini-pro-vision' | 'llama3-70b' | 'mixtral-8x7b';

export type ModelType = 'fast' | 'meditate' | 'code';

export interface AIRequest {
  prompt: string;
  mode: AIMode;
  image?: string;
  language?: string;
  userId?: string;
}

export interface AIResponse {
  content: string;
  tool: AITool;
  tokensUsed: number;
  modelUsed: ModelType;
  isReserve: boolean;
}
