import React, { useState, useEffect } from 'react';
import { Play, Square, Settings, Activity, TrendingUp, AlertCircle, Clock, Zap } from 'lucide-react';

/**
 * AutomatedTradingManager - Component for managing 24/7 automated trading workflows
 */
export default function AutomatedTradingManager({ workflowData, onClose, walletAddress }) {
  const [isRunning, setIsRunning] = useState(false);
  const [interval, setInterval] = useState(300); // Default 5 minutes
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    totalExecutions: 0,
    successfulTrades: 0,
    totalProfit: 0,
    lastExecution: null
  });

  const startAutomatedTrading = async () => {
    const API_URL = import.meta.env.VITE_ENGINE_URL || import.meta.env.VITE_API_URL || "http://localhost:8080";

    try {
      const response = await fetch(`${API_URL}/workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletaddr: walletAddress,
          type: "repeat", // Changed from "once" to "repeat"
          repeatInterval: interval * 1000, // Convert to milliseconds
          nodes: workflowData.nodes,
          edges: workflowData.edges,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        setIsRunning(true);
        addLog('success', '24/7 Automated Trading Bot Started');
        startLogPolling();
      } else {
        addLog('error', `Failed to start: ${result.error}`);
      }
    } catch (error) {
      addLog('error', `Error: ${error.message}`);
    }
  };

  const stopAutomatedTrading = async () => {
    const API_URL = import.meta.env.VITE_ENGINE_URL || import.meta.env.VITE_API_URL || "http://localhost:8080";

    try {
      const response = await fetch(`${API_URL}/workflow/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletaddr: walletAddress }),
      });

      if (response.ok) {
        setIsRunning(false);
        addLog('info', '24/7 Automated Trading Bot Stopped');
      }
    } catch (error) {
      addLog('error', `Error stopping: ${error.message}`);
    }
  };

  const startLogPolling = () => {
    const API_URL = import.meta.env.VITE_ENGINE_URL || import.meta.env.VITE_API_URL || "http://localhost:8080";

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${API_URL}/logs/${walletAddress}`);
        const data = await response.json();

        if (data.logs && data.logs.length > 0) {
          // Update logs
          setLogs(data.logs.slice(-50)); // Keep last 50 logs

          // Update stats
          setStats(prev => ({
            ...prev,
            totalExecutions: prev.totalExecutions + 1,
            lastExecution: new Date().toISOString()
          }));
        }
      } catch (error) {
        console.error('Error polling logs:', error);
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(pollInterval);
  };

  const addLog = (type, message) => {
    setLogs(prev => [...prev, {
      timestamp: new Date().toISOString(),
      type,
      message
    }]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-lg rounded-lg p-3">
                <Activity size={28} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">24/7 Automated Trading Bot</h2>
                <p className="text-violet-100">Continuous market monitoring & automated execution</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 text-white rounded-lg px-4 py-2 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Control Panel */}
          <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-6 border-2 border-violet-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Settings size={20} className="text-violet-600" />
              Control Panel
            </h3>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Monitoring Interval
                </label>
                <select
                  value={interval}
                  onChange={(e) => setInterval(Number(e.target.value))}
                  disabled={isRunning}
                  className="w-full border-2 border-slate-300 rounded-lg px-4 py-2 focus:border-violet-500 focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  <option value={60}>1 minute</option>
                  <option value={300}>5 minutes</option>
                  <option value={900}>15 minutes</option>
                  <option value={1800}>30 minutes</option>
                  <option value={3600}>1 hour</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Bot Status
                </label>
                <div className="flex items-center gap-3">
                  {isRunning ? (
                    <>
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-green-600 font-bold">RUNNING</span>
                    </>
                  ) : (
                    <>
                      <div className="w-3 h-3 bg-slate-400 rounded-full" />
                      <span className="text-slate-600 font-bold">STOPPED</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-4">
              {!isRunning ? (
                <button
                  onClick={startAutomatedTrading}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl px-6 py-3 font-bold transition-all shadow-lg"
                >
                  <Play size={20} />
                  Start 24/7 Bot
                </button>
              ) : (
                <button
                  onClick={stopAutomatedTrading}
                  className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-xl px-6 py-3 font-bold transition-all shadow-lg"
                >
                  <Square size={20} />
                  Stop Bot
                </button>
              )}

              <div className="text-sm text-slate-600">
                <Clock size={16} className="inline mr-1" />
                Checks market every <strong>{interval / 60} minutes</strong>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-4 gap-4">
            <StatCard icon={Activity} label="Total Checks" value={stats.totalExecutions} color="blue" />
            <StatCard icon={TrendingUp} label="Trades Executed" value={stats.successfulTrades} color="green" />
            <StatCard icon={Zap} label="Win Rate" value="--%" color="violet" />
            <StatCard icon={AlertCircle} label="Last Check" value={stats.lastExecution ? new Date(stats.lastExecution).toLocaleTimeString() : 'N/A'} color="slate" />
          </div>

          {/* Live Logs */}
          <div className="bg-slate-900 rounded-xl p-6 text-white">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Activity size={20} className="text-green-400" />
              Live Activity Log
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-slate-400 italic">No activity yet. Start the bot to begin monitoring.</p>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm border-b border-slate-700 pb-2">
                    <span className="text-slate-500 text-xs">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${log.type === 'success' ? 'bg-green-500/20 text-green-400' :
                        log.type === 'error' ? 'bg-red-500/20 text-red-400' :
                          'bg-blue-500/20 text-blue-400'
                      }`}>
                      {log.type.toUpperCase()}
                    </span>
                    <span className="text-slate-300 flex-1">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle size={24} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-900 mb-1">Important Notice</h4>
              <p className="text-amber-800 text-sm leading-relaxed">
                This bot will automatically execute trades based on AI predictions. Ensure you have sufficient funds and understand the risks involved.
                The bot will continuously monitor markets at the specified interval and execute trades when conditions are met. Monitor regularly and stop if needed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const colorClasses = {
    blue: 'from-blue-50 to-cyan-50 border-blue-200',
    green: 'from-green-50 to-emerald-50 border-green-200',
    violet: 'from-violet-50 to-purple-50 border-violet-200',
    slate: 'from-slate-50 to-gray-50 border-slate-200'
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl p-4 border-2`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} className={`text-${color}-600`} />
        <span className="text-xs font-medium text-slate-600">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  );
}
