import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { KeyManager } from './key-manager';

// Collect Gemini API keys, removing empty ones
const geminiKeys = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
].filter(Boolean) as string[];

if (geminiKeys.length === 0) {
  console.warn('Warning: No Gemini API keys found. Gemini services will be unavailable.');
}

// Collect Groq API keys, removing empty ones
const groqKeys = [
  process.env.GROQ_API_KEY_1,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
  process.env.GROQ_API_KEY_4,
].filter(Boolean) as string[];

if (groqKeys.length === 0) {
  console.warn('Warning: No Groq API keys found. Groq services will be unavailable.');
}

// Initialize KeyManager only if keys are available
const geminiKeyManager = geminiKeys.length > 0 ? new KeyManager(geminiKeys) : null;
const groqKeyManager = groqKeys.length > 0 ? new KeyManager(groqKeys) : null;

// Initialize AI clients with dynamic key management (only if valid keys exist)
const geminiClient = geminiKeyManager ? new GoogleGenerativeAI(geminiKeyManager.getActiveKey()) : null;
const groqClient = groqKeys.length > 0 ? new Groq({ apiKey: groqKeys[0] }) : null;

export type AIMode = 'fast' | 'thoughtful' | 'programming';
export type AITool = 'gemini-pro' | 'gemini-pro-vision' | 'llama3-70b' | 'mixtral-8x7b';
export type ModelType = 'fast' | 'meditate' | 'code';

interface AIResponse {
  content: string;
  tool: AITool;
  tokensUsed: number;
  modelUsed: ModelType;
  isReserve: boolean;
}

interface AIRequest {
  prompt: string;
  mode: AIMode;
  image?: string;
  language?: string;
  userId?: string;
}

// Token tracking per model
interface ModelTokenStatus {
  availableTokens: number;
  totalTokens: number;
  lastUpdated: number;
}

// Model configuration with token limits
const MODEL_CONFIG = {
  fast: {
    primaryTool: 'llama3-70b' as AITool,
    reserveTool: 'llama3-70b' as AITool,
    tokenLimit: 1000000, // 1M tokens per month
    priority: 1,
  },
  meditate: {
    primaryTool: 'gemini-pro' as AITool,
    reserveTool: 'gemini-pro' as AITool,
    tokenLimit: 1000000, // 1M tokens per month
    priority: 2,
  },
  code: {
    primaryTool: 'mixtral-8x7b' as AITool,
    reserveTool: 'mixtral-8x7b' as AITool,
    tokenLimit: 1000000, // 1M tokens per month
    priority: 3,
  },
};

// Token tracking system (in-memory for serverless, can be replaced with Redis)
class TokenTracker {
  private tokenStatus: Map<ModelType, ModelTokenStatus> = new Map();
  private readonly RESET_INTERVAL = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

  constructor() {
    // Initialize token status for all models
    Object.keys(MODEL_CONFIG).forEach((model) => {
      this.tokenStatus.set(model as ModelType, {
        availableTokens: MODEL_CONFIG[model as ModelType].tokenLimit,
        totalTokens: MODEL_CONFIG[model as ModelType].tokenLimit,
        lastUpdated: Date.now(),
      });
    });
  }

  // Check if model has available tokens
  hasTokens(model: ModelType): boolean {
    const status = this.tokenStatus.get(model);
    if (!status) return false;

    // Reset if interval has passed
    if (Date.now() - status.lastUpdated > this.RESET_INTERVAL) {
      this.resetTokens(model);
      return true;
    }

    return status.availableTokens > 0;
  }

  // Deduct tokens from model
  deductTokens(model: ModelType, tokensUsed: number): void {
    const status = this.tokenStatus.get(model);
    if (!status) return;

    status.availableTokens = Math.max(0, status.availableTokens - tokensUsed);
    status.lastUpdated = Date.now();
  }

  // Reset tokens for a model
  resetTokens(model: ModelType): void {
    const config = MODEL_CONFIG[model];
    this.tokenStatus.set(model, {
      availableTokens: config.tokenLimit,
      totalTokens: config.tokenLimit,
      lastUpdated: Date.now(),
    });
  }

  // Get token status for all models
  getAllStatus(): Record<ModelType, ModelTokenStatus> {
    return Object.fromEntries(this.tokenStatus) as Record<ModelType, ModelTokenStatus>;
  }

  // Purchase tokens for a specific model
  purchaseTokens(model: ModelType, amount: number): void {
    const status = this.tokenStatus.get(model);
    if (!status) return;

    status.availableTokens += amount;
    status.totalTokens += amount;
    status.lastUpdated = Date.now();
  }
}

// Global token tracker instance
const tokenTracker = new TokenTracker();

// Model selection based on mode with token awareness
function selectModelWithTokens(mode: AIMode, hasImage: boolean): ModelType {
  // Map AIMode to ModelType
  const modeToModel: Record<AIMode, ModelType> = {
    fast: 'fast',
    thoughtful: 'meditate',
    programming: 'code',
  };

  const primaryModel = modeToModel[mode];

  // Check if primary model has tokens
  if (tokenTracker.hasTokens(primaryModel)) {
    return primaryModel;
  }

  // If primary model is out of tokens, try to transition to next available model
  const models: ModelType[] = ['fast', 'meditate', 'code'];
  const currentIndex = models.indexOf(primaryModel);

  // Try models in priority order
  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    if (tokenTracker.hasTokens(model)) {
      console.log(`Transitioning from ${primaryModel} to ${model} due to token exhaustion`);
      return model;
    }
  }

  // If all models are out of tokens, return primary anyway (will use reserve)
  return primaryModel;
}

// AI tool selection based on model type
function selectAIToolForModel(model: ModelType, hasImage: boolean): AITool {
  const config = MODEL_CONFIG[model];
  if (hasImage && model === 'meditate') {
    return 'gemini-pro-vision';
  }
  return config.primaryTool;
}

// Gemini Pro for academic content
async function callGeminiPro(prompt: string): Promise<AIResponse> {
  if (!geminiKeyManager || !geminiClient) {
    console.error('Gemini service is not available - no API keys configured');
    throw new Error('Gemini service unavailable: no API keys configured');
  }
  
  try {
    const apiKey = geminiKeyManager.getActiveKey();
    if (!apiKey) {
      console.error('No active Gemini API key available');
      throw new Error('No active Gemini API key');
    }
    
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({ model: 'gemini-pro' });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    geminiKeyManager.reportSuccess();
    
    return {
      content: text,
      tool: 'gemini-pro',
      tokensUsed: response.usageMetadata?.totalTokenCount || 0,
      modelUsed: 'meditate',
      isReserve: false,
    };
  } catch (error) {
    if (geminiKeyManager) {
      geminiKeyManager.reportFailure(error as Error);
    }
    throw error;
  }
}

// Gemini Pro Vision for code analysis
async function callGeminiProVision(prompt: string, image: string): Promise<AIResponse> {
  if (!geminiKeyManager || !geminiClient) {
    console.error('Gemini Vision service is not available - no API keys configured');
    throw new Error('Gemini Vision service unavailable: no API keys configured');
  }
  
  try {
    const apiKey = geminiKeyManager.getActiveKey();
    if (!apiKey) {
      console.error('No active Gemini API key available');
      throw new Error('No active Gemini API key');
    }
    
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({ model: 'gemini-pro-vision' });
    
    const result = await model.generateContent([prompt, image]);
    const response = await result.response;
    const text = response.text();
    
    geminiKeyManager.reportSuccess();
    
    return {
      content: text,
      tool: 'gemini-pro-vision',
      tokensUsed: response.usageMetadata?.totalTokenCount || 0,
      modelUsed: 'meditate',
      isReserve: false,
    };
  } catch (error) {
    if (geminiKeyManager) {
      geminiKeyManager.reportFailure(error as Error);
    }
    throw error;
  }
}

// Llama 3 70B for fast responses
async function callLlama3(prompt: string): Promise<AIResponse> {
  if (!groqKeyManager) {
    console.error('Groq service is not available - no API keys configured');
    throw new Error('Groq service unavailable: no API keys configured');
  }
  
  try {
    const apiKey = groqKeyManager.getActiveKey();
    if (!apiKey) {
      console.error('No active Groq API key available');
      throw new Error('No active Groq API key');
    }
    
    const client = new Groq({ apiKey });
    const completion = await client.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-70b-8192',
      temperature: 0.7,
      max_tokens: 2048,
    });
    
    groqKeyManager.reportSuccess();
    
    return {
      content: completion.choices[0]?.message?.content || '',
      tool: 'llama3-70b',
      tokensUsed: completion.usage?.total_tokens || 0,
      modelUsed: 'fast',
      isReserve: false,
    };
  } catch (error) {
    if (groqKeyManager) {
      groqKeyManager.reportFailure(error as Error);
    }
    throw error;
  }
}

// Mixtral 8x7B for code generation
async function callMixtral(prompt: string, language?: string): Promise<AIResponse> {
  if (!groqKeyManager) {
    console.error('Groq service is not available - no API keys configured');
    throw new Error('Groq service unavailable: no API keys configured');
  }
  
  try {
    const apiKey = groqKeyManager.getActiveKey();
    if (!apiKey) {
      console.error('No active Groq API key available');
      throw new Error('No active Groq API key');
    }
    
    const client = new Groq({ apiKey });
    const systemPrompt = language 
      ? `You are an expert ${language} programmer. Provide clean, well-commented code.`
      : 'You are an expert programmer. Provide clean, well-commented code.';
    
    const completion = await client.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      model: 'mixtral-8x7b-32768',
      temperature: 0.3,
      max_tokens: 4096,
    });
    
    groqKeyManager.reportSuccess();
    
    return {
      content: completion.choices[0]?.message?.content || '',
      tool: 'mixtral-8x7b',
      tokensUsed: completion.usage?.total_tokens || 0,
      modelUsed: 'code',
      isReserve: false,
    };
  } catch (error) {
    if (groqKeyManager) {
      groqKeyManager.reportFailure(error as Error);
    }
    throw error;
  }
}

// Main AI service function with token-aware model selection
export async function getAIResponse(request: AIRequest): Promise<AIResponse> {
  const { prompt, mode, image, language, userId } = request;
  
  // Select model based on token availability
  const selectedModel = selectModelWithTokens(mode, !!image);
  const selectedTool = selectAIToolForModel(selectedModel, !!image);
  
  try {
    let response: AIResponse;
    
    switch (selectedTool) {
      case 'gemini-pro':
        response = await callGeminiPro(prompt);
        break;
      
      case 'gemini-pro-vision':
        if (!image) {
          throw new Error('Image required for Gemini Pro Vision');
        }
        response = await callGeminiProVision(prompt, image);
        break;
      
      case 'llama3-70b':
        response = await callLlama3(prompt);
        break;
      
      case 'mixtral-8x7b':
        response = await callMixtral(prompt, language);
        break;
      
      default:
        throw new Error(`Unknown AI tool: ${selectedTool}`);
    }
    
    // Deduct tokens from the model that was actually used
    tokenTracker.deductTokens(response.modelUsed, response.tokensUsed);
    
    return response;
  } catch (error) {
    console.error('AI service error:', error);
    
    // If all attempts failed, try transitioning to another model
    const models: ModelType[] = ['fast', 'meditate', 'code'];
    for (const model of models) {
      if (model !== selectedModel && tokenTracker.hasTokens(model)) {
        try {
          const fallbackTool = selectAIToolForModel(model, !!image);
          let response: AIResponse;
          
          switch (fallbackTool) {
            case 'llama3-70b':
              response = await callLlama3(prompt);
              break;
            case 'gemini-pro':
              response = await callGeminiPro(prompt);
              break;
            case 'mixtral-8x7b':
              response = await callMixtral(prompt, language);
              break;
            default:
              continue;
          }
          
          console.log(`Successfully transitioned to ${model} model`);
          tokenTracker.deductTokens(response.modelUsed, response.tokensUsed);
          return response;
        } catch (modelError) {
          console.error(`Model ${model} also failed:`, modelError);
          continue;
        }
      }
    }
    
    throw new Error('All AI models failed');
  }
}

// Streaming response function with token-aware model selection
export async function* streamAIResponse(request: AIRequest): AsyncGenerator<string> {
  const { prompt, mode, image, language } = request;
  
  // Select model based on token availability
  const selectedModel = selectModelWithTokens(mode, !!image);
  const selectedTool = selectAIToolForModel(selectedModel, !!image);
  
  if (selectedTool === 'llama3-70b' || selectedTool === 'mixtral-8x7b') {
    if (!groqKeyManager) {
      throw new Error('Groq service unavailable: no API keys configured');
    }
    
    try {
      const apiKey = groqKeyManager.getActiveKey();
      if (!apiKey) {
        throw new Error('No active Groq API key available');
      }
      
      const client = new Groq({ apiKey });
      const stream = await client.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: selectedTool === 'llama3-70b' ? 'llama3-70b-8192' : 'mixtral-8x7b-32768',
        temperature: selectedTool === 'llama3-70b' ? 0.7 : 0.3,
        max_tokens: selectedTool === 'llama3-70b' ? 2048 : 4096,
        stream: true,
      });
      
      // Stream the content
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          yield content;
        }
      }
      
      groqKeyManager.reportSuccess();
      
      // Estimate token usage for streaming (approximate)
      const estimatedTokens = Math.ceil(prompt.length / 4) + (selectedTool === 'llama3-70b' ? 2048 : 4096);
      tokenTracker.deductTokens(selectedModel, estimatedTokens);
    } catch (error) {
      if (groqKeyManager) {
        groqKeyManager.reportFailure(error as Error);
      }
      throw error;
    }
  } else {
    // For Gemini, we'll use non-streaming for now
    const response = await getAIResponse(request);
    yield response.content;
  }
}

// Rate limiting and usage tracking
export class AIUsageTracker {
  private usage: Map<string, { count: number; lastReset: number }> = new Map();
  private readonly RATE_LIMIT = 100; // requests per hour
  private readonly RESET_INTERVAL = 3600000; // 1 hour in ms
  
  canMakeRequest(userId: string): boolean {
    const now = Date.now();
    const userUsage = this.usage.get(userId);
    
    if (!userUsage || now - userUsage.lastReset > this.RESET_INTERVAL) {
      this.usage.set(userId, { count: 1, lastReset: now });
      return true;
    }
    
    if (userUsage.count >= this.RATE_LIMIT) {
      return false;
    }
    
    userUsage.count++;
    return true;
  }
  
  getRemainingRequests(userId: string): number {
    const userUsage = this.usage.get(userId);
    if (!userUsage || Date.now() - userUsage.lastReset > this.RESET_INTERVAL) {
      return this.RATE_LIMIT;
    }
    return Math.max(0, this.RATE_LIMIT - userUsage.count);
  }
}

export const usageTracker = new AIUsageTracker();

// Token management functions for API routes
export function purchaseTokens(model: ModelType, amount: number): void {
  tokenTracker.purchaseTokens(model, amount);
  console.log(`Purchased ${amount} tokens for ${model} model`);
}

export function getTokenStatus(): Record<ModelType, ModelTokenStatus> {
  return tokenTracker.getAllStatus();
}

export function resetModelTokens(model: ModelType): void {
  tokenTracker.resetTokens(model);
  console.log(`Reset tokens for ${model} model`);
}

// Model transition logic when tokens are purchased
export function handleTokenPurchase(model: ModelType, amount: number): void {
  // Add tokens to the specified model
  purchaseTokens(model, amount);
  
  // Log the transition event
  console.log(`Token purchase event: ${model} model received ${amount} tokens`);
  
  // Check if this enables the model to be used again
  const status = tokenTracker.getAllStatus()[model];
  if (status.availableTokens > 0) {
    console.log(`${model} model is now operational with ${status.availableTokens} tokens`);
  }
}
