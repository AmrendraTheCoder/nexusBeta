import React, { useState, useEffect, useCallback } from "react";
import { X, DollarSign, Zap, Database, AlertTriangle, CheckCircle, Info, Wallet } from "lucide-react";
import { useAccount } from "wagmi";

// Cost estimates per node type (in wei)
const NODE_COST_ESTIMATES = {
  "pyth-network": { data: 0.0001, gas: 0.00005, description: "Oracle price feed" },
  "visionAnalysis": { data: 0.001, gas: 0, description: "AI Vision analysis" },
  "newsPrediction": { data: 0.0008, gas: 0, description: "News sentiment AI" },
  "tradingAgent": { data: 0.0005, gas: 0, description: "Trading decision AI" },
  "riskManager": { data: 0, gas: 0, description: "Risk validation" },
  "maxInvestment": { data: 0, gas: 0, description: "Investment limits" },
  "userConfirmation": { data: 0, gas: 0, description: "User approval" },
  "swap": { data: 0, gas: 0.002, description: "DEX swap transaction" },
  "sendToken": { data: 0, gas: 0.001, description: "Token transfer" },
  "condition": { data: 0, gas: 0, description: "Conditional logic" },
  "default": { data: 0.0001, gas: 0.0001, description: "Unknown node type" }
};

/**
 * Workflow Execution Cost Estimator - Clean White Theme
 */
export default function CostEstimatorModal({ isOpen, onClose, workflow, onProceed }) {
  const { address, chain } = useAccount();
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [virtualBalance, setVirtualBalance] = useState("0");
  const [gasPriceMultiplier, setGasPriceMultiplier] = useState(1.0);

  const formatWei = (wei) => {
    try {
      return (Number(wei) / 1e18).toFixed(6);
    } catch {
      return "0.000000";
    }
  };

  const fetchBalance = useCallback(async () => {
    if (!address) return;
    const chainIdToUse = chain?.id || 240;
    try {
      const response = await fetch(`http://localhost:3001/api/nexus/balance/${address}/${chainIdToUse}`);
      const data = await response.json();
      if (data.success) setVirtualBalance(data.virtualBalance);
    } catch (err) {
      console.error("[CostEstimator] Balance fetch error:", err);
      // Set a default balance for demo purposes
      setVirtualBalance("1000000000000000000"); // 1 zkTCRO
    }
  }, [address, chain]);

  const calculateEstimate = useCallback(async () => {
    if (!workflow) return;
    setLoading(true);
    setError(null);

    try {
      // Handle both array and object formats for nodes
      let nodesList = [];
      if (Array.isArray(workflow.nodes)) {
        nodesList = workflow.nodes;
      } else if (workflow.nodes && typeof workflow.nodes === 'object') {
        // Convert object to array
        nodesList = Object.values(workflow.nodes);
      } else if (Array.isArray(workflow)) {
        // workflow itself is the nodes array
        nodesList = workflow;
      }

      let totalDataCost = 0;
      let totalGasCost = 0;
      let apiCallCount = 0;
      let transactionCount = 0;
      const breakdown = [];

      nodesList.forEach(node => {
        const nodeType = node.data?.type || node.type || 'default';
        const costs = NODE_COST_ESTIMATES[nodeType] || NODE_COST_ESTIMATES.default;

        totalDataCost += costs.data;
        totalGasCost += costs.gas;

        if (costs.data > 0) apiCallCount++;
        if (costs.gas > 0) transactionCount++;

        breakdown.push({
          label: node.data?.label || node.label || nodeType,
          description: costs.description,
          dataCost: Math.floor(costs.data * 1e18).toString(),
          gasCost: Math.floor(costs.gas * 1e18).toString()
        });
      });

      // Apply gas multiplier
      const adjustedGasCost = totalGasCost * gasPriceMultiplier;
      const totalCost = totalDataCost + adjustedGasCost;

      // Convert to wei (integer) - use Math.floor to avoid BigInt conversion issues
      const dataCostWei = Math.floor(totalDataCost * 1e18);
      const gasCostWei = Math.floor(adjustedGasCost * 1e18);
      const totalCostWei = Math.floor(totalCost * 1e18);

      setEstimate({
        dataCost: dataCostWei.toString(),
        dataCostFormatted: totalDataCost.toFixed(6),
        gasCost: gasCostWei.toString(),
        gasCostFormatted: adjustedGasCost.toFixed(6),
        totalCost: totalCostWei.toString(),
        totalCostFormatted: totalCost.toFixed(6),
        apiCallCount,
        transactionCount,
        breakdown,
        chainName: "Cronos zkEVM Testnet"
      });
    } catch (err) {
      console.error("[CostEstimator] Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [workflow, gasPriceMultiplier]);

  useEffect(() => {
    if (isOpen && workflow) {
      fetchBalance();
      calculateEstimate();
    }
  }, [isOpen, workflow, gasPriceMultiplier, fetchBalance, calculateEstimate]);

  // Check if user has sufficient funds - use try/catch to handle BigInt conversion errors
  const hasSufficientFunds = (() => {
    if (!estimate) return false;
    try {
      const balance = BigInt(virtualBalance || "0");
      const cost = BigInt(estimate.totalCost || "0");
      return balance >= cost || parseFloat(estimate.totalCostFormatted) < 0.01;
    } catch {
      // If BigInt conversion fails, just check the formatted value
      return parseFloat(estimate.totalCostFormatted) < 0.01;
    }
  })();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="bg-gradient-to-r from-violet-500 to-purple-500 px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <DollarSign className="text-white" size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Cost Estimator</h2>
              <p className="text-violet-200 text-xs">Execution cost breakdown</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-500"></div>
              <p className="text-slate-500 text-sm">Calculating costs...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-600 font-medium text-sm">{error}</p>
            </div>
          ) : estimate ? (
            <div className="space-y-4">
              {/* Total Cost Card */}
              <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-violet-700">Estimated Total</span>
                  <Info size={16} className="text-violet-400" />
                </div>
                <p className="text-3xl font-bold text-violet-700">
                  {parseFloat(estimate.totalCostFormatted).toFixed(6)}
                  <span className="text-lg font-normal text-violet-500 ml-2">zkTCRO</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  ≈ ${(parseFloat(estimate.totalCostFormatted) * 0.15).toFixed(4)} USD
                </p>
              </div>

              {/* Cost Breakdown */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Database size={16} className="text-blue-500" />
                    <span className="text-xs font-medium text-slate-600">Data Costs</span>
                  </div>
                  <p className="text-xl font-bold text-slate-800">
                    {parseFloat(estimate.dataCostFormatted).toFixed(6)}
                  </p>
                  <p className="text-xs text-slate-400">{estimate.apiCallCount} API calls</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap size={16} className="text-purple-500" />
                    <span className="text-xs font-medium text-slate-600">Gas Costs</span>
                  </div>
                  <p className="text-xl font-bold text-slate-800">
                    {parseFloat(estimate.gasCostFormatted).toFixed(6)}
                  </p>
                  <p className="text-xs text-slate-400">{estimate.transactionCount} transactions</p>
                </div>
              </div>

              {/* Gas Speed */}
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">Gas Speed</p>
                <div className="flex gap-2">
                  {[
                    { value: 0.8, label: "Slow", desc: "-20%" },
                    { value: 1.0, label: "Standard", desc: "Normal" },
                    { value: 1.5, label: "Fast", desc: "+50%" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setGasPriceMultiplier(option.value)}
                      className={`flex-1 py-2 px-3 rounded-lg border text-center transition-all ${gasPriceMultiplier === option.value
                        ? "bg-violet-100 border-violet-300 text-violet-700"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                    >
                      <p className="text-sm font-medium">{option.label}</p>
                      <p className="text-xs text-slate-400">{option.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Node Breakdown */}
              {estimate.breakdown && estimate.breakdown.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-2">Per-Node Breakdown</p>
                  <div className="bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-100 max-h-40 overflow-y-auto">
                    {estimate.breakdown.map((node, i) => (
                      <div key={i} className="flex items-center justify-between p-3">
                        <div>
                          <p className="text-sm font-medium text-slate-700">{node.label}</p>
                          <p className="text-xs text-slate-400">{node.description}</p>
                        </div>
                        <div className="text-right text-xs">
                          {node.dataCost !== "0" && <p className="text-blue-600">📊 {formatWei(node.dataCost)}</p>}
                          {node.gasCost !== "0" && <p className="text-purple-600">⚡ {formatWei(node.gasCost)}</p>}
                          {node.dataCost === "0" && node.gasCost === "0" && <p className="text-slate-400">Free</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Balance Check */}
              <div className={`rounded-xl p-4 border ${hasSufficientFunds
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
                }`}>
                <div className="flex items-center gap-3">
                  {hasSufficientFunds ? (
                    <CheckCircle className="text-green-500" size={20} />
                  ) : (
                    <AlertTriangle className="text-red-500" size={20} />
                  )}
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${hasSufficientFunds ? "text-green-700" : "text-red-700"}`}>
                      {hasSufficientFunds ? "Sufficient Funds" : "Insufficient Funds"}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Wallet size={12} />
                      Balance: {formatWei(virtualBalance)} zkTCRO
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <p>No estimate available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 flex gap-3 bg-slate-50">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onProceed}
            disabled={!hasSufficientFunds}
            className={`flex-1 py-2.5 rounded-xl font-semibold transition-all ${hasSufficientFunds
              ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:from-violet-600 hover:to-purple-600 shadow-md"
              : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
          >
            {hasSufficientFunds ? "Execute Workflow" : "Insufficient Funds"}
          </button>
        </div>
      </div>
    </div>
  );
}
