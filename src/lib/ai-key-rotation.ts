export type AIProvider = 'gemini' | 'groq';
export type AIModel = 'model-1' | 'model-2' | 'model-3' | 'model-4';
export type BotMode = 'quick' | 'thoughtful' | 'programming';

export interface AIKeyConfig {
  id: AIModel;
  provider: AIProvider;
  apiKey: string;
  model: string;
  isActive: boolean;
  failureCount: number;
  lastFailureTime?: Date;
}

const MODEL_CONFIGS: Record<AIModel, { provider: AIProvider; model: string; envKey: string }> = {
  'model-1': { provider: 'gemini', model: 'gemini-1.5-flash', envKey: 'GEMINI_API_KEY_1' },
  'model-2': { provider: 'gemini', model: 'gemini-2.0-flash', envKey: 'GEMINI_API_KEY_2' },
  'model-3': { provider: 'groq', model: 'llama-3.1-8b-instant', envKey: 'GROK_API_KEY_1' },
  'model-4': { provider: 'groq', model: 'gemma2-9b-it', envKey: 'GROK_API_KEY_2' },
};

const MODE_ROTATION_PRIORITIES: Record<BotMode, AIModel[]> = {
  quick: ['model-3', 'model-4', 'model-2', 'model-1'],
  thoughtful: ['model-2', 'model-1', 'model-3', 'model-4'],
  programming: ['model-2', 'model-1', 'model-3', 'model-4'],
};

const MODE_TOKEN_LIMITS: Record<BotMode, number | null> = {
  quick: 2048,
  thoughtful: 4096,
  programming: 4096,
};

const MODE_TEMPERATURES: Record<BotMode, number> = {
  quick: 0.7,
  thoughtful: 0.5,
  programming: 0.3,
};

class AIKeyRotationService {
  private keys: Map<AIModel, AIKeyConfig> = new Map();
  private modeIndexes: Map<BotMode, number> = new Map();
  private maxFailures: number = 3;
  private cooldownPeriod: number = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.initializeKeys();
    this.initializeModeIndexes();
  }

  private initializeKeys(): void {
    Object.entries(MODEL_CONFIGS).forEach(([modelId, config]) => {
      this.keys.set(modelId as AIModel, {
        id: modelId as AIModel,
        provider: config.provider,
        apiKey: process.env[config.envKey] || '',
        model: config.model,
        isActive: true,
        failureCount: 0,
      });
    });
  }

  private initializeModeIndexes(): void {
    this.modeIndexes.set('quick', 0);
    this.modeIndexes.set('thoughtful', 0);
    this.modeIndexes.set('programming', 0);
  }

  public getNextAvailableKey(mode: BotMode): AIKeyConfig | null {
    const rotationSequence = MODE_ROTATION_PRIORITIES[mode];
    const currentIndex = this.modeIndexes.get(mode) || 0;
    const maxAttempts = rotationSequence.length;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const keyId = rotationSequence[(currentIndex + attempt) % maxAttempts];
      const key = this.keys.get(keyId);

      if (!key) {
        continue;
      }

      // Check if key is in cooldown
      if (key.lastFailureTime) {
        const timeSinceFailure = Date.now() - key.lastFailureTime.getTime();
        if (timeSinceFailure < this.cooldownPeriod) {
          continue;
        }
      }

      // Check if key has exceeded max failures
      if (key.failureCount >= this.maxFailures) {
        continue;
      }

      // Check if API key is configured
      if (!key.apiKey) {
        continue;
      }

      return key;
    }

    // All keys are unavailable
    return null;
  }

  public reportKeyFailure(keyId: AIModel, mode: BotMode, error?: Error): void {
    const key = this.keys.get(keyId);
    if (!key) return;

    key.failureCount += 1;
    key.lastFailureTime = new Date();

    // If max failures reached, mark as inactive temporarily
    if (key.failureCount >= this.maxFailures) {
      key.isActive = false;
      console.error(`AI key ${keyId} has exceeded max failures and is temporarily disabled`);
    }

    // Rotate to next key for this mode
    this.rotateToNextKey(mode);
  }

  public reportKeySuccess(keyId: AIModel): void {
    const key = this.keys.get(keyId);
    if (!key) return;

    key.failureCount = 0;
    key.lastFailureTime = undefined;
    key.isActive = true;
  }

  private rotateToNextKey(mode: BotMode): void {
    const currentIndex = this.modeIndexes.get(mode) || 0;
    const rotationSequence = MODE_ROTATION_PRIORITIES[mode];
    this.modeIndexes.set(mode, (currentIndex + 1) % rotationSequence.length);
  }

  public resetKey(keyId: AIModel): void {
    const key = this.keys.get(keyId);
    if (!key) return;

    key.failureCount = 0;
    key.lastFailureTime = undefined;
    key.isActive = true;
  }

  public getKeyStatus(): Record<
    AIModel,
    { isActive: boolean; failureCount: number; provider: AIProvider }
  > {
    const status: Record<
      AIModel,
      { isActive: boolean; failureCount: number; provider: AIProvider }
    > = {} as any;

    this.keys.forEach((key, keyId) => {
      status[keyId] = {
        isActive: key.isActive,
        failureCount: key.failureCount,
        provider: key.provider,
      };
    });

    return status;
  }

  public getCurrentKeyIndex(mode: BotMode): number {
    return this.modeIndexes.get(mode) || 0;
  }

  public getTokenLimit(mode: BotMode): number | null {
    return MODE_TOKEN_LIMITS[mode];
  }

  public getTemperature(mode: BotMode): number {
    return MODE_TEMPERATURES[mode];
  }
}

// Singleton instance
export const aiKeyRotationService = new AIKeyRotationService();
