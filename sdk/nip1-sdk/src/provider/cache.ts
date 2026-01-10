/**
 * Payment cache to prevent replay attacks
 */

export class PaymentCache {
  private cache: Map<string, number>;
  private ttl: number;

  /**
   * @param ttl Time to live in milliseconds (default: 5 minutes)
   */
  constructor(ttl: number = 5 * 60 * 1000) {
    this.cache = new Map();
    this.ttl = ttl;
    
    // Start cleanup interval
    setInterval(() => this.cleanup(), 60000); // Cleanup every minute
  }

  /**
   * Check if a payment has been used
   */
  has(txHash: string): boolean {
    const timestamp = this.cache.get(txHash);
    if (!timestamp) {
      return false;
    }

    // Check if expired
    if (Date.now() - timestamp > this.ttl) {
      this.cache.delete(txHash);
      return false;
    }

    return true;
  }

  /**
   * Add a payment to the cache
   */
  add(txHash: string): void {
    this.cache.set(txHash, Date.now());
  }

  /**
   * Remove a payment from cache
   */
  remove(txHash: string): void {
    this.cache.delete(txHash);
  }

  /**
   * Clear all cached payments
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [txHash, timestamp] of this.cache.entries()) {
      if (now - timestamp > this.ttl) {
        this.cache.delete(txHash);
      }
    }
  }
}
