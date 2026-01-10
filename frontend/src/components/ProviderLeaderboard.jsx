import React, { useState, useEffect } from "react";
import {
  X, Trophy, TrendingUp, DollarSign, Users, Zap, ExternalLink,
  Search, Filter, Star, Award, RefreshCw, Info, BarChart
} from "lucide-react";

/**
 * Provider Analytics & Reputation Dashboard
 * PROMPT 16: Public-facing dashboard for data provider reputation and metrics
 */
export default function ProviderLeaderboard({ isOpen, onClose }) {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("totalEarnings"); // totalEarnings, successfulCalls, uniquePayers
  const [filterChain, setFilterChain] = useState("");

  // Fetch provider statistics
  const fetchProviders = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:3001/api/nexus/providers/stats");

      if (!response.ok) throw new Error("Failed to fetch provider stats");

      const data = await response.json();

      if (data.success) {
        setProviders(data.providers);
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error("[ProviderLeaderboard] Fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProviders();

      // Auto-refresh every 60 seconds
      const interval = setInterval(fetchProviders, 60000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Filter and sort providers
  const filteredProviders = providers
    .filter(p => {
      const matchesSearch = searchQuery === "" ||
        p.provider.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesChain = filterChain === "" ||
        p.chainId.toString() === filterChain;
      return matchesSearch && matchesChain;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "totalEarnings":
          return Number(BigInt(b.totalEarnings) - BigInt(a.totalEarnings));
        case "successfulCalls":
          return b.successfulCalls - a.successfulCalls;
        case "uniquePayers":
          return b.uniquePayers - a.uniquePayers;
        default:
          return 0;
      }
    });

  // Get rank badge color
  const getRankColor = (rank) => {
    if (rank === 1) return "from-yellow-400 to-amber-500";
    if (rank === 2) return "from-slate-300 to-slate-400";
    if (rank === 3) return "from-orange-400 to-amber-600";
    return "from-slate-600 to-slate-700";
  };

  // Get reputation score (simple calculation based on metrics)
  const getReputationScore = (provider) => {
    const earnings = Number(BigInt(provider.totalEarnings) / BigInt(10 ** 15)); // Scale down
    const calls = provider.successfulCalls;
    const payers = provider.uniquePayers;

    // Simple reputation formula
    const score = Math.min(100, (earnings / 1000) * 20 + calls * 2 + payers * 5);
    return Math.round(score);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Sliding Panel from Right */}
      <div className="fixed top-0 right-0 h-full w-[520px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Trophy className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Providers</h2>
              <p className="text-amber-100 text-sm">Reputation & analytics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* Compact Stats Overview */}
        <div className="grid grid-cols-2 gap-3 p-4 border-b border-slate-200 flex-shrink-0">
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Users className="text-purple-600" size={16} />
              <span className="text-purple-700 text-xs font-medium">Providers</span>
            </div>
            <p className="text-purple-900 text-lg font-bold mt-1">{providers.length}</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <DollarSign className="text-green-600" size={16} />
              <span className="text-green-700 text-xs font-medium">Earnings</span>
            </div>
            <p className="text-green-900 text-lg font-bold mt-1">
              {providers.reduce((sum, p) => sum + parseFloat(p.totalEarningsFormatted), 0).toFixed(2)} CRO
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Zap className="text-blue-600" size={16} />
              <span className="text-blue-700 text-xs font-medium">API Calls</span>
            </div>
            <p className="text-blue-900 text-lg font-bold mt-1">
              {providers.reduce((sum, p) => sum + p.successfulCalls, 0).toLocaleString()}
            </p>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Star className="text-amber-600" size={16} />
              <span className="text-amber-700 text-xs font-medium">Avg Score</span>
            </div>
            <p className="text-amber-900 text-lg font-bold mt-1">
              {providers.length > 0
                ? Math.round(providers.reduce((sum, p) => sum + getReputationScore(p), 0) / providers.length)
                : 0}
            </p>
          </div>
        </div>

        {/* Filters & Search - Compact */}
        <div className="p-4 border-b border-slate-200 flex-shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-slate-500" />
              <span className="text-slate-700 font-medium text-sm">Filter & Sort</span>
            </div>
            <button
              onClick={fetchProviders}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm"
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search provider..."
              className="w-full bg-white border border-slate-300 text-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-slate-300 text-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="totalEarnings">By Earnings</option>
              <option value="successfulCalls">By API Calls</option>
              <option value="uniquePayers">By Payers</option>
            </select>

            <select
              value={filterChain}
              onChange={(e) => setFilterChain(e.target.value)}
              className="bg-white border border-slate-300 text-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Chains</option>
              <option value="240">Cronos zkEVM</option>
              <option value="84532">Base Sepolia</option>
            </select>
          </div>
        </div>

        {/* Provider List */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {loading && providers.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500"></div>
            </div>
          ) : filteredProviders.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="mx-auto text-slate-300 mb-4" size={40} />
              <p className="text-slate-500 text-sm">No providers found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProviders.map((provider) => (
                <ProviderCard
                  key={`${provider.provider}-${provider.chainId}`}
                  provider={provider}
                  rankColor={getRankColor(provider.rank)}
                  reputationScore={getReputationScore(provider)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 flex-shrink-0">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Showing {filteredProviders.length} of {providers.length} providers</span>
            <span className="flex items-center gap-1">
              <Info size={12} />
              Updates every 60s
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

// Provider Card Component
function ProviderCard({ provider, rankColor, reputationScore }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 hover:bg-slate-100 transition-all">
      <div className="flex items-start gap-3">
        {/* Rank Badge */}
        <div className={`flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br ${rankColor} text-white font-bold text-lg shadow-md`}>
          #{provider.rank}
        </div>

        {/* Provider Info */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-slate-800 font-bold font-mono text-sm">
                  {provider.provider.substring(0, 8)}...{provider.provider.substring(provider.provider.length - 6)}
                </span>
                {provider.rank <= 3 && (
                  <Award className="text-amber-500" size={16} />
                )}
              </div>
              <span className="text-slate-500 text-xs">{provider.chainName}</span>
            </div>

            {/* Reputation Score */}
            <div className="text-right">
              <div className="flex items-center gap-1 justify-end">
                <Star className="text-amber-500 fill-amber-500" size={14} />
                <span className="text-amber-600 font-bold">{reputationScore}</span>
              </div>
              <span className="text-slate-400 text-xs">Score</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="bg-green-50 rounded-lg p-2">
              <div className="flex items-center gap-1">
                <DollarSign className="text-green-600" size={12} />
                <span className="text-green-700 text-xs font-medium">Earnings</span>
              </div>
              <p className="text-green-900 font-bold text-sm">{parseFloat(provider.totalEarningsFormatted).toFixed(4)}</p>
            </div>

            <div className="bg-blue-50 rounded-lg p-2">
              <div className="flex items-center gap-1">
                <Zap className="text-blue-600" size={12} />
                <span className="text-blue-700 text-xs font-medium">Calls</span>
              </div>
              <p className="text-blue-900 font-bold text-sm">{provider.successfulCalls.toLocaleString()}</p>
            </div>

            <div className="bg-purple-50 rounded-lg p-2">
              <div className="flex items-center gap-1">
                <Users className="text-purple-600" size={12} />
                <span className="text-purple-700 text-xs font-medium">Payers</span>
              </div>
              <p className="text-purple-900 font-bold text-sm">{provider.uniquePayers}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex-1 py-1.5 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors text-xs font-medium"
            >
              {showDetails ? "Hide Details" : "View Details"}
            </button>
            <a
              href={`https://explorer.zkevm.cronos.org/testnet/address/${provider.provider}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors text-xs font-medium flex items-center gap-1"
            >
              Explorer
              <ExternalLink size={12} />
            </a>
          </div>

          {/* Expanded Details */}
          {showDetails && (
            <div className="mt-3 pt-3 border-t border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Last Payment</span>
                <span className="text-slate-800">
                  {provider.lastPayment ? new Date(provider.lastPayment).toLocaleString() : "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Average per Call</span>
                <span className="text-slate-800">
                  {(parseFloat(provider.totalEarningsFormatted) / provider.successfulCalls).toFixed(6)} {provider.symbol}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Full Address</span>
                <span className="text-slate-800 font-mono text-xs">{provider.provider}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
