import React, { useState, useEffect, useCallback } from "react";
import {
  X, Filter, Download, RefreshCw, ExternalLink, TrendingUp, TrendingDown,
  DollarSign, Activity, Clock, CheckCircle, AlertCircle, Loader,
  ArrowUpCircle, ArrowDownCircle, Zap, Calendar
} from "lucide-react";
import { useAccount } from "wagmi";

/**
 * Transaction Monitoring Dashboard
 * PROMPT 14: Comprehensive transaction monitoring interface
 * Shows on-chain and off-chain activity in unified timeline view
 */
export default function TransactionDashboard({ isOpen, onClose }) {
  const { address } = useAccount();
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    totalDeposited: "0",
    totalDepositedFormatted: "0.0",
    totalPaid: "0",
    totalPaidFormatted: "0.0",
    totalTransactions: 0,
    depositsCount: 0,
    paymentsCount: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    type: "", // deposit, payment, execution
    chainId: "",
    status: "", // pending, completed, failed
    fromDate: "",
    toDate: ""
  });

  const [pagination, setPagination] = useState({
    offset: 0,
    limit: 50,
    total: 0,
    hasMore: false
  });

  // Fetch transactions
  const fetchTransactions = useCallback(async (resetOffset = false) => {
    if (!address) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: pagination.limit,
        offset: resetOffset ? 0 : pagination.offset,
        ...(filters.type && { type: filters.type }),
        ...(filters.chainId && { chainId: filters.chainId }),
        ...(filters.status && { status: filters.status }),
        ...(filters.fromDate && { fromDate: filters.fromDate }),
        ...(filters.toDate && { toDate: filters.toDate })
      });

      const response = await fetch(
        `http://localhost:3001/api/nexus/transactions/${address}?${params}`
      );

      if (!response.ok) throw new Error("Failed to fetch transactions");

      const data = await response.json();


      if (data.success) {
        setTransactions(data.transactions || []);
        if (data.summary) {
          setSummary(data.summary);
        }
        setPagination(prev => ({
          ...prev,
          total: data.pagination?.total || 0,
          hasMore: data.pagination?.hasMore || false,
          offset: resetOffset ? 0 : prev.offset
        }));
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error("[TransactionDashboard] Fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [address, pagination.limit, pagination.offset, filters]);
  // Initial load and auto-refresh
  useEffect(() => {
    if (isOpen && address) {
      fetchTransactions(true);

      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        fetchTransactions(false);
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [isOpen, address, filters, fetchTransactions]);

  // Export to CSV
  const exportToCSV = () => {
    if (transactions.length === 0) return;

    const headers = ["Timestamp", "Type", "Amount", "Chain", "Status", "TxHash"];
    const rows = transactions.map(tx => [
      new Date(tx.timestamp).toLocaleString(),
      tx.type,
      tx.amountFormatted,
      tx.chainName,
      tx.status,
      tx.txHash
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexus-transactions-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, offset: 0 }));
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      type: "",
      chainId: "",
      status: "",
      fromDate: "",
      toDate: ""
    });
  };

  // Load more
  const loadMore = () => {
    setPagination(prev => ({
      ...prev,
      offset: prev.offset + prev.limit
    }));
    fetchTransactions();
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
              <Activity className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Transactions</h2>
              <p className="text-amber-100 text-sm">Your activity history</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 gap-3 p-4 border-b border-slate-200">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <ArrowDownCircle className="text-green-600" size={18} />
                <p className="text-green-700 text-sm font-medium">Deposited</p>
              </div>
              <p className="text-green-900 text-xl font-bold">
                {parseFloat(summary.totalDepositedFormatted).toFixed(4)} CRO
              </p>
              <p className="text-green-600 text-xs mt-1">{summary.depositsCount} deposits</p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <ArrowUpCircle className="text-red-600" size={18} />
                <p className="text-red-700 text-sm font-medium">Spent</p>
              </div>
              <p className="text-red-900 text-xl font-bold">
                {parseFloat(summary.totalPaidFormatted).toFixed(4)} CRO
              </p>
              <p className="text-red-600 text-xs mt-1">{summary.paymentsCount} payments</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="text-blue-600" size={18} />
                <p className="text-blue-700 text-sm font-medium">Net Balance</p>
              </div>
              <p className="text-blue-900 text-xl font-bold">
                {(parseFloat(summary.totalDepositedFormatted) - parseFloat(summary.totalPaidFormatted)).toFixed(4)} CRO
              </p>
              <p className="text-blue-600 text-xs mt-1">Lifetime</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="text-purple-600" size={18} />
                <p className="text-purple-700 text-sm font-medium">Transactions</p>
              </div>
              <p className="text-purple-900 text-xl font-bold">
                {summary.totalTransactions}
              </p>
              <p className="text-purple-600 text-xs mt-1">All chains</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="p-4 border-b border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-slate-500" />
              <span className="text-slate-700 font-semibold text-sm">Filters</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fetchTransactions(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm"
                disabled={loading}
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors text-sm"
                disabled={transactions.length === 0}
              >
                <Download size={14} />
                Export
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange("type", e.target.value)}
              className="bg-white border border-slate-300 text-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Types</option>
              <option value="deposit">Deposits</option>
              <option value="payment">Payments</option>
            </select>

            <select
              value={filters.chainId}
              onChange={(e) => handleFilterChange("chainId", e.target.value)}
              className="bg-white border border-slate-300 text-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Chains</option>
              <option value="240">Cronos zkEVM</option>
              <option value="84532">Base Sepolia</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="bg-white border border-slate-300 text-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {(filters.type || filters.chainId || filters.status || filters.fromDate || filters.toDate) && (
            <button
              onClick={clearFilters}
              className="text-amber-600 hover:text-amber-700 text-xs font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Transactions List */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {loading && transactions.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="animate-spin text-amber-500" size={28} />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="mx-auto text-slate-300 mb-4" size={40} />
              <p className="text-slate-500 text-sm">No transactions found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx, index) => (
                <TransactionRow key={tx._id || index} tx={tx} />
              ))}
            </div>
          )}

          {/* Load More Button */}
          {pagination.offset + pagination.limit < pagination.total && (
            <button
              onClick={loadMore}
              className="w-full mt-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              disabled={loading}
            >
              {loading ? "Loading..." : "Load More"}
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 text-center text-slate-500 text-xs flex-shrink-0">
          Showing {transactions.length} of {pagination.total} transactions
        </div>
      </div>
    </>
  );
}

// Individual Transaction Row Component
function TransactionRow({ tx }) {
  const getTypeIcon = (type) => {
    switch (type) {
      case "deposit":
        return <ArrowDownCircle className="text-green-600" size={18} />;
      case "payment":
        return <ArrowUpCircle className="text-red-600" size={18} />;
      default:
        return <Zap className="text-blue-600" size={18} />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
            <CheckCircle size={10} />
            Completed
          </span>
        );
      case "pending":
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">
            <Clock size={10} />
            Pending
          </span>
        );
      case "failed":
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
            <AlertCircle size={10} />
            Failed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 hover:bg-slate-100 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div>{getTypeIcon(tx.type)}</div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-slate-800 font-semibold capitalize text-sm">{tx.type}</span>
              {getStatusBadge(tx.status)}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-slate-500 text-xs">
              <span>{tx.chainName}</span>
              <span>•</span>
              <span>{new Date(tx.timestamp).toLocaleString()}</span>
            </div>
          </div>

          <div className="text-right">
            <p className={`font-bold ${tx.type === "deposit" ? "text-green-700" : "text-red-700"}`}>
              {tx.type === "deposit" ? "+" : "-"}{tx.amountFormatted} {tx.symbol}
            </p>
            {tx.provider && (
              <p className="text-slate-500 text-xs mt-0.5">
                To: {tx.provider.substring(0, 6)}...{tx.provider.substring(38)}
              </p>
            )}
          </div>

          {tx.explorerUrl && (
            <a
              href={tx.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-600 hover:text-amber-700 transition-colors"
            >
              <ExternalLink size={16} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
