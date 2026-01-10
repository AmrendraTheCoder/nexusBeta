import type { Node } from "../interfaces/Node.js";
import { ethers } from "ethers";

// Registry ABI (minimal for querying)
const REGISTRY_ABI = [
  "function getServicesByCategory(string category) view returns (address[] providers, uint256[] prices, uint256[] reputations)",
  "function getServiceDetails(address provider) view returns (string endpoint, uint256 priceInWei, string category, uint256 reputation, uint256 totalCalls, bool active)",
  "function getActiveProviders() view returns (address[])"
];

/**
 * RegistryQueryNode - Query on-chain service registry
 * 
 * This node queries the NexusRegistry contract to find
 * available data providers by category, price, or reputation.
 */
export class RegistryQueryNode implements Node {
  id: string;
  label: string;
  type: string = "registryQuery";
  inputs: Record<string, any>;
  outputs: Record<string, any> = {};
  walletConfig = undefined;

  // Configuration
  category: string;
  maxPrice: string;
  chainId: number;
  registryAddress: string;

  // RPC URLs
  private static RPC_URLS: Record<number, string> = {
    240: "https://testnet.zkevm.cronos.org",
    84532: "https://sepolia.base.org",
    80002: "https://rpc-amoy.polygon.technology",
    11155111: "https://rpc.sepolia.org"
  };

  constructor(
    id: string,
    label: string,
    category: string = "news",
    maxPrice: string = "1000000000000000000", // 1 token default
    chainId: number = 240,
    registryAddress: string = "0xe821fAbc3d23790596669043b583e931d8fC2710" // Default to deployed Cronos zkEVM Testnet address
  ) {
    this.id = id;
    this.label = label;
    this.category = category;
    this.maxPrice = maxPrice;
    this.chainId = chainId;
    this.registryAddress = registryAddress;
    this.inputs = { activate: true };
  }

  async execute(): Promise<void> {
    console.log(`[REGISTRY QUERY] Querying registry for category: ${this.category}`);

    try {
      if (!this.registryAddress || this.registryAddress === "0x0000000000000000000000000000000000000000") {
        // If no registry address, try to query anyway but warn
        console.log(`[REGISTRY QUERY] No valid registry address - attempting query anyway`);
      }

      const rpcUrl = RegistryQueryNode.RPC_URLS[this.chainId];
      if (!rpcUrl) {
        throw new Error(`Unsupported chain ID: ${this.chainId}`);
      }

      const provider = new (ethers as any).JsonRpcProvider(rpcUrl);
      const registry = new (ethers as any).Contract(this.registryAddress, REGISTRY_ABI, provider);

      // Query services by category
      const [providers, prices, reputations] = await registry.getServicesByCategory(this.category);

      const maxPriceBigInt = BigInt(this.maxPrice);
      const services = [];

      for (let i = 0; i < providers.length; i++) {
        const priceBigInt = BigInt(prices[i]);
        
        // Filter by max price
        if (priceBigInt <= maxPriceBigInt) {
          // Get full details
          const details = await registry.getServiceDetails(providers[i]);
          
          services.push({
            provider: providers[i],
            endpoint: details.endpoint,
            price: prices[i].toString(),
            priceFormatted: (ethers as any).formatEther(prices[i]),
            category: details.category,
            reputation: Number(reputations[i]),
            totalCalls: Number(details.totalCalls),
            active: details.active
          });
        }
      }

      // Sort by reputation (highest first)
      services.sort((a, b) => b.reputation - a.reputation);

      console.log(`[REGISTRY QUERY] Found ${services.length} services from on-chain registry`);
      this.outputs.services = services;
      this.outputs.count = services.length;
      this.outputs.source = "blockchain";

    } catch (error: any) {
      console.error(`[REGISTRY QUERY] On-chain query failed:`, error.message);
      console.log(`[REGISTRY QUERY] Using fallback service data`);
      // Return fallback data on error - these are real service endpoints
      this.outputs.services = this.getFallbackServices();
      this.outputs.error = error.message;
      this.outputs.source = "fallback";
    }
  }

  private getFallbackServices() {
    // Fallback services - real endpoints that can be used for demo
    const fallbackServices: Record<string, any[]> = {
      news: [
        {
          provider: "0x742d35Cc6634C0532925a3b844Bc9e7595f5e123",
          endpoint: "http://localhost:4000/api/news/crypto",
          price: "100000000000000000",
          priceFormatted: "0.1",
          category: "news",
          reputation: 234,
          totalCalls: 567,
          active: true
        }
      ],
      sentiment: [
        {
          provider: "0x742d35Cc6634C0532925a3b844Bc9e7595f5e123",
          endpoint: "http://localhost:4000/api/sentiment/btc",
          price: "200000000000000000",
          priceFormatted: "0.2",
          category: "sentiment",
          reputation: 189,
          totalCalls: 432,
          active: true
        }
      ],
      charts: [
        {
          provider: "0x742d35Cc6634C0532925a3b844Bc9e7595f5e123",
          endpoint: "http://localhost:4000/api/charts/btc/1h",
          price: "300000000000000000",
          priceFormatted: "0.3",
          category: "charts",
          reputation: 156,
          totalCalls: 321,
          active: true
        }
      ],
      defi: [
        {
          provider: "0x742d35Cc6634C0532925a3b844Bc9e7595f5e123",
          endpoint: "http://localhost:4000/api/defi/yields",
          price: "250000000000000000",
          priceFormatted: "0.25",
          category: "defi",
          reputation: 145,
          totalCalls: 289,
          active: true
        }
      ],
      predictions: [
        {
          provider: "0x742d35Cc6634C0532925a3b844Bc9e7595f5e123",
          endpoint: "http://localhost:4000/api/predictions/btc",
          price: "1000000000000000000",
          priceFormatted: "1.0",
          category: "predictions",
          reputation: 78,
          totalCalls: 145,
          active: true
        }
      ]
    };

    return fallbackServices[this.category] || [];
  }
}
