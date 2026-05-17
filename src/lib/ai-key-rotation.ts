export type AIProvider = 'gemini' | 'groq';
export type AIModel = 'gemini-flash-1' | 'gemini-flash-2' | 'groq-1' | 'groq-2';

export interface AIKeyConfig {
  id: AIModel;
  provider: AIProvider;
  apiKey: string;
  model: string;
  isActive: boolean;
  failureCount: number;
  lastFailureTime?: Date;
}

const KEY_ROTATION_SEQUENCE: AIModel[] = ['gemini-flash-1', 'gemini-flash-2', 'groq-1', 'groq-2'];

class AIKeyRotationService {
  private keys: Map<AIModel, AIKeyConfig> = new Map();
  private currentIndex: number = 0;
  private maxFailures: number = 3;
  private cooldownPeriod: number = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.initializeKeys();
  }

  private initializeKeys(): void {
    const keyConfigs: Omit<AIKeyConfig, 'isActive' | 'failureCount'>[] = [
      {
        id: 'gemini-flash-1',
        provider: 'gemini',
        apiKey: process.env.GEMINI_API_KEY_1 || '',
        model: 'gemini-2.0-flash-exp',
      },
      {
        id: 'gemini-flash-2',
        provider: 'gemini',
        apiKey: process.env.GEMINI_API_KEY_2 || '',
        model: 'gemini-2.0-flash-exp',
      },
      {
        id: 'groq-1',
        provider: 'groq',
        apiKey: process.env.GROK_API_KEY_1 || '',
        model: 'llama-3.3-70b-versatile',
      },
      {
        id: 'groq-2',
        provider: 'groq',
        apiKey: process.env.GROK_API_KEY_2 || '',
        model: 'llama-3.3-70b-versatile',
      },
    ];

    keyConfigs.forEach((config) => {
      this.keys.set(config.id, {
        ...config,
        isActive: true,
        failureCount: 0,
      });
    });
  }

  public getNextAvailableKey(): AIKeyConfig | null {
    const startTime = Date.now();
    const maxAttempts = KEY_ROTATION_SEQUENCE.length;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const keyId = KEY_ROTATION_SEQUENCE[this.currentIndex];
      const key = this.keys.get(keyId);

      if (!key) {
        this.rotateToNextKey();
        continue;
      }

      // Check if key is in cooldown
      if (key.lastFailureTime) {
        const timeSinceFailure = Date.now() - key.lastFailureTime.getTime();
        if (timeSinceFailure < this.cooldownPeriod) {
          this.rotateToNextKey();
          continue;
        }
      }

      // Check if key has exceeded max failures
      if (key.failureCount >= this.maxFailures) {
        this.rotateToNextKey();
        continue;
      }

      // Check if API key is configured
      if (!key.apiKey) {
        this.rotateToNextKey();
        continue;
      }

      return key;
    }

    // All keys are unavailable
    return null;
  }

  public reportKeyFailure(keyId: AIModel, error?: Error): void {
    const key = this.keys.get(keyId);
    if (!key) return;

    key.failureCount += 1;
    key.lastFailureTime = new Date();

    // If max failures reached, mark as inactive temporarily
    if (key.failureCount >= this.maxFailures) {
      key.isActive = false;
      console.error(`AI key ${keyId} has exceeded max failures and is temporarily disabled`);
    }

    // Rotate to next key
    this.rotateToNextKey();
  }

  public reportKeySuccess(keyId: AIModel): void {
    const key = this.keys.get(keyId);
    if (!key) return;

    key.failureCount = 0;
    key.lastFailureTime = undefined;
    key.isActive = true;
  }

  private rotateToNextKey(): void {
    this.currentIndex = (this.currentIndex + 1) % KEY_ROTATION_SEQUENCE.length;
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

  public getCurrentKeyIndex(): number {
    return this.currentIndex;
  }
}

// Singleton instance
export const aiKeyRotationService = new AIKeyRotationService();
