import type { Node } from "../interfaces/Node.js";
import type { WalletConfig } from "../interfaces/WalletConfig.js";

/**
 * APY Monitor Node - Fetches real-time APY rates from DeFi protocols
 * Uses DeFiLlama API for real data (primary source)
 * Fallback data only used if API is completely unavailable
 */

interface APYData {
  protocol: string;
  asset: string;
  supplyAPY: number;
  borrowAPY: number;
  tvl: string;
  chain: string;
  pool: string;
}

// Real API endpoint
const DEFILLAMA_API = "https://yields.llama.fi/pools";

// Fallback APY data - only used if DeFiLlama API is completely unavailable
// These are approximate real-world values as of late 2024
const FALLBACK_APY_DATA: Record<string, APYData> = {
  "aave-v3": {
    protocol: "Aave V3",
    asset: "USDC",
    supplyAPY: 4.82,
    borrowAPY: 5.91,
    tvl: "$2.4B",
    chain: "Ethereum",
    pool: "aave-v3-usdc",
  },
  "compound-v3": {
    protocol: "Compound V3",
    asset: "USDC",
    supplyAPY: 6.24,
    borrowAPY: 7.12,
    tvl: "$1.8B",
    chain: "Ethereum",
    pool: "compound-v3-usdc",
  },
  "curve-3pool": {
    protocol: "Curve 3pool",
    asset: "3CRV",
    supplyAPY: 5.15,
    borrowAPY: 0,
    tvl: "$890M",
    chain: "Ethereum",
    pool: "curve-3pool",
  },
  "yearn-usdc": {
    protocol: "Yearn USDC",
    asset: "USDC",
    supplyAPY: 7.82,
    borrowAPY: 0,
    tvl: "$156M",
    chain: "Ethereum",
    pool: "yearn-usdc",
  },
  "morpho-aave": {
    protocol: "Morpho Aave",
    asset: "USDC",
    supplyAPY: 5.67,
    borrowAPY: 6.23,
    tvl: "$420M",
    chain: "Ethereum",
    pool: "morpho-aave-usdc",
  },
};

export class APYMonitorNode implements Node {
  id: string;
  label: string;
  type = "apyMonitor";
  inputs: Record<string, any> = {};
  outputs: Record<string, any> = {
    apyData: [],
    bestProtocol: null,
    bestAPY: 0,
    shouldRebalance: false,
  };
  walletConfig: WalletConfig | undefined;

  private protocols: string[];
  private asset: string;
  private minAPY: number;
  private useRealAPI: boolean;
  private chain: string;

  constructor(
    id: string,
    label: string,
    config: {
      protocols?: string[];
      asset?: string;
      minAPY?: number;
      useRealAPI?: boolean;
      chain?: string;
    },
    walletConfig?: WalletConfig
  ) {
    this.id = id;
    this.label = label;
    this.protocols = config.protocols || ["aave-v3", "compound-v3", "curve-3pool", "yearn-usdc", "morpho-aave"];
    this.asset = config.asset || "USDC";
    this.minAPY = config.minAPY || 0;
    this.useRealAPI = true; // Always try real API first
    this.chain = config.chain || "Ethereum";
    this.walletConfig = walletConfig;
  }

  async execute(): Promise<void> {
    console.log(`\n🔍 [APY Monitor] Scanning DeFi protocols for ${this.asset}...`);

    let apyResults: APYData[] = [];

    // Try real API first
    if (this.useRealAPI) {
      try {
        console.log(`📡 Fetching live APY data from DeFiLlama...`);
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(DEFILLAMA_API, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeout);

        if (response.ok) {
          const data = await response.json();
          
          // Filter for requested asset and high TVL pools
          const filtered = data.data
            .filter((pool: any) => {
              const symbolMatch = pool.symbol?.toUpperCase().includes(this.asset.toUpperCase());
              const chainMatch = !this.chain || pool.chain?.toLowerCase() === this.chain.toLowerCase();
              const hasAPY = pool.apy > 0;
              const hasTVL = pool.tvlUsd > 100000;
              return symbolMatch && hasAPY && hasTVL;
            })
            .sort((a: any, b: any) => b.apy - a.apy)
            .slice(0, 10);

          apyResults = filtered.map((pool: any): APYData => ({
            protocol: pool.project || "Unknown",
            asset: pool.symbol || this.asset,
            supplyAPY: parseFloat((pool.apy || 0).toFixed(2)),
            borrowAPY: parseFloat((pool.apyBorrow || 0).toFixed(2)),
            tvl: pool.tvlUsd > 1e9 
              ? `$${(pool.tvlUsd / 1e9).toFixed(1)}B`
              : `$${(pool.tvlUsd / 1e6).toFixed(1)}M`,
            chain: pool.chain || "Unknown",
            pool: pool.pool || "",
          }));

          console.log(`✅ Found ${apyResults.length} pools from DeFiLlama`);
        }
      } catch (apiError) {
        console.log(`⚠️ DeFiLlama API unavailable, using mock data`);
      }
    }

    // Fallback to cached/approximate data only if API completely fails
    if (apyResults.length === 0) {
      console.log(`⚠️ DeFiLlama API unavailable - using fallback data`);
      
      apyResults = this.protocols
        .filter(p => FALLBACK_APY_DATA[p] !== undefined)
        .map(p => {
          const fallbackData = FALLBACK_APY_DATA[p]!;
          return {
            protocol: fallbackData.protocol,
            asset: fallbackData.asset,
            supplyAPY: fallbackData.supplyAPY,
            borrowAPY: fallbackData.borrowAPY,
            tvl: fallbackData.tvl,
            chain: fallbackData.chain,
            pool: fallbackData.pool,
          };
        });
    }

    // Filter by minimum APY
    const filteredResults = apyResults.filter(r => r.supplyAPY >= this.minAPY);

    // Sort by APY descending
    filteredResults.sort((a, b) => b.supplyAPY - a.supplyAPY);

    // Find best and worst
    const bestProtocol = filteredResults[0];
    const worstProtocol = filteredResults[filteredResults.length - 1];
    const apySpread = bestProtocol 
      ? bestProtocol.supplyAPY - (worstProtocol?.supplyAPY || 0) 
      : 0;

    // Log results
    console.log(`\n📈 APY Results for ${this.asset}:`);
    filteredResults.forEach((r, i) => {
      const marker = i === 0 ? "🏆" : "  ";
      console.log(`${marker} ${r.protocol}: ${r.supplyAPY.toFixed(2)}% APY (TVL: ${r.tvl})`);
    });

    if (bestProtocol) {
      console.log(`\n🎯 Best yield: ${bestProtocol.protocol} at ${bestProtocol.supplyAPY.toFixed(2)}% APY`);
    }

    if (apySpread > 1) {
      console.log(`💡 APY spread: ${apySpread.toFixed(2)}% - Rebalancing opportunity!`);
    }

    // Set outputs
    this.outputs = {
      apyData: filteredResults,
      bestProtocol: bestProtocol?.protocol || null,
      bestAPY: bestProtocol?.supplyAPY || 0,
      worstAPY: worstProtocol?.supplyAPY || 0,
      apySpread,
      protocolCount: filteredResults.length,
      asset: this.asset,
      timestamp: Date.now(),
      shouldRebalance: apySpread > 1,
    };
  }
}
