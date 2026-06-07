type AIProvider = 'gemini' | 'groq';
type AIModel = 'model-1' | 'model-2' | 'model-3' | 'model-4';
type BotMode = 'quick' | 'thoughtful' | 'programming';

interface AIKeyConfig {
  id: AIModel;
  provider: AIProvider;
  apiKey: string;
  model: string;
  isActive: boolean;
  failureCount: number;
  lastFailureTime?: Date;
}

interface AIKeyStatus {
  id: AIModel;
  provider: AIProvider;
  isActive: boolean;
  failureCount: number;
  lastFailureTime?: Date;
}

const MODEL_CONFIGS: Record<AIModel, { provider: AIProvider; model: string; envKey: string }> = {
  'model-1': { provider: 'gemini', model: 'gemini-1.5-flash', envKey: 'GEMINI_API_KEY_1' },
  'model-2': { provider: 'gemini', model: 'gemini-1.5-flash', envKey: 'GEMINI_API_KEY_2' },
  'model-3': { provider: 'groq', model: 'llama-3.1-8b-instant', envKey: 'GROQ_API_KEY_1' },
  'model-4': { provider: 'groq', model: 'gemma2-9b-it', envKey: 'GROQ_API_KEY_2' },
};

const MODE_ROTATION_PRIORITIES: Record<BotMode, AIModel[]> = {
  quick: ['model-3', 'model-4', 'model-1', 'model-2'], // Groq first, then Gemini
  thoughtful: ['model-3', 'model-4', 'model-1', 'model-2'], // Groq first, then Gemini
  programming: ['model-3', 'model-4', 'model-1', 'model-2'], // Groq first, then Gemini
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
  private maxFailures: number = 5;
  private cooldownPeriod: number = 2 * 60 * 1000; // 2 minutes

  constructor() {
    this.initializeModeIndexes();
  }

  private initializeKeys(): void {
    Object.entries(MODEL_CONFIGS).forEach(([modelId, config]) => {
      const apiKey = process.env[config.envKey] || '';
      console.log(`=== Initializing ${modelId} ===`);
      console.log(`Env key: ${config.envKey}`);
      console.log(`API key exists: ${!!apiKey}`);
      console.log(`API key length: ${apiKey.length}`);

      this.keys.set(modelId as AIModel, {
        id: modelId as AIModel,
        provider: config.provider,
        apiKey,
        model: config.model,
        isActive: true,
        failureCount: 0,
      });
    });
  }

  private ensureKeysInitialized(): void {
    if (this.keys.size === 0) {
      this.initializeKeys();
    }
  }

  private initializeModeIndexes(): void {
    this.modeIndexes.set('quick', 0);
    this.modeIndexes.set('thoughtful', 0);
    this.modeIndexes.set('programming', 0);
  }

  public getNextAvailableKey(mode: BotMode): AIKeyConfig | null {
    this.ensureKeysInitialized();
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
          console.log(`Key ${keyId} is in cooldown (${Math.round(timeSinceFailure / 1000)}s / ${this.cooldownPeriod / 1000}s)`);
          continue;
        }
      }

      // Check if key has exceeded max failures
      if (key.failureCount >= this.maxFailures) {
        console.log(`Key ${keyId} has exceeded max failures (${key.failureCount}/${this.maxFailures})`);
        continue;
      }

      // Check if API key is configured
      if (!key.apiKey) {
        console.log(`Key ${keyId} has no API key configured`);
        continue;
      }

      console.log(`Selected key: ${keyId} (${key.provider} - ${key.model})`);
      return key;
    }

    // All keys are unavailable
    console.error('All keys are unavailable for mode:', mode);
    return null;
  }

  public reportKeyFailure(keyId: AIModel, mode: BotMode, error?: Error): void {
    const key = this.keys.get(keyId);
    if (!key) return;

    key.failureCount += 1;
    key.lastFailureTime = new Date();

    const errorMessage = error?.message || 'Unknown error';
    const isRateLimitError = errorMessage.toLowerCase().includes('rate limit') ||
                            errorMessage.toLowerCase().includes('429') ||
                            errorMessage.toLowerCase().includes('quota');

    console.error(`Key ${keyId} failed (attempt ${key.failureCount}/${this.maxFailures}):`, errorMessage);
    if (isRateLimitError) {
      console.warn(`Rate limit detected for ${key.provider} (${keyId})`);
    }

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
    console.log(`Key ${keyId} succeeded, reset failure count`);
  }

  private rotateToNextKey(mode: BotMode): void {
    const currentIndex = this.modeIndexes.get(mode) || 0;
    const rotationSequence = MODE_ROTATION_PRIORITIES[mode];
    this.modeIndexes.set(mode, (currentIndex + 1) % rotationSequence.length);
    console.log(`Rotated to next key for ${mode}: index ${(currentIndex + 1) % rotationSequence.length}`);
  }

  public resetKey(keyId: AIModel): void {
    const key = this.keys.get(keyId);
    if (!key) return;

    key.failureCount = 0;
    key.lastFailureTime = undefined;
    key.isActive = true;
    console.log(`Key ${keyId} has been reset`);
  }

  public getKeyStatus(): Record<AIModel, AIKeyStatus> {
    const status: Record<AIModel, AIKeyStatus> = {} as Record<AIModel, AIKeyStatus>;
    this.keys.forEach((key, id) => {
      status[id] = {
        id: key.id,
        provider: key.provider,
        isActive: key.isActive,
        failureCount: key.failureCount,
        lastFailureTime: key.lastFailureTime,
      };
    });
    return status;
  }

  public getTemperature(mode: BotMode): number {
    return MODE_TEMPERATURES[mode];
  }

  public getTokenLimit(mode: BotMode): number | null {
    return MODE_TOKEN_LIMITS[mode];
  }
}

// Singleton instance
const aiKeyRotationService = new AIKeyRotationService();

export { aiKeyRotationService, MODEL_CONFIGS, MODE_ROTATION_PRIORITIES };
export type { AIKeyConfig, AIKeyStatus, AIModel, AIProvider, BotMode };
