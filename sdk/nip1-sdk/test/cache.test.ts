/**
 * Tests for PaymentCache
 */

import { PaymentCache } from '../src/provider/cache';

describe('PaymentCache', () => {
  let cache: PaymentCache;

  beforeEach(() => {
    cache = new PaymentCache(1000); // 1 second TTL for testing
  });

  afterEach(() => {
    cache.clear();
  });

  it('should initialize with empty cache', () => {
    expect(cache.size()).toBe(0);
    expect(cache.has('0x123')).toBe(false);
  });

  it('should add payment to cache', () => {
    cache.add('0x123');
    expect(cache.has('0x123')).toBe(true);
    expect(cache.size()).toBe(1);
  });

  it('should return false for non-existent payment', () => {
    expect(cache.has('0xnonexistent')).toBe(false);
  });

  it('should remove payment from cache', () => {
    cache.add('0x123');
    expect(cache.has('0x123')).toBe(true);

    cache.remove('0x123');
    expect(cache.has('0x123')).toBe(false);
    expect(cache.size()).toBe(0);
  });

  it('should clear all payments', () => {
    cache.add('0x123');
    cache.add('0x456');
    cache.add('0x789');
    expect(cache.size()).toBe(3);

    cache.clear();
    expect(cache.size()).toBe(0);
    expect(cache.has('0x123')).toBe(false);
  });

  it('should expire old payments', async () => {
    cache.add('0x123');
    expect(cache.has('0x123')).toBe(true);

    // Wait for TTL to expire
    await new Promise(resolve => setTimeout(resolve, 1100));

    expect(cache.has('0x123')).toBe(false);
  });

  it('should handle multiple payments', () => {
    const txHashes = [
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321'
    ];

    txHashes.forEach(hash => cache.add(hash));
    expect(cache.size()).toBe(3);

    txHashes.forEach(hash => {
      expect(cache.has(hash)).toBe(true);
    });
  });

  it('should not add duplicate payments', () => {
    cache.add('0x123');
    cache.add('0x123');
    cache.add('0x123');

    // Size should still be 1 (Map doesn't duplicate keys)
    expect(cache.size()).toBe(1);
  });

  it('should handle rapid additions and removals', () => {
    for (let i = 0; i < 100; i++) {
      cache.add(`0x${i.toString().padStart(64, '0')}`);
    }

    expect(cache.size()).toBe(100);

    for (let i = 0; i < 50; i++) {
      cache.remove(`0x${i.toString().padStart(64, '0')}`);
    }

    expect(cache.size()).toBe(50);
  });

  it('should use custom TTL', async () => {
    const customCache = new PaymentCache(500); // 0.5 second TTL
    customCache.add('0x123');

    expect(customCache.has('0x123')).toBe(true);

    await new Promise(resolve => setTimeout(resolve, 600));

    expect(customCache.has('0x123')).toBe(false);
  });
});
