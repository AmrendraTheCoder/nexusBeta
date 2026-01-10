import React from "react";
import { X } from "lucide-react";
import { PYTH_SYMBOLS } from "../constants/pythSymbols";
import { tokens, base_tokens } from "../constants/tokenMappings";

export default function SettingsPanel({ node, onUpdateNode, onDeselect }) {
  if (!node) return null;

  // Helper function to convert amount with decimals
  const convertAmountWithDecimals = (amount, tokenAddress) => {
    if (!amount || amount === "") return "0";
    const token = Object.values(tokens).find((t) => t.address === tokenAddress);
    const decimals = token ? token.decimal : 18; // default to 18 if token not found
    const multiplier = Math.pow(10, decimals);
    return (parseFloat(amount) * multiplier).toString();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Handle amount conversion for swap nodes
    if (node.data.type === "swap" && name === "amountIn") {
      const tokenInAddress = node.data.node_data?.tokenIn;
      processedValue = convertAmountWithDecimals(value, tokenInAddress);
    }

    const updatedData = {
      ...node.data,
      node_data: {
        ...node.data.node_data,
        [name]: processedValue,
      },
    };
    onUpdateNode(node.id, updatedData);
  };

  const handleLabelChange = (e) => {
    onUpdateNode(node.id, { ...node.data, label: e.target.value });
  };

  const renderSettings = () => {
    switch (node.data.type) {
      case "pyth-network":
        return (
          <div className="flex flex-col gap-2">
            <label htmlFor="symbol" className="font-semibold">
              Symbol
            </label>
            <select
              id="symbol"
              name="symbol"
              value={node.data.node_data?.symbol || "BTC_USD"}
              onChange={handleInputChange}
              className="p-2 border rounded"
            >
              {PYTH_SYMBOLS.map((symbol) => (
                <option key={symbol.value} value={symbol.value}>
                  {symbol.label}
                </option>
              ))}
            </select>
          </div>
        );
      case "condition":
        return (
          <div className="flex flex-col gap-2">
            <label htmlFor="condition" className="font-semibold">
              Condition
            </label>
            <input
              id="condition"
              name="condition"
              value={node.data.node_data?.condition || ""}
              onChange={handleInputChange}
              className="p-2 border rounded"
              placeholder="e.g., price > 100000"
            />
          </div>
        );
      case "limitOrder":
        return (
          <div className="flex flex-col gap-4">
            <div>
              <label htmlFor="makerToken" className="font-semibold">
                Maker Token (Token you want to sell)
              </label>
              <select
                id="makerToken"
                name="makerToken"
                value={node.data.node_data?.makerToken || ""}
                onChange={handleInputChange}
                className="p-2 border rounded w-full mt-1"
              >
                <option value="">Select Token</option>
                {Object.entries(base_tokens).map(([symbol, token]) => (
                  <option key={token.address} value={token.address}>
                    {symbol} ({token.address.slice(0, 6)}...
                    {token.address.slice(-4)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="takerToken" className="font-semibold">
                Taker Token (Token you want to buy)
              </label>
              <select
                id="takerToken"
                name="takerToken"
                value={node.data.node_data?.takerToken || ""}
                onChange={handleInputChange}
                className="p-2 border rounded w-full mt-1"
              >
                <option value="">Select Token</option>
                {Object.entries(base_tokens).map(([symbol, token]) => (
                  <option key={token.address} value={token.address}>
                    {symbol} ({token.address.slice(0, 6)}...
                    {token.address.slice(-4)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="makingAmount" className="font-semibold">
                Making Amount (Amount to sell)
              </label>
              <input
                id="makingAmount"
                name="makingAmount"
                value={node.data.node_data?.makingAmount || ""}
                onChange={handleInputChange}
                className="p-2 border rounded w-full mt-1"
                placeholder="e.g., 1000"
                required
              />
            </div>
            <div>
              <label htmlFor="takingAmount" className="font-semibold">
                Taking Amount (Minimum amount to receive)
              </label>
              <input
                id="takingAmount"
                name="takingAmount"
                value={node.data.node_data?.takingAmount || ""}
                onChange={handleInputChange}
                className="p-2 border rounded w-full mt-1"
                placeholder="e.g., 900"
                required
              />
            </div>
          </div>
        );
      case "queryBalance":
        return (
          <div className="flex flex-col gap-4">
            <div>
              <label htmlFor="tokenAddress" className="font-semibold">
                Token Address
              </label>
              <select
                id="tokenAddress"
                name="tokenAddress"
                value={node.data.node_data?.tokenAddress || ""}
                onChange={handleInputChange}
                className="p-2 border rounded w-full mt-1"
              >
                <option value="">Native ETH</option>
                {Object.entries(tokens).map(([symbol, token]) => (
                  <option key={token.address} value={token.address}>
                    {symbol} ({token.address.slice(0, 6)}...
                    {token.address.slice(-4)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="walletAddress" className="font-semibold">
                Wallet Address
              </label>
              <input
                id="walletAddress"
                name="walletAddress"
                value={node.data.node_data?.walletAddress || ""}
                onChange={handleInputChange}
                className="p-2 border rounded w-full mt-1"
                placeholder="0x... (leave empty to use connected wallet)"
              />
            </div>
          </div>
        );
      case "swap":
        return (
          <div className="flex flex-col gap-4">
            <div>
              <label htmlFor="tokenIn" className="font-semibold">
                Token In
              </label>
              <select
                id="tokenIn"
                name="tokenIn"
                value={node.data.node_data?.tokenIn || tokens.USDC.address}
                onChange={handleInputChange}
                className="p-2 border rounded w-full mt-1"
              >
                {Object.entries(tokens).map(([symbol, token]) => (
                  <option key={token.address} value={token.address}>
                    {symbol} ({token.address.slice(0, 6)}...
                    {token.address.slice(-4)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="tokenOut" className="font-semibold">
                Token Out
              </label>
              <select
                id="tokenOut"
                name="tokenOut"
                value={node.data.node_data?.tokenOut || tokens.USDT.address}
                onChange={handleInputChange}
                className="p-2 border rounded w-full mt-1"
              >
                {Object.entries(tokens).map(([symbol, token]) => (
                  <option key={token.address} value={token.address}>
                    {symbol} ({token.address.slice(0, 6)}...
                    {token.address.slice(-4)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="amountIn" className="font-semibold">
                Amount In (will be converted with decimals)
              </label>
              <input
                id="amountIn"
                name="amountIn"
                type="number"
                step="any"
                value={(() => {
                  const currentAmount = node.data.node_data?.amountIn || "0";
                  const tokenInAddress = node.data.node_data?.tokenIn;
                  const token = Object.values(tokens).find(
                    (t) => t.address === tokenInAddress
                  );
                  const decimals = token ? token.decimal : 18;
                  return parseFloat(currentAmount) / Math.pow(10, decimals);
                })()}
                onChange={handleInputChange}
                className="p-2 border rounded w-full mt-1"
                placeholder="e.g., 1000"
              />
            </div>
            <div>
              <label htmlFor="amountOutMin" className="font-semibold">
                Minimum Amount Out (raw value)
              </label>
              <input
                id="amountOutMin"
                name="amountOutMin"
                value={node.data.node_data?.amountOutMin || "0"}
                onChange={handleInputChange}
                className="p-2 border rounded w-full mt-1"
                placeholder="e.g., 0"
              />
            </div>
          </div>
        );
      case "sendToken":
        return (
          <div className="flex flex-col gap-4">
            <div>
              <label htmlFor="tokenAddress" className="font-semibold">
                Token to Send
              </label>
              <select
                id="tokenAddress"
                name="tokenAddress"
                value={node.data.node_data?.tokenAddress || ""}
                onChange={handleInputChange}
                className="p-2 border rounded w-full mt-1"
              >
                <option value="">Native ETH</option>
                {Object.entries(tokens).map(([symbol, token]) => (
                  <option key={token.address} value={token.address}>
                    {symbol} ({token.address.slice(0, 6)}...
                    {token.address.slice(-4)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="destination" className="font-semibold">
                Destination Address
              </label>
              <input
                id="destination"
                name="destination"
                value={node.data.node_data?.destination || ""}
                onChange={handleInputChange}
                className="p-2 border rounded w-full mt-1"
                placeholder="0x..."
                required
              />
            </div>
            <div>
              <label htmlFor="amount" className="font-semibold">
                Amount
              </label>
              <input
                id="amount"
                name="amount"
                value={node.data.node_data?.amount || ""}
                onChange={handleInputChange}
                className="p-2 border rounded w-full mt-1"
                placeholder="e.g., 0.1 (for ETH) or raw amount (for tokens)"
                required
              />
            </div>
          </div>
        );
      case "print":
        return (
          <div className="flex flex-col gap-2">
            <label htmlFor="sample" className="font-semibold">
              Sample Data
            </label>
            <input
              id="sample"
              name="sample"
              value={node.data.node_data?.sample || "sample"}
              onChange={handleInputChange}
              className="p-2 border rounded w-full mt-1"
              placeholder="Debug message or sample data"
            />
          </div>
        );
      case "nexusPay":
        return (
          <div className="flex flex-col gap-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-sm text-purple-700">
                🔐 <strong>Nexus Pay</strong> handles HTTP 402 Payment Required flows automatically using NIP-1 SDK.
              </p>
            </div>
            <div>
              <label htmlFor="url" className="font-semibold">
                API URL *
              </label>
              <input
                id="url"
                name="url"
                value={node.data.node_data?.url || "http://localhost:4000/api/news/crypto"}
                onChange={handleInputChange}
                className="p-2 border rounded w-full mt-1 font-mono text-sm"
                placeholder="https://api.example.com/data"
              />
              <p className="text-xs text-slate-500 mt-1">Premium API endpoint that returns 402 Payment Required</p>
            </div>
            <div>
              <label htmlFor="method" className="font-semibold">
                HTTP Method
              </label>
              <select
                id="method"
                name="method"
                value={node.data.node_data?.method || "GET"}
                onChange={handleInputChange}
                className="p-2 border rounded w-full mt-1"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>
            <div>
              <label htmlFor="headers" className="font-semibold">
                Custom Headers (JSON)
              </label>
              <textarea
                id="headers"
                name="headers"
                value={node.data.node_data?.headers || ""}
                onChange={handleInputChange}
                className="p-2 border rounded w-full mt-1 font-mono text-xs"
                rows={3}
                placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
              />
              <p className="text-xs text-slate-500 mt-1">Optional. Valid JSON object with custom headers.</p>
            </div>
            {(node.data.node_data?.method === "POST" ||
              node.data.node_data?.method === "PUT" ||
              node.data.node_data?.method === "PATCH") && (
                <div>
                  <label htmlFor="body" className="font-semibold">
                    Request Body (JSON)
                  </label>
                  <textarea
                    id="body"
                    name="body"
                    value={node.data.node_data?.body || ""}
                    onChange={handleInputChange}
                    className="p-2 border rounded w-full mt-1 font-mono text-xs"
                    rows={4}
                    placeholder='{"query": "crypto news", "limit": 10}'
                  />
                  <p className="text-xs text-slate-500 mt-1">Request payload for POST/PUT/PATCH requests.</p>
                </div>
              )}
            <div>
              <label htmlFor="chainId" className="font-semibold">
                Payment Chain
              </label>
              <select
                id="chainId"
                name="chainId"
                value={node.data.node_data?.chainId || 240}
                onChange={handleInputChange}
                className="p-2 border rounded w-full mt-1"
              >
                <option value={240}>Cronos zkEVM Testnet (240)</option>
                <option value={388}>Cronos zkEVM Mainnet (388)</option>
                <option value={84532}>Base Sepolia Testnet (84532)</option>
                <option value={80002}>Polygon Amoy Testnet (80002)</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">Chain for payment transactions</p>
            </div>
            <div>
              <label htmlFor="nexusBackendUrl" className="font-semibold">
                Nexus Backend URL
              </label>
              <input
                id="nexusBackendUrl"
                name="nexusBackendUrl"
                value={node.data.node_data?.nexusBackendUrl || "http://localhost:3001"}
                onChange={handleInputChange}
                className="p-2 border rounded w-full mt-1 font-mono text-sm"
                placeholder="http://localhost:3001"
              />
              <p className="text-xs text-slate-500 mt-1">Backend server for workflow execution</p>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-3 mt-2">
              <p className="text-xs text-purple-600 font-semibold mb-1">💡 Quick Examples:</p>
              <div className="space-y-1 text-xs text-slate-600">
                <div>🗞️ <span className="font-mono">GET /api/news/crypto</span> - Crypto News</div>
                <div>📊 <span className="font-mono">GET /api/market/prices</span> - Market Data</div>
                <div>🤖 <span className="font-mono">GET /api/ai/analysis</span> - AI Analysis</div>
                <div>💹 <span className="font-mono">GET /api/predictions/trends</span> - Price Predictions</div>
              </div>
            </div>
          </div>
        );
      case "registryQuery":
        return (
          <div className="flex flex-col gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                📋 <strong>Service Registry</strong> queries on-chain registered API providers.
              </p>
            </div>
            <div>
              <label htmlFor="category" className="font-semibold">
                Service Category
              </label>
              <select
                id="category"
                name="category"
                value={node.data.node_data?.category || "news"}
                onChange={handleInputChange}
                className="p-2 border rounded w-full mt-1"
              >
                <option value="news">News</option>
                <option value="weather">Weather</option>
                <option value="price">Price Feeds</option>
                <option value="analytics">Analytics</option>
                <option value="ai">AI/ML</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="maxPrice" className="font-semibold">
                Max Price (wei)
              </label>
              <input
                id="maxPrice"
                name="maxPrice"
                value={node.data.node_data?.maxPrice || "1000000000000000000"}
                onChange={handleInputChange}
                className="p-2 border rounded w-full mt-1"
                placeholder="1000000000000000000"
              />
              <p className="text-xs text-slate-500 mt-1">Maximum price willing to pay (1 ETH = 10^18 wei)</p>
            </div>
            <div>
              <label htmlFor="chainId" className="font-semibold">
                Chain ID
              </label>
              <select
                id="chainId"
                name="chainId"
                value={node.data.node_data?.chainId || 240}
                onChange={handleInputChange}
                className="p-2 border rounded w-full mt-1"
              >
                <option value={240}>Cronos zkEVM Testnet (240)</option>
                <option value={388}>Cronos zkEVM Mainnet (388)</option>
                <option value={25}>Cronos Mainnet (25)</option>
                <option value={338}>Cronos Testnet (338)</option>
              </select>
            </div>
            <div>
              <label htmlFor="registryAddress" className="font-semibold">
                Registry Contract Address
              </label>
              <input
                id="registryAddress"
                name="registryAddress"
                value={node.data.node_data?.registryAddress || ""}
                onChange={handleInputChange}
                className="p-2 border rounded w-full mt-1"
                placeholder="0x... (leave empty for default)"
              />
            </div>
          </div>
        );
      // ========== RISK MANAGEMENT NODES ==========
      case "healthFactor":
        return (
          <div className="flex flex-col gap-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">
                ❤️ <strong>Health Factor</strong> monitors your Aave/Compound lending position safety.
              </p>
            </div>
            <div>
              <label htmlFor="protocol" className="font-semibold">
                Protocol
              </label>
              <select
                id="protocol"
                name="protocol"
                value={node.data.node_data?.protocol || "aave"}
                onChange={handleInputChange}
                className="p-2 border rounded w-full mt-1"
              >
                <option value="aave">Aave V3</option>
                <option value="compound">Compound V3</option>
              </select>
            </div>
            <div>
              <label htmlFor="walletAddress" className="font-semibold">
                Wallet Address
              </label>
              <input
                id="walletAddress"
                name="walletAddress"
                value={node.data.node_data?.walletAddress || ""}
                onChange={handleInputChange}
                className="p-2 border rounded w-full mt-1"
                placeholder="0x... (leave empty for connected wallet)"
              />
            </div>
            <div>
              <label htmlFor="threshold" className="font-semibold">
                Alert Threshold
              </label>
              <input
                id="threshold"
                name="threshold"
                type="number"
                step="0.1"
                value={node.data.node_data?.threshold || "1.5"}
                onChange={handleInputChange}
                className="p-2 border rounded w-full mt-1"
                placeholder="1.5"
              />
              <p className="text-xs text-slate-500 mt-1">Alert when HF drops below this (1.0 = liquidation risk)</p>
            </div>
            <div>
              <label htmlFor="chainId" className="font-semibold">
                Chain
              </label>
              <select
                id="chainId"
                name="chainId"
                value={node.data.node_data?.chainId || 1}
                onChange={handleInputChange}
                className="p-2 border rounded w-full mt-1"
              >
                <option value={1}>Ethereum Mainnet</option>
                <option value={137}>Polygon</option>
                <option value={42161}>Arbitrum</option>
                <option value={10}>Optimism</option>
                <option value={8453}>Base</option>
                <option value={11155111}>Sepolia Testnet</option>
              </select>
            </div>
          </div>
        );
      case "autoRepay":
        return (
          <div className="flex flex-col gap-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-orange-700">
                🛡️ <strong>Auto Repay</strong> automatically repays debt when health factor is low.
              </p>
            </div>
            <div>
              <label htmlFor="protocol" className="font-semibold">
                Protocol
              </label>
              <select
                id="protocol"
                name="protocol"
                value={node.data.node_data?.protocol || "aave"}
                onChange={handleInputChange}
                className="p-2 border rounded w-full mt-1"
              >
                <option value="aave">Aave V3</option>
                <option value="compound">Compound V3</option>
              </select>
            </div>
            <div>
              <label htmlFor="repayPercentage" className="font-semibold">
                Repay Percentage
              </label>
              <input
                id="repayPercentage"
                name="repayPercentage"
                type="number"
                min="1"
                max="100"
                value={node.data.node_data?.repayPercentage || "50"}
                onChange={handleInputChange}
                className="p-2 border rounded w-full mt-1"
                placeholder="50"
              />
              <p className="text-xs text-slate-500 mt-1">Percentage of debt to repay (1-100%)</p>
            </div>
            <div>
              <label htmlFor="collateralToken" className="font-semibold">
                Collateral Token to Sell
              </label>
              <select
                id="collateralToken"
                name="collateralToken"
                value={node.data.node_data?.collateralToken || ""}
                onChange={handleInputChange}
                className="p-2 border rounded w-full mt-1"
              >
                <option value="">Auto-select best</option>
                {Object.entries(tokens).map(([symbol, token]) => (
                  <option key={token.address} value={token.address}>
                    {symbol}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="targetHealthFactor" className="font-semibold">
                Target Health Factor
              </label>
              <input
                id="targetHealthFactor"
                name="targetHealthFactor"
                type="number"
                step="0.1"
                value={node.data.node_data?.targetHealthFactor || "1.5"}
                onChange={handleInputChange}
                className="p-2 border rounded w-full mt-1"
                placeholder="1.5"
              />
            </div>
          </div>
        );
      case "liquidationAlert":
        return (
          <div className="flex flex-col gap-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">
                🚨 <strong>Liquidation Alert</strong> sends notifications when position is at risk.
              </p>
            </div>
            <div>
              <label htmlFor="warningThreshold" className="font-semibold">
                Warning Threshold (HF)
              </label>
              <input
                id="warningThreshold"
                name="warningThreshold"
                type="number"
                step="0.1"
                value={node.data.node_data?.warningThreshold || "1.5"}
                onChange={handleInputChange}
                className="p-2 border rounded w-full mt-1"
                placeholder="1.5"
              />
            </div>
            <div>
              <label htmlFor="criticalThreshold" className="font-semibold">
                Critical Threshold (HF)
              </label>
              <input
                id="criticalThreshold"
                name="criticalThreshold"
                type="number"
                step="0.1"
                value={node.data.node_data?.criticalThreshold || "1.1"}
                onChange={handleInputChange}
                className="p-2 border rounded w-full mt-1"
                placeholder="1.1"
              />
            </div>
            <div>
              <label htmlFor="notifyEmail" className="font-semibold">
                Notification Email (optional)
              </label>
              <input
                id="notifyEmail"
                name="notifyEmail"
                type="email"
                value={node.data.node_data?.notifyEmail || ""}
                onChange={handleInputChange}
                className="p-2 border rounded w-full mt-1"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label htmlFor="webhookUrl" className="font-semibold">
                Webhook URL (optional)
              </label>
              <input
                id="webhookUrl"
                name="webhookUrl"
                value={node.data.node_data?.webhookUrl || ""}
                onChange={handleInputChange}
                className="p-2 border rounded w-full mt-1"
                placeholder="https://your-webhook.com/alert"
              />
            </div>
          </div>
        );
      // ========== CROSS-CHAIN NODES ==========
      case "crossChainTrigger":
        return (
          <div className="flex flex-col gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                🌐 <strong>Cross-Chain Trigger</strong> sends messages across chains via Chainlink CCIP.
              </p>
            </div>
            <div>
              <label htmlFor="sourceChain" className="font-semibold">
                Source Chain
              </label>
              <select
                id="sourceChain"
                name="sourceChain"
                value={node.data.node_data?.sourceChain || 11155111}
                onChange={handleInputChange}
                className="p-2 border rounded w-full mt-1"
              >
                <option value={11155111}>Ethereum Sepolia</option>
                <option value={84532}>Base Sepolia</option>
                <option value={80002}>Polygon Amoy</option>
                <option value={421614}>Arbitrum Sepolia</option>
              </select>
            </div>
            <div>
              <label htmlFor="destinationChain" className="font-semibold">
                Destination Chain
              </label>
              <select
                id="destinationChain"
                name="destinationChain"
                value={node.data.node_data?.destinationChain || 84532}
                onChange={handleInputChange}
                className="p-2 border rounded w-full mt-1"
              >
                <option value={11155111}>Ethereum Sepolia</option>
                <option value={84532}>Base Sepolia</option>
                <option value={80002}>Polygon Amoy</option>
                <option value={421614}>Arbitrum Sepolia</option>
              </select>
            </div>
            <div>
              <label htmlFor="receiver" className="font-semibold">
                Receiver Contract Address
              </label>
              <input
                id="receiver"
                name="receiver"
                value={node.data.node_data?.receiver || ""}
                onChange={handleInputChange}
                className="p-2 border rounded w-full mt-1"
                placeholder="0x... (contract on destination chain)"
              />
            </div>
            <div>
              <label htmlFor="protocol" className="font-semibold">
                Bridge Protocol
              </label>
              <select
                id="protocol"
                name="protocol"
                value={node.data.node_data?.protocol || "ccip"}
                onChange={handleInputChange}
                className="p-2 border rounded w-full mt-1"
              >
                <option value="ccip">Chainlink CCIP</option>
                <option value="layerzero">LayerZero</option>
              </select>
            </div>
          </div>
        );
      case "crossChainSwap":
        return (
          <div className="flex flex-col gap-4">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
              <p className="text-sm text-indigo-700">
                🔄 <strong>Cross-Chain Swap</strong> executes token swaps on destination chain.
              </p>
            </div>
            <div>
              <label htmlFor="sourceChain" className="font-semibold">
                Source Chain
              </label>
              <select
                id="sourceChain"
                name="sourceChain"
                value={node.data.node_data?.sourceChain || 11155111}
                onChange={handleInputChange}
                className="p-2 border rounded w-full mt-1"
              >
                <option value={11155111}>Ethereum Sepolia</option>
                <option value={84532}>Base Sepolia</option>
                <option value={80002}>Polygon Amoy</option>
              </select>
            </div>
            <div>
              <label htmlFor="destinationChain" className="font-semibold">
                Destination Chain
              </label>
              <select
                id="destinationChain"
                name="destinationChain"
                value={node.data.node_data?.destinationChain || 84532}
                onChange={handleInputChange}
                className="p-2 border rounded w-full mt-1"
              >
                <option value={11155111}>Ethereum Sepolia</option>
                <option value={84532}>Base Sepolia</option>
                <option value={80002}>Polygon Amoy</option>
              </select>
            </div>
            <div>
              <label htmlFor="tokenIn" className="font-semibold">
                Token In (on source chain)
              </label>
              <input
                id="tokenIn"
                name="tokenIn"
                value={node.data.node_data?.tokenIn || ""}
                onChange={handleInputChange}
                className="p-2 border rounded w-full mt-1"
                placeholder="0x... token address"
              />
            </div>
            <div>
              <label htmlFor="tokenOut" className="font-semibold">
                Token Out (on destination chain)
              </label>
              <input
                id="tokenOut"
                name="tokenOut"
                value={node.data.node_data?.tokenOut || ""}
                onChange={handleInputChange}
                className="p-2 border rounded w-full mt-1"
                placeholder="0x... token address"
              />
            </div>
            <div>
              <label htmlFor="amountIn" className="font-semibold">
                Amount In
              </label>
              <input
                id="amountIn"
                name="amountIn"
                value={node.data.node_data?.amountIn || ""}
                onChange={handleInputChange}
                className="p-2 border rounded w-full mt-1"
                placeholder="Amount to swap"
              />
            </div>
            <div>
              <label htmlFor="slippage" className="font-semibold">
                Slippage Tolerance (%)
              </label>
              <input
                id="slippage"
                name="slippage"
                type="number"
                step="0.1"
                value={node.data.node_data?.slippage || "0.5"}
                onChange={handleInputChange}
                className="p-2 border rounded w-full mt-1"
                placeholder="0.5"
              />
            </div>
          </div>
        );
      // ========== AI TRADING NODES ==========
      case "tradingAgent":
        return (
          <div className="flex flex-col gap-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <p className="text-sm text-emerald-700">
                🤖 <strong>AI Trading Agent</strong> generates buy/sell signals based on market analysis.
              </p>
            </div>
            <div>
              <label htmlFor="symbol" className="font-semibold">Trading Symbol</label>
              <select id="symbol" name="symbol" value={node.data.node_data?.symbol || "BTC"} onChange={handleInputChange} className="p-2 border rounded w-full mt-1">
                <option value="BTC">Bitcoin (BTC)</option>
                <option value="ETH">Ethereum (ETH)</option>
                <option value="SOL">Solana (SOL)</option>
              </select>
            </div>
            <div>
              <label htmlFor="strategy" className="font-semibold">Trading Strategy</label>
              <select id="strategy" name="strategy" value={node.data.node_data?.strategy || "ai-signal"} onChange={handleInputChange} className="p-2 border rounded w-full mt-1">
                <option value="ai-signal">AI Signal Based</option>
                <option value="momentum">Momentum Trading</option>
                <option value="mean-reversion">Mean Reversion</option>
                <option value="dca">Dollar Cost Average</option>
              </select>
            </div>
            <div>
              <label htmlFor="riskLevel" className="font-semibold">Risk Level</label>
              <select id="riskLevel" name="riskLevel" value={node.data.node_data?.riskLevel || "moderate"} onChange={handleInputChange} className="p-2 border rounded w-full mt-1">
                <option value="conservative">Conservative</option>
                <option value="moderate">Moderate</option>
                <option value="aggressive">Aggressive</option>
              </select>
            </div>
            <div>
              <label htmlFor="maxPositionSize" className="font-semibold">Max Position Size</label>
              <input id="maxPositionSize" name="maxPositionSize" type="number" step="0.01" value={node.data.node_data?.maxPositionSize || "0.5"} onChange={handleInputChange} className="p-2 border rounded w-full mt-1" />
            </div>
            <div>
              <label htmlFor="stopLossPercent" className="font-semibold">Stop Loss (%)</label>
              <input id="stopLossPercent" name="stopLossPercent" type="number" min="1" max="50" value={node.data.node_data?.stopLossPercent || 5} onChange={handleInputChange} className="p-2 border rounded w-full mt-1" />
            </div>
            <div>
              <label htmlFor="takeProfitPercent" className="font-semibold">Take Profit (%)</label>
              <input id="takeProfitPercent" name="takeProfitPercent" type="number" min="1" max="100" value={node.data.node_data?.takeProfitPercent || 10} onChange={handleInputChange} className="p-2 border rounded w-full mt-1" />
            </div>
          </div>
        );
      case "aiPrediction":
        return (
          <div className="flex flex-col gap-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-700">✨ <strong>AI Prediction</strong> fetches market predictions via NIP-1 paid API.</p>
            </div>
            <div>
              <label htmlFor="symbol" className="font-semibold">Symbol</label>
              <select id="symbol" name="symbol" value={node.data.node_data?.symbol || "BTC"} onChange={handleInputChange} className="p-2 border rounded w-full mt-1">
                <option value="BTC">Bitcoin (BTC)</option>
                <option value="ETH">Ethereum (ETH)</option>
              </select>
            </div>
            <div>
              <label htmlFor="apiUrl" className="font-semibold">Prediction API URL</label>
              <input id="apiUrl" name="apiUrl" value={node.data.node_data?.apiUrl || "http://localhost:4000/api/predictions/btc"} onChange={handleInputChange} className="p-2 border rounded w-full mt-1 font-mono text-sm" />
            </div>
            <div>
              <label htmlFor="paymentAmount" className="font-semibold">Payment Amount (wei)</label>
              <input id="paymentAmount" name="paymentAmount" value={node.data.node_data?.paymentAmount || "1000000000000000"} onChange={handleInputChange} className="p-2 border rounded w-full mt-1" />
              <p className="text-xs text-slate-500 mt-1">0.001 CRO = 1000000000000000 wei</p>
            </div>
          </div>
        );
      case "visionAnalysis":
        return (
          <div className="flex flex-col gap-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-sm text-purple-700">👁️ <strong>Vision Analysis</strong> analyzes charts using AI vision models.</p>
            </div>
            <div>
              <label htmlFor="imageUrl" className="font-semibold">Chart Image URL</label>
              <input id="imageUrl" name="imageUrl" value={node.data.node_data?.imageUrl || ""} onChange={handleInputChange} className="p-2 border rounded w-full mt-1" placeholder="https://example.com/chart.png" />
            </div>
            <div>
              <label htmlFor="persona" className="font-semibold">Analysis Persona</label>
              <select id="persona" name="persona" value={node.data.node_data?.persona || "default"} onChange={handleInputChange} className="p-2 border rounded w-full mt-1">
                <option value="default">Balanced Analyst</option>
                <option value="aggressive">Aggressive Trader</option>
                <option value="conservative">Conservative Investor</option>
                <option value="scalper">Scalper</option>
              </select>
            </div>
            <div>
              <label htmlFor="analysisType" className="font-semibold">Analysis Type</label>
              <select id="analysisType" name="analysisType" value={node.data.node_data?.analysisType || "chart"} onChange={handleInputChange} className="p-2 border rounded w-full mt-1">
                <option value="chart">Technical Chart</option>
                <option value="sentiment">Sentiment</option>
                <option value="pattern">Pattern Recognition</option>
              </select>
            </div>
            <div>
              <label htmlFor="prompt" className="font-semibold">Custom Prompt</label>
              <textarea id="prompt" name="prompt" value={node.data.node_data?.prompt || "Analyze this chart"} onChange={handleInputChange} className="p-2 border rounded w-full mt-1" rows={2} />
            </div>
            <div>
              <label htmlFor="apiProvider" className="font-semibold">AI Provider</label>
              <select id="apiProvider" name="apiProvider" value={node.data.node_data?.apiProvider || "mock"} onChange={handleInputChange} className="p-2 border rounded w-full mt-1">
                <option value="mock">Mock (Testing)</option>
                <option value="gemini">Google Gemini</option>
                <option value="openai">OpenAI GPT-4V</option>
              </select>
            </div>
          </div>
        );
      case "stopLoss":
        return (
          <div className="flex flex-col gap-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">🛑 <strong>Stop-Loss Monitor</strong> closes positions at loss limits.</p>
            </div>
            <div>
              <label htmlFor="symbol" className="font-semibold">Symbol</label>
              <select id="symbol" name="symbol" value={node.data.node_data?.symbol || "BTC"} onChange={handleInputChange} className="p-2 border rounded w-full mt-1">
                <option value="BTC">Bitcoin</option>
                <option value="ETH">Ethereum</option>
              </select>
            </div>
            <div>
              <label htmlFor="positionType" className="font-semibold">Position Type</label>
              <select id="positionType" name="positionType" value={node.data.node_data?.positionType || "long"} onChange={handleInputChange} className="p-2 border rounded w-full mt-1">
                <option value="long">Long</option>
                <option value="short">Short</option>
              </select>
            </div>
            <div>
              <label htmlFor="entryPrice" className="font-semibold">Entry Price ($)</label>
              <input id="entryPrice" name="entryPrice" type="number" step="0.01" value={node.data.node_data?.entryPrice || 0} onChange={handleInputChange} className="p-2 border rounded w-full mt-1" />
            </div>
            <div>
              <label htmlFor="stopLossPrice" className="font-semibold">Stop Loss Price ($)</label>
              <input id="stopLossPrice" name="stopLossPrice" type="number" step="0.01" value={node.data.node_data?.stopLossPrice || 0} onChange={handleInputChange} className="p-2 border rounded w-full mt-1" />
            </div>
            <div>
              <label htmlFor="takeProfitPrice" className="font-semibold">Take Profit Price ($)</label>
              <input id="takeProfitPrice" name="takeProfitPrice" type="number" step="0.01" value={node.data.node_data?.takeProfitPrice || 0} onChange={handleInputChange} className="p-2 border rounded w-full mt-1" />
            </div>
            <div className="flex items-center gap-2">
              <input id="trailingStop" name="trailingStop" type="checkbox" checked={node.data.node_data?.trailingStop || false} onChange={(e) => handleInputChange({ target: { name: "trailingStop", value: e.target.checked } })} className="w-4 h-4" />
              <label htmlFor="trailingStop">Enable Trailing Stop</label>
            </div>
          </div>
        );
      case "riskManager":
        return (
          <div className="flex flex-col gap-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-orange-700">🛡️ <strong>Risk Manager</strong> enforces portfolio risk limits.</p>
            </div>
            <div>
              <label htmlFor="maxPortfolioRisk" className="font-semibold">Max Portfolio Risk (%)</label>
              <input id="maxPortfolioRisk" name="maxPortfolioRisk" type="number" min="1" max="100" value={node.data.node_data?.maxPortfolioRisk || 30} onChange={handleInputChange} className="p-2 border rounded w-full mt-1" />
            </div>
            <div>
              <label htmlFor="maxSinglePositionSize" className="font-semibold">Max Single Position (%)</label>
              <input id="maxSinglePositionSize" name="maxSinglePositionSize" type="number" min="1" max="100" value={node.data.node_data?.maxSinglePositionSize || 10} onChange={handleInputChange} className="p-2 border rounded w-full mt-1" />
            </div>
            <div>
              <label htmlFor="maxDailyLoss" className="font-semibold">Max Daily Loss (%)</label>
              <input id="maxDailyLoss" name="maxDailyLoss" type="number" min="1" max="50" value={node.data.node_data?.maxDailyLoss || 5} onChange={handleInputChange} className="p-2 border rounded w-full mt-1" />
            </div>
            <div>
              <label htmlFor="maxOpenPositions" className="font-semibold">Max Open Positions</label>
              <input id="maxOpenPositions" name="maxOpenPositions" type="number" min="1" max="20" value={node.data.node_data?.maxOpenPositions || 3} onChange={handleInputChange} className="p-2 border rounded w-full mt-1" />
            </div>
          </div>
        );
      // ========== TRUST & SAFETY NODES ==========
      case "maxInvestment":
        return (
          <div className="flex flex-col gap-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <p className="text-sm text-emerald-700">💰 <strong>Max Investment Limit</strong> - REQUIRED safety node.</p>
            </div>
            <div>
              <label htmlFor="maxAmountPerTrade" className="font-semibold text-red-600">Max Amount Per Trade *</label>
              <input id="maxAmountPerTrade" name="maxAmountPerTrade" type="number" step="0.01" value={node.data.node_data?.maxAmountPerTrade || "0.1"} onChange={handleInputChange} className="p-2 border border-red-300 rounded w-full mt-1" required />
            </div>
            <div>
              <label htmlFor="maxTotalExposure" className="font-semibold text-red-600">Max Total Exposure *</label>
              <input id="maxTotalExposure" name="maxTotalExposure" type="number" step="0.01" value={node.data.node_data?.maxTotalExposure || "0.5"} onChange={handleInputChange} className="p-2 border border-red-300 rounded w-full mt-1" required />
            </div>
            <div>
              <label htmlFor="currency" className="font-semibold">Currency</label>
              <select id="currency" name="currency" value={node.data.node_data?.currency || "CRO"} onChange={handleInputChange} className="p-2 border rounded w-full mt-1">
                <option value="CRO">CRO</option>
                <option value="ETH">ETH</option>
                <option value="USDC">USDC</option>
              </select>
            </div>
          </div>
        );
      case "dailyLossLimit":
        return (
          <div className="flex flex-col gap-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">📉 <strong>Daily Loss Limit</strong> - REQUIRED safety node.</p>
            </div>
            <div>
              <label htmlFor="maxDailyLossPercent" className="font-semibold text-red-600">Max Daily Loss (%) *</label>
              <input id="maxDailyLossPercent" name="maxDailyLossPercent" type="number" min="1" max="50" value={node.data.node_data?.maxDailyLossPercent || 5} onChange={handleInputChange} className="p-2 border border-red-300 rounded w-full mt-1" required />
            </div>
            <div>
              <label htmlFor="maxDailyLossAmount" className="font-semibold text-red-600">Max Daily Loss (Amount) *</label>
              <input id="maxDailyLossAmount" name="maxDailyLossAmount" type="number" step="0.01" value={node.data.node_data?.maxDailyLossAmount || "0.05"} onChange={handleInputChange} className="p-2 border border-red-300 rounded w-full mt-1" required />
            </div>
            <div className="flex items-center gap-2">
              <input id="pauseOnLimit" name="pauseOnLimit" type="checkbox" checked={node.data.node_data?.pauseOnLimit !== false} onChange={(e) => handleInputChange({ target: { name: "pauseOnLimit", value: e.target.checked } })} className="w-4 h-4" />
              <label htmlFor="pauseOnLimit">Pause Trading When Limit Hit</label>
            </div>
            <div>
              <label htmlFor="resetTime" className="font-semibold">Daily Reset Time (UTC)</label>
              <input id="resetTime" name="resetTime" type="time" value={node.data.node_data?.resetTime || "00:00"} onChange={handleInputChange} className="p-2 border rounded w-full mt-1" />
            </div>
          </div>
        );
      case "userConfirmation":
        return (
          <div className="flex flex-col gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">✅ <strong>User Confirmation</strong> - REQUIRED safety node.</p>
            </div>
            <div className="flex items-center gap-2">
              <input id="requireConfirmation" type="checkbox" checked={true} disabled className="w-4 h-4" />
              <label className="font-semibold text-red-600">Require Confirmation * (Always On)</label>
            </div>
            <div>
              <label htmlFor="confirmationMethod" className="font-semibold">Confirmation Method</label>
              <select id="confirmationMethod" name="confirmationMethod" value={node.data.node_data?.confirmationMethod || "popup"} onChange={handleInputChange} className="p-2 border rounded w-full mt-1">
                <option value="popup">Popup Dialog</option>
                <option value="notification">Push Notification</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div>
              <label htmlFor="timeoutSeconds" className="font-semibold">Timeout (seconds)</label>
              <input id="timeoutSeconds" name="timeoutSeconds" type="number" min="10" max="300" value={node.data.node_data?.timeoutSeconds || 60} onChange={handleInputChange} className="p-2 border rounded w-full mt-1" />
              <p className="text-xs text-slate-500 mt-1">Auto-reject if no response</p>
            </div>
            <div>
              <label htmlFor="minConfirmationDelay" className="font-semibold">Min Delay (seconds)</label>
              <input id="minConfirmationDelay" name="minConfirmationDelay" type="number" min="0" max="30" value={node.data.node_data?.minConfirmationDelay || 3} onChange={handleInputChange} className="p-2 border rounded w-full mt-1" />
              <p className="text-xs text-slate-500 mt-1">Prevents accidental confirmations</p>
            </div>
          </div>
        );
      // ========== DEFI YIELD NODES ==========
      case "apyMonitor":
        return (
          <div className="flex flex-col gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-700">📈 <strong>APY Monitor</strong> scans DeFi protocols for best yields using DeFiLlama API.</p>
            </div>
            <div>
              <label htmlFor="asset" className="font-semibold">Asset to Monitor</label>
              <select id="asset" name="asset" value={node.data.node_data?.asset || "USDC"} onChange={handleInputChange} className="p-2 border rounded w-full mt-1">
                <option value="USDC">USDC</option>
                <option value="USDT">USDT</option>
                <option value="DAI">DAI</option>
                <option value="ETH">ETH</option>
                <option value="WBTC">WBTC</option>
                <option value="WETH">WETH</option>
              </select>
            </div>
            <div>
              <label htmlFor="chain" className="font-semibold">Chain</label>
              <select id="chain" name="chain" value={node.data.node_data?.chain || "Ethereum"} onChange={handleInputChange} className="p-2 border rounded w-full mt-1">
                <option value="Ethereum">Ethereum</option>
                <option value="Arbitrum">Arbitrum</option>
                <option value="Optimism">Optimism</option>
                <option value="Polygon">Polygon</option>
                <option value="Base">Base</option>
                <option value="BSC">BSC</option>
              </select>
            </div>
            <div>
              <label htmlFor="minAPY" className="font-semibold">Minimum APY (%)</label>
              <input id="minAPY" name="minAPY" type="number" step="0.1" min="0" value={node.data.node_data?.minAPY || 0} onChange={handleInputChange} className="p-2 border rounded w-full mt-1" />
              <p className="text-xs text-slate-500 mt-1">Filter out pools below this APY</p>
            </div>
            <div>
              <label className="font-semibold">Protocols to Monitor</label>
              <div className="mt-2 space-y-2">
                {["aave-v3", "compound-v3", "curve", "yearn", "morpho"].map(protocol => (
                  <label key={protocol} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={(node.data.node_data?.protocols || ["aave-v3", "compound-v3", "curve", "yearn"]).includes(protocol)}
                      onChange={(e) => {
                        const current = node.data.node_data?.protocols || ["aave-v3", "compound-v3", "curve", "yearn"];
                        const updated = e.target.checked
                          ? [...current, protocol]
                          : current.filter(p => p !== protocol);
                        handleInputChange({ target: { name: "protocols", value: updated } });
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm capitalize">{protocol.replace("-", " ")}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600">
              <p className="font-semibold mb-1">💡 Data Source</p>
              <p>Real-time APY data from DeFiLlama API (yields.llama.fi)</p>
            </div>
          </div>
        );
      case "yieldOptimizer":
        return (
          <div className="flex flex-col gap-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <p className="text-sm text-emerald-700">🤖 <strong>Yield Optimizer</strong> AI agent that auto-rebalances to highest yields.</p>
            </div>
            <div>
              <label htmlFor="currentProtocol" className="font-semibold">Current Protocol</label>
              <select id="currentProtocol" name="currentProtocol" value={node.data.node_data?.currentProtocol || "aave-v3"} onChange={handleInputChange} className="p-2 border rounded w-full mt-1">
                <option value="aave-v3">Aave V3</option>
                <option value="compound-v3">Compound V3</option>
                <option value="curve">Curve</option>
                <option value="yearn">Yearn</option>
                <option value="morpho">Morpho</option>
              </select>
            </div>
            <div>
              <label htmlFor="depositAmount" className="font-semibold">Deposit Amount (USD)</label>
              <input id="depositAmount" name="depositAmount" type="number" step="100" value={node.data.node_data?.depositAmount || "1000"} onChange={handleInputChange} className="p-2 border rounded w-full mt-1" />
            </div>
            <div>
              <label htmlFor="minProfitThreshold" className="font-semibold">Min Profit Threshold (%)</label>
              <input id="minProfitThreshold" name="minProfitThreshold" type="number" step="0.1" min="0" value={node.data.node_data?.minProfitThreshold || 0.5} onChange={handleInputChange} className="p-2 border rounded w-full mt-1" />
              <p className="text-xs text-slate-500 mt-1">Only rebalance if APY difference exceeds this</p>
            </div>
            <div>
              <label htmlFor="gasPrice" className="font-semibold">Max Gas Price (gwei)</label>
              <input id="gasPrice" name="gasPrice" type="number" step="1" value={node.data.node_data?.gasPrice || "30"} onChange={handleInputChange} className="p-2 border rounded w-full mt-1" />
            </div>
            <div>
              <label htmlFor="projectionMonths" className="font-semibold">Projection Period (months)</label>
              <input id="projectionMonths" name="projectionMonths" type="number" min="1" max="24" value={node.data.node_data?.projectionMonths || 12} onChange={handleInputChange} className="p-2 border rounded w-full mt-1" />
            </div>
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-3 text-xs">
              <p className="font-semibold text-emerald-700 mb-1">🧠 AI Decision Logic</p>
              <p className="text-slate-600">Compares current APY vs alternatives, factors in gas costs, and recommends optimal rebalancing strategy.</p>
            </div>
          </div>
        );
      // ========== ARBITRAGE NODES ==========
      case "arbitrage":
        return (
          <div className="flex flex-col gap-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-sm text-purple-700">🔄 <strong>DEX Arbitrage Scanner</strong> finds price differences across DEXs.</p>
            </div>
            <div>
              <label htmlFor="tokenIn" className="font-semibold">Token In</label>
              <select id="tokenIn" name="tokenIn" value={node.data.node_data?.tokenIn || "USDC"} onChange={handleInputChange} className="p-2 border rounded w-full mt-1">
                <option value="USDC">USDC</option>
                <option value="USDT">USDT</option>
                <option value="DAI">DAI</option>
                <option value="WETH">WETH</option>
              </select>
            </div>
            <div>
              <label htmlFor="tokenOut" className="font-semibold">Token Out</label>
              <select id="tokenOut" name="tokenOut" value={node.data.node_data?.tokenOut || "WETH"} onChange={handleInputChange} className="p-2 border rounded w-full mt-1">
                <option value="WETH">WETH</option>
                <option value="WBTC">WBTC</option>
                <option value="USDC">USDC</option>
                <option value="USDT">USDT</option>
              </select>
            </div>
            <div>
              <label htmlFor="amount" className="font-semibold">Trade Amount (in token decimals)</label>
              <input id="amount" name="amount" value={node.data.node_data?.amount || "1000000000"} onChange={handleInputChange} className="p-2 border rounded w-full mt-1" placeholder="1000000000 = 1000 USDC" />
              <p className="text-xs text-slate-500 mt-1">For USDC: 1000000000 = 1000 USDC (6 decimals)</p>
            </div>
            <div>
              <label className="font-semibold">DEXs to Compare</label>
              <div className="mt-2 space-y-2">
                {["uniswap", "sushiswap", "1inch", "pancakeswap"].map(dex => (
                  <label key={dex} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={(node.data.node_data?.dexes || ["uniswap", "sushiswap", "1inch"]).includes(dex)}
                      onChange={(e) => {
                        const current = node.data.node_data?.dexes || ["uniswap", "sushiswap", "1inch"];
                        const updated = e.target.checked
                          ? [...current, dex]
                          : current.filter(d => d !== dex);
                        handleInputChange({ target: { name: "dexes", value: updated } });
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm capitalize">{dex === "1inch" ? "1inch Aggregator" : dex}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="minProfitPercent" className="font-semibold">Min Profit (%)</label>
              <input id="minProfitPercent" name="minProfitPercent" type="number" step="0.1" min="0" value={node.data.node_data?.minProfitPercent || 0.5} onChange={handleInputChange} className="p-2 border rounded w-full mt-1" />
            </div>
            <div>
              <label htmlFor="maxSlippage" className="font-semibold">Max Slippage (%)</label>
              <input id="maxSlippage" name="maxSlippage" type="number" step="0.1" min="0" max="5" value={node.data.node_data?.maxSlippage || 1} onChange={handleInputChange} className="p-2 border rounded w-full mt-1" />
            </div>
            <div>
              <label htmlFor="chainId" className="font-semibold">Chain</label>
              <select id="chainId" name="chainId" value={node.data.node_data?.chainId || 1} onChange={handleInputChange} className="p-2 border rounded w-full mt-1">
                <option value={1}>Ethereum Mainnet</option>
                <option value={42161}>Arbitrum</option>
                <option value={137}>Polygon</option>
                <option value={56}>BSC</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input id="includeGasCost" name="includeGasCost" type="checkbox" checked={node.data.node_data?.includeGasCost !== false} onChange={(e) => handleInputChange({ target: { name: "includeGasCost", value: e.target.checked } })} className="w-4 h-4" />
              <label htmlFor="includeGasCost">Include Gas Cost in Profit Calculation</label>
            </div>
            <div className="flex items-center gap-2">
              <input id="useMEVProtection" name="useMEVProtection" type="checkbox" checked={node.data.node_data?.useMEVProtection || false} onChange={(e) => handleInputChange({ target: { name: "useMEVProtection", value: e.target.checked } })} className="w-4 h-4" />
              <label htmlFor="useMEVProtection">Enable MEV Protection (Flashbots)</label>
            </div>
          </div>
        );
      case "crossChainArbitrage":
        return (
          <div className="flex flex-col gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">🌐 <strong>Cross-Chain Arbitrage</strong> finds price differences across blockchains.</p>
            </div>
            <div>
              <label htmlFor="token" className="font-semibold">Token</label>
              <select id="token" name="token" value={node.data.node_data?.token || "ETH"} onChange={handleInputChange} className="p-2 border rounded w-full mt-1">
                <option value="ETH">ETH</option>
                <option value="WETH">WETH</option>
                <option value="USDC">USDC</option>
                <option value="USDT">USDT</option>
                <option value="WBTC">WBTC</option>
              </select>
            </div>
            <div>
              <label htmlFor="amount" className="font-semibold">Amount</label>
              <input id="amount" name="amount" type="number" step="0.1" value={node.data.node_data?.amount || "1"} onChange={handleInputChange} className="p-2 border rounded w-full mt-1" />
            </div>
            <div>
              <label className="font-semibold">Chains to Compare</label>
              <div className="mt-2 space-y-2">
                {["ethereum", "arbitrum", "optimism", "base", "polygon", "bsc"].map(chain => (
                  <label key={chain} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={(node.data.node_data?.chains || ["ethereum", "arbitrum", "optimism", "base"]).includes(chain)}
                      onChange={(e) => {
                        const current = node.data.node_data?.chains || ["ethereum", "arbitrum", "optimism", "base"];
                        const updated = e.target.checked
                          ? [...current, chain]
                          : current.filter(c => c !== chain);
                        handleInputChange({ target: { name: "chains", value: updated } });
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm capitalize">{chain}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="minProfitPercent" className="font-semibold">Min Profit (%)</label>
              <input id="minProfitPercent" name="minProfitPercent" type="number" step="0.1" min="0" value={node.data.node_data?.minProfitPercent || 0.5} onChange={handleInputChange} className="p-2 border rounded w-full mt-1" />
            </div>
            <div>
              <label htmlFor="maxBridgeTime" className="font-semibold">Max Bridge Time (minutes)</label>
              <input id="maxBridgeTime" name="maxBridgeTime" type="number" min="5" max="120" value={node.data.node_data?.maxBridgeTime || 30} onChange={handleInputChange} className="p-2 border rounded w-full mt-1" />
            </div>
            <div className="flex items-center gap-2">
              <input id="includeBridgeCost" name="includeBridgeCost" type="checkbox" checked={node.data.node_data?.includeBridgeCost !== false} onChange={(e) => handleInputChange({ target: { name: "includeBridgeCost", value: e.target.checked } })} className="w-4 h-4" />
              <label htmlFor="includeBridgeCost">Include Bridge Cost in Calculation</label>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 text-xs">
              <p className="font-semibold text-blue-700 mb-1">💡 How it works</p>
              <p className="text-slate-600">Compares token prices across chains using CoinGecko API, estimates bridge costs, and calculates net profit after all fees.</p>
            </div>
          </div>
        );
      // ========== NEWS PREDICTION NODE ==========
      case "newsPrediction":
        return (
          <div className="flex flex-col gap-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-700">📰 <strong>News Prediction</strong> analyzes crypto news and correlates with price patterns.</p>
            </div>
            <div>
              <label htmlFor="symbol" className="font-semibold">Symbol</label>
              <select id="symbol" name="symbol" value={node.data.node_data?.symbol || "BTC"} onChange={handleInputChange} className="p-2 border rounded w-full mt-1">
                <option value="BTC">Bitcoin (BTC)</option>
                <option value="ETH">Ethereum (ETH)</option>
                <option value="SOL">Solana (SOL)</option>
                <option value="BNB">BNB</option>
                <option value="XRP">XRP</option>
              </select>
            </div>
            <div>
              <label htmlFor="newsSource" className="font-semibold">News Source</label>
              <select id="newsSource" name="newsSource" value={node.data.node_data?.newsSource || "aggregated"} onChange={handleInputChange} className="p-2 border rounded w-full mt-1">
                <option value="aggregated">Aggregated (All Sources)</option>
                <option value="cryptocompare">CryptoCompare</option>
                <option value="coindesk">CoinDesk</option>
                <option value="cointelegraph">CoinTelegraph</option>
              </select>
            </div>
            <div>
              <label htmlFor="lookbackHours" className="font-semibold">Lookback Period (hours)</label>
              <input id="lookbackHours" name="lookbackHours" type="number" min="1" max="168" value={node.data.node_data?.lookbackHours || 24} onChange={handleInputChange} className="p-2 border rounded w-full mt-1" />
            </div>
            <div>
              <label htmlFor="minConfidence" className="font-semibold">Min Confidence to Trade (%)</label>
              <input id="minConfidence" name="minConfidence" type="number" min="0" max="100" value={node.data.node_data?.minConfidence || 50} onChange={handleInputChange} className="p-2 border rounded w-full mt-1" />
            </div>
            <div className="flex items-center gap-2">
              <input id="includePatternAnalysis" name="includePatternAnalysis" type="checkbox" checked={node.data.node_data?.includePatternAnalysis !== false} onChange={(e) => handleInputChange({ target: { name: "includePatternAnalysis", value: e.target.checked } })} className="w-4 h-4" />
              <label htmlFor="includePatternAnalysis">Include Historical Pattern Analysis</label>
            </div>
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-3 text-xs">
              <p className="font-semibold text-amber-700 mb-1">🧠 Pattern Recognition</p>
              <p className="text-slate-600">Matches news against historical patterns like ETF approvals (+15% avg), exchange hacks (-8% avg), regulatory news, and more.</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600">
              <p className="font-semibold mb-1">📊 Output Signals</p>
              <p>STRONG_BUY, BUY, HOLD, SELL, STRONG_SELL based on sentiment analysis and pattern matching.</p>
            </div>
          </div>
        );
      default:
        return <p>No settings available for this node.</p>;
    }
  };

  return (
    <aside className="w-80 bg-white p-4 border-l border-slate-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Settings</h3>
        <button
          onClick={onDeselect}
          className="p-1 hover:bg-slate-200 rounded-full"
        >
          <X size={20} />
        </button>
      </div>
      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor="label" className="font-semibold">
            Label
          </label>
          <input
            id="label"
            name="label"
            value={node.data.label}
            onChange={handleLabelChange}
            className="p-2 border rounded w-full mt-1"
          />
        </div>
        <hr />
        {renderSettings()}
      </div>
    </aside>
  );
}
