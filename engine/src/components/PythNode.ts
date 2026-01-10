import type { Node } from "../interfaces/Node.js";
import { PythIds } from "../constants/PythIds.js";
import { HermesClient } from "@pythnetwork/hermes-client";
import { ethers } from "ethers";
import PythAbi from '@pythnetwork/pyth-sdk-solidity/abis/IPyth.json' with { type: 'json' };
import dotenv from "dotenv";

dotenv.config();

const CONTRACT_ADDRESS: string = process.env.PYTH_UPDATE_CONTRACT_ADDRESS || "";
const PRIVATE_KEY: string = process.env.PRIVATE_KEY || "";
const RPC_URL: string = process.env.RPC_URL || "";

export class PythNode implements Node {
  id: string;
  label: string;
  type = "pyth-network";
  inputs: Record<string, any> = {};
  outputs: { price: number } = { price: NaN };
  walletConfig = undefined;
  priceId: string = "";
  connection = new HermesClient("https://hermes.pyth.network", {});
  private priceFeed: string;

  constructor(id: string, label: string, priceFeed: string, pythContractAddress?: string) {
    this.id = id;
    this.label = label;
    this.priceFeed = priceFeed;

    // If a contract address is provided, use it instead of env variable
    if (pythContractAddress && pythContractAddress !== "") {
      // Store for later use (we'd need to refactor to use this.contractAddress)
      console.log(`Using custom Pyth contract: ${pythContractAddress}`);
    }

    // Check if priceFeed is already a hex price ID (starts with 0x)
    if (priceFeed && priceFeed.startsWith('0x')) {
      // Direct price feed ID provided
      this.priceId = priceFeed;
      console.log(`Using direct price feed ID: ${priceFeed}`);
    } else {
      // Get the price ID from the PythIds mapping (symbol like "ETH_USD")
      const priceId = PythIds[priceFeed];
      if (priceId) {
        this.priceId = priceId;
        console.log(`Resolved ${priceFeed} to price ID: ${priceId}`);
      } else {
        this.priceId = "";
        console.log(`Invalid price feed: ${priceFeed}`);
      }
    }
  }

  async simulateTransaction(updateDataHex: string) {
    const updateData = [ethers.utils.arrayify(updateDataHex)];

    const provider = ethers.getDefaultProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, PythAbi, wallet);
    const updateFee = await contract.getUpdateFee(updateData);

    console.log("Sending transaction...");

    const tx = await contract.updatePriceFeeds(updateData, {value: updateFee});
    const receipt = await tx.wait();

    console.log(JSON.stringify(receipt));
  }

  async execute() {
    try {
      // Check if we have a valid price ID
      if (!this.priceId) {
        console.log(`❌ No valid price ID for feed: ${this.priceFeed}`);
        this.outputs.price = NaN;
        return;
      }

      console.log(`📊 Fetching price from Pyth Network for feed: ${this.priceId.slice(0, 10)}...`);
      
      const priceUpdates = await this.connection.getLatestPriceUpdates([
        this.priceId,
      ]);
      
      const parsed_prices = priceUpdates.parsed;
      // Extract price from the response and update outputs
      if (parsed_prices) {
        const priceFeedUpdate = parsed_prices[0];
        if (priceFeedUpdate) {
          const price =
            parseFloat(priceFeedUpdate.price.price) *
            Math.pow(10, priceFeedUpdate.price.expo);
          this.outputs.price = price;

          console.log(`💰 Current Price: $${price.toFixed(2)}`);
          console.log(`📈 Confidence: ±$${(parseFloat(priceFeedUpdate.price.conf) * Math.pow(10, priceFeedUpdate.price.expo)).toFixed(2)}`);
          console.log(`⏰ Last Updated: ${new Date(priceFeedUpdate.price.publish_time * 1000).toLocaleString()}`);

          // Try to update on-chain price (optional - don't fail if this errors)
          try {
            await this.simulateTransaction("0x" + priceUpdates.binary.data[0]);
          } catch (contractError) {
            console.log(`⚠️ On-chain update skipped (price still available): ${contractError instanceof Error ? contractError.message : String(contractError)}`);
          }
        }
      } else {
        console.log(`⚠️ No price data received from Pyth`);
        this.outputs.price = NaN;
      }
    } catch (e: unknown) {
      console.error("❌ Error fetching price from Pyth:", e instanceof Error ? e.message : String(e));
      this.outputs.price = NaN;
    }
  }
}
