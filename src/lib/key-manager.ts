/**
 * Key Management Fallback System
 * Implements circular key rotation with health monitoring
 */

interface KeyConfig {
  id: string;
  value: string;
  expiresAt: Date;
  status: 'active' | 'failed' | 'cooldown';
  lastUsed: Date;
  failureCount: number;
  cooldownUntil: Date;
}

export class KeyManager {
  private keys: KeyConfig[] = [];
  private currentIndex: number = 0;
  private readonly COOLDOWN_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_FAILURES = 3;

  constructor(keys: string[]) {
    if (keys.length === 0) {
      console.warn('Warning: KeyManager initialized with no keys');
    }
    
    this.keys = keys.map((value, index) => ({
      id: `key-${index + 1}`,
      value,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      status: 'active' as const,
      lastUsed: new Date(),
      failureCount: 0,
      cooldownUntil: new Date(0),
    }));
  }

  /**
   * Get the current active key
   * Automatically rotates if current key is failed or in cooldown
   * Returns null if no keys are available and logs a warning
   */
  getActiveKey(): string | null {
    if (this.keys.length === 0) {
      console.warn('Warning: No keys available in KeyManager');
      return null;
    }
    
    const now = new Date();
    
    // Check if current key needs rotation
    const currentKey = this.keys[this.currentIndex];
    if (currentKey.status === 'failed' || 
        currentKey.cooldownUntil > now ||
        currentKey.expiresAt < now) {
      this.rotateToNextKey();
    }
    
    const activeKey = this.keys[this.currentIndex];
    return activeKey ? activeKey.value : null;
  }

  /**
   * Rotate to the next available key in circular sequence
   * Returns null if no available keys; logs a warning instead of throwing
   */
  private rotateToNextKey(): void {
    const now = new Date();
    let attempts = 0;
    const maxAttempts = this.keys.length;

    while (attempts < maxAttempts) {
      this.currentIndex = (this.currentIndex + 1) % this.keys.length;
      const nextKey = this.keys[this.currentIndex];

      // Check if key is available
      if (nextKey.status === 'active' && 
          nextKey.cooldownUntil <= now &&
          nextKey.expiresAt > now) {
        console.log(`Rotated to ${nextKey.id}`);
        return;
      }

      attempts++;
    }

    console.warn('Warning: All keys are expired or in cooldown. Attempting to use first key regardless.');
    // Instead of throwing, reset to first key and allow the error to propagate at the API call level
    this.currentIndex = 0;
  }

  /**
   * Report key failure and trigger rotation if necessary
   * Issues warning instead of throwing critical errors
   */
  reportFailure(error: Error): void {
    if (this.keys.length === 0) {
      console.warn('Warning: Cannot report failure - no keys in manager');
      return;
    }
    
    const currentKey = this.keys[this.currentIndex];
    currentKey.failureCount++;
    currentKey.lastUsed = new Date();

    // Determine if rotation is needed
    if (this.isCriticalFailure(error) || 
        currentKey.failureCount >= this.MAX_FAILURES) {
      currentKey.status = 'failed';
      currentKey.cooldownUntil = new Date(Date.now() + this.COOLDOWN_DURATION);
      console.error(`Key ${currentKey.id} failed: ${error.message}`);
      
      try {
        this.rotateToNextKey();
      } catch (rotationError) {
        console.warn('Warning: Key rotation failed - all keys may be unavailable', rotationError);
      }
    }
  }

  /**
   * Determine if error is critical and requires immediate rotation
   */
  private isCriticalFailure(error: Error): boolean {
    const criticalPatterns = [
      '401', '403', // Authentication errors
      '429', // Rate limit
      'quota', 'limit', 'exceeded'
    ];
    
    return criticalPatterns.some(pattern => 
      error.message.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  /**
   * Mark key as healthy and reset failure count
   */
  reportSuccess(): void {
    if (this.keys.length === 0) {
      console.warn('Warning: Cannot report success - no keys in manager');
      return;
    }
    
    const currentKey = this.keys[this.currentIndex];
    currentKey.status = 'active';
    currentKey.failureCount = 0;
    currentKey.lastUsed = new Date();
  }

  /**
   * Get status of all keys for monitoring
   */
  getKeyStatus(): KeyConfig[] {
    return this.keys.map(key => ({
      ...key,
      value: '***REDACTED***' // Hide actual values
    }));
  }
}
