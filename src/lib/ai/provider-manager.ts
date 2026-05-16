import { groqRequest } from './groq-provider';
import { geminiRequest } from './gemini-provider';
import type { AIRequest, AIResponse } from './types';

type ProviderKey = {
  id: string; // unique id
  key: string;
  provider: 'groq' | 'gemini';
  failedUntil?: number; // timestamp ms
  failureCount?: number;
};

export class ProviderManager {
  private keys: ProviderKey[] = [];
  private COOLDOWN_MIN = 5 * 60 * 1000; // 5 minutes
  private COOLDOWN_MAX = 15 * 60 * 1000; // 15 minutes

  constructor(groqKeys: string[], geminiKeys: string[]) {
    // Priority: Groq1, Groq2, Gemini1, Gemini2
    groqKeys.forEach((k, i) => this.keys.push({ id: `groq-${i+1}`, key: k, provider: 'groq' }));
    geminiKeys.forEach((k, i) => this.keys.push({ id: `gemini-${i+1}`, key: k, provider: 'gemini' }));

    if (this.keys.length === 0) {
      console.warn('ProviderManager: no API keys configured for Groq or Gemini');
    }
  }

  private now() { return Date.now(); }

  private isHealthy(pk: ProviderKey) {
    return !pk.failedUntil || pk.failedUntil <= this.now();
  }

  private markFailure(pk: ProviderKey) {
    pk.failureCount = (pk.failureCount || 0) + 1;
    const cooldown = this.COOLDOWN_MIN + Math.floor(Math.random() * (this.COOLDOWN_MAX - this.COOLDOWN_MIN));
    pk.failedUntil = this.now() + cooldown;
    console.warn(`ProviderManager: marking ${pk.id} failed for ${Math.round(cooldown/1000)}s`);
  }

  private markSuccess(pk: ProviderKey) {
    pk.failureCount = 0;
    pk.failedUntil = undefined;
  }

  private async tryKey(pk: ProviderKey, req: AIRequest): Promise<AIResponse> {
    if (!pk || !this.isHealthy(pk)) throw new Error('Key unavailable');
    try {
      if (pk.provider === 'groq') {
        const res = await groqRequest(pk.key, req);
        this.markSuccess(pk);
        return res;
      } else {
        const res = await geminiRequest(pk.key, req);
        this.markSuccess(pk);
        return res;
      }
    } catch (err) {
      console.error(`ProviderManager: error with ${pk.id}:`, err instanceof Error ? err.message : err);
      this.markFailure(pk);
      throw err;
    }
  }

  // Main method: tries keys in order with failover
  async request(req: AIRequest): Promise<AIResponse> {
    // iterate over keys in configured order
    for (const pk of this.keys) {
      if (!pk.key) continue;
      if (!this.isHealthy(pk)) continue;
      try {
        return await this.tryKey(pk, req);
      } catch (e) {
        // try next
        continue;
      }
    }

    // If all keys failed, attempt retry after checking any cooled down ones quickly
    for (const pk of this.keys) {
      if (!pk.key) continue;
      try {
        return await this.tryKey(pk, req);
      } catch (err) {
        continue;
      }
    }

    throw new Error('All AI providers failed');
  }
}

// Factory to create manager from env
export function createProviderManagerFromEnv() {
  const groqKeys = [process.env.GROQ_API_KEY_1, process.env.GROQ_API_KEY_2].filter(Boolean) as string[];
  const geminiKeys = [process.env.GEMINI_API_KEY_1, process.env.GEMINI_API_KEY_2].filter(Boolean) as string[];
  return new ProviderManager(groqKeys, geminiKeys);
}
