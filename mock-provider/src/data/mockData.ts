/**
 * Mock data for all API endpoints
 * Simulates realistic responses from various data providers
 */

// ============ NEWS DATA ============
export const cryptoNews = [
  {
    id: 1,
    title: "Bitcoin Surges Past $100K as Institutional Adoption Accelerates",
    source: "CryptoDaily",
    timestamp: new Date().toISOString(),
    sentiment: "bullish",
    summary: "Major financial institutions announce new Bitcoin custody solutions.",
  },
  {
    id: 2,
    title: "Ethereum 2.0 Staking Rewards Hit New High",
    source: "DeFiPulse",
    timestamp: new Date().toISOString(),
    sentiment: "bullish",
    summary: "ETH staking yields reach 5.2% APY as network activity increases.",
  },
  {
    id: 3,
    title: "Cronos zkEVM Launches Developer Incentive Program",
    source: "BlockchainNews",
    timestamp: new Date().toISOString(),
    sentiment: "bullish",
    summary: "Cronos announces $10M fund for developers building on zkEVM.",
  },
];

export const stockNews = [
  {
    id: 1,
    title: "Tech Stocks Rally on AI Optimism",
    source: "MarketWatch",
    timestamp: new Date().toISOString(),
    sentiment: "bullish",
    summary: "NVIDIA and Microsoft lead gains as AI spending forecasts increase.",
  },
  {
    id: 2,
    title: "Federal Reserve Signals Rate Pause",
    source: "Reuters",
    timestamp: new Date().toISOString(),
    sentiment: "neutral",
    summary: "Fed officials hint at maintaining current rates through Q1.",
  },
];

// ============ SENTIMENT DATA ============
export const btcSentiment = {
  symbol: "BTC",
  fearGreedIndex: 72,
  classification: "Greed",
  socialVolume: 125000,
  socialSentiment: 0.68,
  twitterMentions: 45000,
  redditActivity: 8500,
  timestamp: new Date().toISOString(),
};

export const ethSentiment = {
  symbol: "ETH",
  fearGreedIndex: 65,
  classification: "Greed",
  socialVolume: 89000,
  socialSentiment: 0.62,
  twitterMentions: 32000,
  redditActivity: 6200,
  timestamp: new Date().toISOString(),
};

// ============ CHART DATA ============
function generateCandlesticks(symbol: string, interval: string, count: number = 24) {
  const candles = [];
  let basePrice = symbol === "BTC" ? 102500 : 3850;
  const now = Date.now();
  const intervalMs = interval === "1h" ? 3600000 : 86400000;

  for (let i = count - 1; i >= 0; i--) {
    const volatility = basePrice * 0.02;
    const open = basePrice + (Math.random() - 0.5) * volatility;
    const close = open + (Math.random() - 0.5) * volatility;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    const volume = Math.floor(Math.random() * 1000000) + 500000;

    candles.push({
      timestamp: now - i * intervalMs,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
    });

    basePrice = close;
  }

  return candles;
}

export const btc1hChart = generateCandlesticks("BTC", "1h");
export const eth1dChart = generateCandlesticks("ETH", "1d");

// ============ ON-CHAIN DATA ============
export const whaleAlerts = [
  {
    id: 1,
    type: "transfer",
    amount: "1500 BTC",
    valueUsd: 153750000,
    from: "Unknown Wallet",
    to: "Binance",
    timestamp: new Date(Date.now() - 300000).toISOString(),
    significance: "high",
  },
  {
    id: 2,
    type: "transfer",
    amount: "25000 ETH",
    valueUsd: 96250000,
    from: "Coinbase",
    to: "Unknown Wallet",
    timestamp: new Date(Date.now() - 1200000).toISOString(),
    significance: "high",
  },
  {
    id: 3,
    type: "mint",
    amount: "5000000 USDC",
    valueUsd: 5000000,
    from: "Circle Treasury",
    to: "Circle",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    significance: "medium",
  },
];

export const gasEstimate = {
  chains: {
    ethereum: { low: 25, average: 35, high: 50, unit: "gwei" },
    cronos: { low: 2000, average: 5000, high: 10000, unit: "wei" },
    polygon: { low: 50, average: 100, high: 200, unit: "gwei" },
    base: { low: 0.001, average: 0.005, high: 0.01, unit: "gwei" },
  },
  recommendation: "Medium priority suggested for non-urgent transactions",
  timestamp: new Date().toISOString(),
};

// ============ DEFI DATA ============
export const defiYields = [
  { protocol: "Aave V3", chain: "Ethereum", asset: "USDC", apy: 4.52, tvl: 8500000000 },
  { protocol: "Compound", chain: "Ethereum", asset: "USDT", apy: 3.89, tvl: 2100000000 },
  { protocol: "VVS Finance", chain: "Cronos", asset: "CRO-USDC LP", apy: 12.45, tvl: 45000000 },
  { protocol: "Curve", chain: "Ethereum", asset: "3Pool", apy: 2.15, tvl: 1200000000 },
  { protocol: "GMX", chain: "Arbitrum", asset: "GLP", apy: 18.5, tvl: 450000000 },
];

export const defiTvl = [
  { protocol: "Lido", tvl: 32500000000, change24h: 2.3 },
  { protocol: "Aave", tvl: 12800000000, change24h: -0.5 },
  { protocol: "MakerDAO", tvl: 8200000000, change24h: 1.1 },
  { protocol: "Uniswap", tvl: 5600000000, change24h: 3.2 },
  { protocol: "Curve", tvl: 2100000000, change24h: -1.8 },
];

// ============ NFT DATA ============
export const trendingNfts = [
  { collection: "Bored Ape Yacht Club", floorPrice: 28.5, floorCurrency: "ETH", volume24h: 1250, change24h: 5.2 },
  { collection: "CryptoPunks", floorPrice: 52.0, floorCurrency: "ETH", volume24h: 890, change24h: -2.1 },
  { collection: "Azuki", floorPrice: 8.2, floorCurrency: "ETH", volume24h: 620, change24h: 12.5 },
  { collection: "Pudgy Penguins", floorPrice: 11.8, floorCurrency: "ETH", volume24h: 480, change24h: 8.7 },
];

// ============ AI PREDICTIONS ============
export const btcPrediction = {
  symbol: "BTC",
  currentPrice: 102500,
  predictions: {
    "24h": { price: 104200, confidence: 0.72, direction: "up" },
    "7d": { price: 108500, confidence: 0.58, direction: "up" },
    "30d": { price: 115000, confidence: 0.45, direction: "up" },
  },
  signals: {
    rsi: { value: 62, signal: "neutral" },
    macd: { value: 1250, signal: "bullish" },
    movingAverage: { value: 98500, signal: "bullish" },
  },
  generatedAt: new Date().toISOString(),
  disclaimer: "This is simulated data for demonstration purposes only.",
};
