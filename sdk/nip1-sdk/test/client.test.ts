/**
 * Additional tests for client SDK coverage
 */

import { NIP1Client } from '../src/client/client';
import { autoPayFetch } from '../src/client/auto-pay';
import { ethers } from 'ethers';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('NIP1Client', () => {
  let client: NIP1Client;
  let mockWallet: any;

  beforeEach(() => {
    mockWallet = {
      sendTransaction: jest.fn().mockResolvedValue({
        hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        wait: jest.fn().mockResolvedValue({
          status: 1
        })
      })
    };

    client = new NIP1Client({
      wallet: mockWallet,
      maxPrice: '1.0',
      autoPay: false
    });

    // Mock axios instance
    (client as any).axios = {
      request: mockedAxios.request
    };

    mockedAxios.request.mockReset();
  });

  it('should GET data without payment when endpoint is free', async () => {
    mockedAxios.request.mockResolvedValue({
      status: 200,
      data: { message: 'free data' },
      headers: {}
    });

    const data = await client.get('http://test.com/free');
    expect(data.message).toBe('free data');
  });

  it('should POST data', async () => {
    mockedAxios.request.mockResolvedValue({
      status: 200,
      data: { success: true },
      headers: {}
    });

    const result = await client.post('http://test.com/api', { value: 123 });
    expect(result.success).toBe(true);
  });

  it('should return cache size', () => {
    expect(client.getCacheSize()).toBe(0);
  });

  it('should clear cache', () => {
    client.clearCache();
    expect(client.getCacheSize()).toBe(0);
  });
});
