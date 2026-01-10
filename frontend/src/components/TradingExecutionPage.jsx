import React, { useState, useEffect, useRef } from "react";
import { 
  ArrowLeft, TrendingUp, TrendingDown, Activity, DollarSign, Shield, Eye, 
  Zap, Clock, CheckCircle, XCircle, AlertTriangle, Newspaper, 
  BarChart3, LineChart, ArrowUpRight, ArrowDownRight, CircleDot,
  PlayCircle, PauseCircle, Sparkles, Brain, Target, MessageSquare, Maximize2
} from "lucide-react";
import LiveUpdateBanner from "./LiveUpdateBanner";

/**
 * Parse workflow logs to extract actual trading data
 */
function parseWorkflowLogs(logs) {
  console.log('[TradingPage] ========== PARSING LOGS ==========');
  console.log('[TradingPage] Logs count:', logs?.length || 0);
  console.log('[TradingPage] Logs type:', typeof logs, 'Array?', Array.isArray(logs));
  
  const result = {
    price: 0,
    visionSentiment: null,
    visionConfidence: 0,
    visionAction: null,
    visionPatterns: null,
    visionReasoning: null,
    newsSentiment: null,
    newsConfidence: 0,
    tradingSignal: null,
    tradingConfidence: 0,
    tradingReasoning: null,
    entryPrice: 0,
    stopLoss: 0,
    takeProfit: 0,
    riskApproved: false,
    investmentApproved: false
  };

  if (!logs || !Array.isArray(logs)) {
    console.log('[TradingPage] ❌ No valid logs array');
    return result;
  }

  console.log('[TradingPage] Processing', logs.length, 'log entries...');
  
  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];
    const msg = log.message || log.msg || log.text || String(log);
    
    if (!msg) continue;

    // Parse price
    if (msg.includes('💰 Current Price:') || msg.includes('Current Price:')) {
      const match = msg.match(/\$([0-9,]+\.?[0-9]*)/);
      if (match) {
        result.price = parseFloat(match[1].replace(/,/g, ''));
        console.log('[TradingPage] ✅ Found price:', result.price);
      }
    }

    // Parse Vision Analysis
    if (msg.includes('📊 [VisionAnalysis] Results:')) {
      // Look ahead for the next few lines
      for (let j = i + 1; j < Math.min(i + 10, logs.length); j++) {
        const nextMsg = logs[j].message || '';
        
        if (nextMsg.includes('Sentiment:')) {
          const match = nextMsg.match(/Sentiment:\s*([A-Z]+)/);
          if (match) result.visionSentiment = match[1];
        }
        if (nextMsg.includes('Confidence:')) {
          const match = nextMsg.match(/([0-9.]+)%/);
          if (match) result.visionConfidence = parseFloat(match[1]);
        }
        if (nextMsg.includes('Action:')) {
          const match = nextMsg.match(/Action:\s*([A-Z]+)/);
          if (match) result.visionAction = match[1];
        }
        if (nextMsg.includes('Patterns:')) {
          const match = nextMsg.match(/Patterns:\s*(.+)/);
          if (match) result.visionPatterns = match[1].trim();
        }
      }
      console.log('[TradingPage] Found Vision:', result.visionSentiment, result.visionConfidence + '%', result.visionAction);
    }

    // Parse Vision reasoning from auto-wire
    if (msg.includes('🔗 [Auto-wire] analysis (') && !result.visionReasoning) {
      const match = msg.match(/analysis \((.+)\) → Node/);
      if (match) {
        result.visionReasoning = match[1];
        console.log('[TradingPage] Found Vision reasoning:', result.visionReasoning.substring(0, 100) + '...');
      }
    }

    // Parse News Analysis
    if (msg.includes('📊 News Analysis Results:')) {
      for (let j = i + 1; j < Math.min(i + 10, logs.length); j++) {
        const nextMsg = logs[j].message || '';
        
        if (nextMsg.includes('Overall Sentiment:')) {
          const match = nextMsg.match(/sentiment:\s*([a-z]+)/i);
          if (match) result.newsSentiment = match[1];
        }
        if (nextMsg.includes('Confidence:') && !nextMsg.includes('VisionAnalysis')) {
          const match = nextMsg.match(/([0-9]+)%/);
          if (match) result.newsConfidence = parseFloat(match[1]);
        }
      }
      console.log('[TradingPage] Found News:', result.newsSentiment, result.newsConfidence + '%');
    }

    // Parse Trading Agent Signal
    if (msg.includes('📊 [TradingAgent] Signal Generated:')) {
      for (let j = i + 1; j < Math.min(i + 10, logs.length); j++) {
        const nextMsg = logs[j].message || '';
        
        if (nextMsg.includes('Action:')) {
          const match = nextMsg.match(/Action:\s*([A-Z]+)/);
          if (match) result.tradingSignal = match[1];
        }
        if (nextMsg.includes('Confidence:')) {
          const match = nextMsg.match(/([0-9.]+)%/);
          if (match) result.tradingConfidence = parseFloat(match[1]);
        }
        if (nextMsg.includes('Entry:')) {
          const match = nextMsg.match(/\$([0-9,.]+)/);
          if (match) result.entryPrice = parseFloat(match[1].replace(/,/g, ''));
        }
        if (nextMsg.includes('Stop Loss:')) {
          const match = nextMsg.match(/\$([0-9,.]+)/);
          if (match) result.stopLoss = parseFloat(match[1].replace(/,/g, ''));
        }
        if (nextMsg.includes('Take Profit:')) {
          const match = nextMsg.match(/\$([0-9,.]+)/);
          if (match) result.takeProfit = parseFloat(match[1].replace(/,/g, ''));
        }
        if (nextMsg.includes('Reasoning:')) {
          const match = nextMsg.split('Reasoning:')[1];
          if (match) result.tradingReasoning = match.trim();
        }
      }
      console.log('[TradingPage] Found Trading Signal:', result.tradingSignal, result.tradingConfidence + '%');
    }

    // Parse Risk Manager
    if (msg.includes('✅') && msg.includes('RiskManager')) {
      result.riskApproved = true;
    }

    // Parse Investment
    if (msg.includes('✅ Investment approved:')) {
      result.investmentApproved = true;
    }
  }

  console.log('[TradingPage] Parsed result:', result);
  return result;
}

/**
 * Comprehensive Trading Execution Page
 * Shows complete trading flow, AI analysis, market data, and execution status
 */
export default function TradingExecutionPage({ onClose, workflowResult }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [executionStage, setExecutionStage] = useState(0);
  const [isExecuting, setIsExecuting] = useState(true);
  const [parsedData, setParsedData] = useState(null);
  const [countdown, setCountdown] = useState(300); // 5 minutes = 300 seconds
  const [cycleCount, setCycleCount] = useState(1);

  // Countdown timer for next execution
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setCycleCount(c => c + 1);
          return 300; // Reset to 5 minutes
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Parse logs on mount or when workflowResult changes
  useEffect(() => {
    console.log('[TradingPage] ========== COMPONENT MOUNTED ==========');
    console.log('[TradingPage] workflowResult type:', typeof workflowResult);
    console.log('[TradingPage] workflowResult is array?', Array.isArray(workflowResult));
    console.log('[TradingPage] workflowResult:', workflowResult);
    
    // Check if workflowResult has logs array
    let logs = [];
    if (Array.isArray(workflowResult)) {
      logs = workflowResult;
      console.log('[TradingPage] Using workflowResult as logs array, length:', logs.length);
    } else if (workflowResult?.logs) {
      logs = workflowResult.logs;
      console.log('[TradingPage] Using workflowResult.logs, length:', logs.length);
    } else if (typeof workflowResult === 'object') {
      // Try to find logs in the object
      logs = Object.values(workflowResult).find(v => Array.isArray(v)) || [];
      console.log('[TradingPage] Found logs in object values, length:', logs.length);
    }
    
    // Debug first few log entries
    if (logs.length > 0) {
      console.log('[TradingPage] First 3 log entries:');
      logs.slice(0, 3).forEach((log, i) => {
        console.log(`  [${i}] type: ${typeof log}, keys: ${Object.keys(log || {}).join(', ')}`);
        console.log(`  [${i}] content:`, log);
      });
    }
    
    console.log('[TradingPage] Calling parseWorkflowLogs with', logs.length, 'entries');
    const parsed = parseWorkflowLogs(logs);
    console.log('[TradingPage] Parsed result:', parsed);
    setParsedData(parsed);
  }, [workflowResult]);

  // Use parsed data or fallback to NO DATA
  const signal = parsedData?.tradingSignal || "NO DATA";
  const confidence = parsedData?.tradingConfidence || 0;
  const currentPrice = parsedData?.price || parsedData?.entryPrice || 0;
  const stopLoss = parsedData?.stopLoss || 0;
  const takeProfit = parsedData?.takeProfit || 0;
  const visionAnalysis = parsedData?.visionReasoning || "No vision analysis available";
  const riskApproved = parsedData?.riskApproved || false;
  const prediction = parsedData?.tradingReasoning || visionAnalysis || "No prediction available";

  console.log('[TradingPage] Displaying:', { signal, confidence, currentPrice, stopLoss, takeProfit });

  // Simulate execution stages
  useEffect(() => {
    if (isExecuting) {
      const stages = [
        { delay: 500, stage: 1 },
        { delay: 1200, stage: 2 },
        { delay: 1800, stage: 3 },
        { delay: 2400, stage: 4 },
        { delay: 3200, stage: 5 }
      ];

      stages.forEach(({ delay, stage }) => {
        setTimeout(() => setExecutionStage(stage), delay);
      });

      setTimeout(() => setIsExecuting(false), 3500);
    }
  }, [isExecuting]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm">
      {/* Live Update Banner */}
      <LiveUpdateBanner 
        logs={Array.isArray(workflowResult) ? workflowResult : workflowResult?.logs || []}
        workflowType="repeat"
        isExecuting={isExecuting}
      />

      <div className="w-full h-full bg-gradient-to-br from-slate-50 via-white to-slate-50 overflow-auto">
        {/* Back Button - Sticky Header */}
        <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-lg border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:border-violet-400 text-slate-700 hover:text-violet-600 rounded-xl font-semibold transition-all shadow-sm hover:shadow-md group"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              Back to Workflow
            </button>
          </div>
        </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        
        {/* Trading Signal Card - Top Banner */}
        <div className={`rounded-2xl p-8 shadow-xl border-2 ${
          signal === 'BUY' ? 'bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 border-green-300' :
          signal === 'SELL' ? 'bg-gradient-to-br from-red-500 via-rose-500 to-pink-600 border-red-300' :
          'bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 border-slate-500'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-white/20 backdrop-blur-sm ${
                  signal === 'BUY' ? 'ring-2 ring-white/40' :
                  signal === 'SELL' ? 'ring-2 ring-white/40' :
                  'ring-2 ring-white/30'
                }`}>
                  {signal === 'BUY' ? <TrendingUp size={28} className="text-white" /> :
                   signal === 'SELL' ? <TrendingDown size={28} className="text-white" /> :
                   <Activity size={28} className="text-white" />}
                </div>
                <div>
                  <p className="text-white/80 text-sm font-medium flex items-center gap-2">
                    <Sparkles size={14} className="text-yellow-300" />
                    AI Trading Signal
                  </p>
                  <h2 className="text-5xl font-black text-white tracking-tight">{signal}</h2>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <span className="text-white/90 text-lg font-semibold">
                    {confidence.toFixed(0)}% Confidence
                  </span>
                </div>
                <div className="h-6 w-px bg-white/30" />
                <span className="text-white/80 text-lg font-medium">BTC/USD</span>
              </div>
            </div>
            <div className="text-right space-y-4">
              <div>
                <p className="text-white/70 text-sm font-medium mb-1">Current Price</p>
                <p className="text-6xl font-black text-white">${currentPrice.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur-md rounded-xl px-5 py-3 border border-white/30">
                  <p className="text-white/70 text-xs font-medium mb-1">Entry</p>
                  <p className="text-white font-bold text-lg">${currentPrice.toLocaleString()}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-md rounded-xl px-5 py-3 border border-white/30">
                  <p className="text-white/70 text-xs font-medium mb-1">Stop Loss</p>
                  <p className="text-white font-bold text-lg">${stopLoss.toFixed(0)}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-md rounded-xl px-5 py-3 border border-white/30">
                  <p className="text-white/70 text-xs font-medium mb-1">Take Profit</p>
                  <p className="text-white font-bold text-lg">${takeProfit.toFixed(0)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 🔄 REPEAT MODE BANNER - Show workflow will continue */}
        <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 rounded-2xl p-6 shadow-2xl border-2 border-purple-400">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <div className="relative">
                  <Zap size={32} className="text-white animate-pulse" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-ping"></span>
                </div>
              </div>
              <div>
                <h3 className="text-white font-bold text-2xl mb-1 flex items-center gap-2">
                  <span className="inline-block w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
                  24/7 Monitoring Active
                </h3>
                <p className="text-white/80 text-sm">
                  Cycle <span className="font-bold">#{cycleCount}</span> complete • 
                  Next analysis in <span className="font-mono font-bold">{Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}</span> • 
                  Auto-trading enabled
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-white/10 backdrop-blur-md rounded-xl px-6 py-4 border border-white/20">
                <p className="text-white/70 text-xs font-medium mb-1">Next Analysis In</p>
                <p className="text-white font-black text-4xl font-mono">
                  {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
                </p>
                <div className="mt-2 w-32 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-400 transition-all duration-1000 ease-linear"
                    style={{ width: `${((300 - countdown) / 300) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
          <div className="flex items-center gap-3 mb-4">
            <Activity size={24} className="text-blue-600 animate-pulse" />
            <h3 className="font-bold text-lg text-slate-800">Live Activity Stream</h3>
            <span className="ml-auto text-xs bg-green-500 text-white px-3 py-1 rounded-full font-bold animate-pulse">
              LIVE
            </span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            <div className="flex items-start gap-3 bg-white rounded-lg p-3 border border-blue-100">
              <CheckCircle size={18} className="text-green-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">Cycle #{cycleCount} Analysis Complete</p>
                <p className="text-xs text-slate-500">AI analyzed BTC market and generated {signal} signal with {confidence}% confidence</p>
              </div>
              <span className="text-xs text-slate-400">Just now</span>
            </div>
            <div className="flex items-start gap-3 bg-white rounded-lg p-3 border border-blue-100">
              <Clock size={18} className="text-purple-500 mt-0.5 animate-spin" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">Waiting for Next Cycle</p>
                <p className="text-xs text-slate-500">System will automatically fetch price, analyze charts, and make trading decision in {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}</p>
              </div>
              <span className="text-xs text-slate-400">Active</span>
            </div>
            <div className="flex items-start gap-3 bg-white rounded-lg p-3 border border-blue-100 opacity-60">
              <Activity size={18} className="text-blue-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">Continuous Operation</p>
                <p className="text-xs text-slate-500">Workflow running in repeat mode • Will execute indefinitely until manually stopped</p>
              </div>
              <span className="text-xs text-slate-400">Status</span>
            </div>
          </div>
        </div>

        {/* Tabs - Modern Design */}
        <div className="flex items-center gap-2 border-b-2 border-slate-200 bg-white rounded-t-xl overflow-hidden shadow-sm">
          {[
            { id: "overview", label: "Overview", icon: Activity },
            { id: "analysis", label: "AI Analysis", icon: Brain },
            { id: "market", label: "Market Data", icon: BarChart3 },
            { id: "execution", label: "Execution Flow", icon: PlayCircle },
            { id: "news", label: "News & Sentiment", icon: Newspaper }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-bold transition-all border-b-4 ${
                activeTab === tab.id
                  ? "border-violet-500 bg-violet-50 text-violet-700"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content - Clean White Background */}
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
          
          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Live Price Chart */}
              <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-6 border-2 border-slate-200 shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <LineChart size={20} className="text-violet-500" />
                      Live Price Chart
                    </h3>
                    <p className="text-slate-500 text-sm">BTC/USD • 1H</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900">${currentPrice}</p>
                    <p className="text-green-600 text-sm flex items-center gap-1 font-semibold">
                      <ArrowUpRight size={14} />
                      +2.4%
                    </p>
                  </div>
                </div>
                <PriceChart signal={signal} currentPrice={currentPrice} />
              </div>

              {/* AI Agents Status */}
              <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-6 border-2 border-violet-200 shadow-md">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <Brain size={20} className="text-violet-600" />
                  AI Agents Status
                </h3>
                <div className="space-y-3">
                  <AIAgentCard name="Market Analysis" status="completed" progress={100} />
                  <AIAgentCard name="Risk Assessment" status="completed" progress={100} />
                  <AIAgentCard name="Trade Execution" status="active" progress={executionStage * 20} />
                  <AIAgentCard name="Position Monitor" status="waiting" progress={0} />
                </div>
              </div>

              {/* Quick Stats */}
              <div className="lg:col-span-2 grid grid-cols-4 gap-4">
                <StatCard 
                  icon={DollarSign} 
                  label="Position Size" 
                  value="$10,000" 
                  change="+$234" 
                  positive={true}
                />
                <StatCard 
                  icon={Target} 
                  label="Risk/Reward" 
                  value="1:2.5" 
                  change="Optimal" 
                  positive={true}
                />
                <StatCard 
                  icon={Shield} 
                  label="Risk Level" 
                  value={riskApproved ? "Low" : "High"} 
                  change={riskApproved ? "Approved" : "Rejected"} 
                  positive={riskApproved}
                />
                <StatCard 
                  icon={Zap} 
                  label="Execution Speed" 
                  value="120ms" 
                  change="Fast" 
                  positive={true}
                />
              </div>

            </div>
          )}

          {/* AI ANALYSIS TAB */}
          {activeTab === "analysis" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-6 border-2 border-violet-200">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <Brain size={24} className="text-violet-600" />
                  AI Prediction & Analysis
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-slate-600 font-medium mb-2">Signal: <span className="text-2xl font-black text-violet-600">{signal}</span></p>
                    <p className="text-slate-600">Confidence: <span className="font-bold">{confidence.toFixed(0)}%</span></p>
                  </div>
                  {prediction && (
                    <div className="bg-white rounded-lg p-4 border border-violet-200">
                      <p className="text-slate-700 leading-relaxed">{prediction}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-4">
                    <AnalysisMetric label="Technical Score" value="8.5/10" color="green" />
                    <AnalysisMetric label="Sentiment Score" value="7.2/10" color="blue" />
                    <AnalysisMetric label="Risk Score" value="3.1/10" color="green" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <Target size={20} className="text-green-600" />
                  Key Insights
                </h3>
                <ul className="space-y-3">
                  <InsightItem text="Strong bullish momentum detected across multiple timeframes" positive={true} />
                  <InsightItem text="Support level confirmed at $93,500" positive={true} />
                  <InsightItem text="Volume increasing with price action" positive={true} />
                  <InsightItem text="RSI approaching overbought - monitor closely" positive={false} />
                </ul>
              </div>
            </div>
          )}

          {/* MARKET DATA TAB */}
          {activeTab === "market" && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <MarketMetric label="24h Volume" value="$42.3B" change="+12.5%" positive={true} />
                <MarketMetric label="Market Cap" value="$1.85T" change="+3.2%" positive={true} />
                <MarketMetric label="Volatility" value="Medium" change="Stable" positive={true} />
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-200">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <BarChart3 size={20} className="text-blue-600" />
                  Technical Indicators
                </h3>
                <div className="space-y-3">
                  <IndicatorRow name="RSI (14)" value="68.4" signal="BUY" />
                  <IndicatorRow name="MACD" value="Bullish Cross" signal="BUY" />
                  <IndicatorRow name="Moving Avg (50)" value="$92,450" signal="BUY" />
                  <IndicatorRow name="Bollinger Bands" value="Upper Band" signal="NEUTRAL" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border-2 border-orange-200">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <Activity size={20} className="text-orange-600" />
                  Order Book Analysis
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-600 text-sm mb-2">Buy Orders</p>
                    <p className="text-3xl font-bold text-green-600">62%</p>
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm mb-2">Sell Orders</p>
                    <p className="text-3xl font-bold text-red-600">38%</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* EXECUTION FLOW TAB */}
          {activeTab === "execution" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-6 border-2 border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
                  <PlayCircle size={20} className="text-violet-600" />
                  Execution Timeline
                </h3>
                <div className="space-y-4">
                  <ExecutionStage 
                    stage={1} 
                    title="Market Data Collection" 
                    completed={executionStage >= 1} 
                    time="0.5s"
                  />
                  <ExecutionStage 
                    stage={2} 
                    title="AI Prediction Generated" 
                    completed={executionStage >= 2} 
                    time="1.2s"
                  />
                  <ExecutionStage 
                    stage={3} 
                    title="Risk Checks Passed" 
                    completed={executionStage >= 3} 
                    time="1.8s"
                  />
                  <ExecutionStage 
                    stage={4} 
                    title="Trade Execution" 
                    completed={executionStage >= 4} 
                    time="2.4s"
                  />
                  <ExecutionStage 
                    stage={5} 
                    title="Trade Confirmed" 
                    completed={executionStage >= 5} 
                    time="3.2s"
                  />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <CheckCircle size={20} className="text-green-600" />
                  Trade Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <TradeDetail label="Entry Price" value={`$${currentPrice.toLocaleString()}`} />
                  <TradeDetail label="Position Size" value="0.105 BTC" />
                  <TradeDetail label="Stop Loss" value={`$${stopLoss.toFixed(0)}`} />
                  <TradeDetail label="Take Profit" value={`$${takeProfit.toFixed(0)}`} />
                  <TradeDetail label="Risk Amount" value="$500" />
                  <TradeDetail label="Potential Profit" value="$1,250" />
                </div>
              </div>
            </div>
          )}

          {/* NEWS & SENTIMENT TAB */}
          {activeTab === "news" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-200">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <Newspaper size={20} className="text-blue-600" />
                  Latest Market News
                </h3>
                <div className="space-y-3">
                  <NewsItem 
                    title="Bitcoin reaches new monthly high amid institutional buying"
                    source="CoinDesk"
                    time="5 min ago"
                    sentiment="positive"
                  />
                  <NewsItem 
                    title="Major exchange reports $2B in BTC withdrawals"
                    source="The Block"
                    time="15 min ago"
                    sentiment="positive"
                  />
                  <NewsItem 
                    title="Federal Reserve maintains interest rates"
                    source="Reuters"
                    time="1 hour ago"
                    sentiment="neutral"
                  />
                  <NewsItem 
                    title="Technical analysis suggests continuation pattern"
                    source="TradingView"
                    time="2 hours ago"
                    sentiment="positive"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <SentimentCard label="Overall Sentiment" value="Bullish" score={78} color="green" />
                <SentimentCard label="Social Media" value="Very Positive" score={85} color="green" />
                <SentimentCard label="News Sentiment" value="Positive" score={72} color="blue" />
              </div>
            </div>
          )}

        </div>

        {/* HOLD Signal Explanation */}
        {signal === 'HOLD' && !isExecuting && (
          <div className="mt-4 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 rounded-lg p-2">
                <MessageSquare size={20} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-blue-900 font-bold text-sm mb-1">Why No Trade Was Executed</h4>
                <p className="text-blue-700 text-sm leading-relaxed">
                  The AI trading agents analyzed current market conditions and determined that <strong>holding</strong> is the optimal strategy right now. 
                  This means the system is actively protecting your capital by waiting for better entry conditions rather than forcing a trade.
                  {visionAnalysis && visionAnalysis !== "No vision analysis available" && (
                    <span className="block mt-2 text-blue-600 italic">
                      "{visionAnalysis.substring(0, 200)}..."
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Action Bar - Sticky */}
        <div className="sticky bottom-0 mt-6 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-6 border-2 border-violet-200 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium mb-1">Trade Status</p>
              <div className="flex items-center gap-2">
                {isExecuting ? (
                  <>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
                    <span className="text-yellow-600 font-bold text-lg">Executing...</span>
                  </>
                ) : signal !== 'HOLD' && signal !== 'NO DATA' && riskApproved ? (
                  <>
                    <CheckCircle size={20} className="text-green-500" />
                    <span className="text-green-600 font-bold text-lg">Trade Executed Successfully</span>
                  </>
                ) : signal === 'HOLD' ? (
                  <>
                    <CircleDot size={20} className="text-blue-500" />
                    <span className="text-blue-600 font-bold text-lg">AI Recommends HOLD - No Trade Executed</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={20} className="text-amber-500" />
                    <span className="text-amber-600 font-bold text-lg">
                      {signal === 'NO DATA' ? 'Workflow Incomplete' : 'No Trade Executed (Analysis Only)'}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-6 py-3 bg-white border-2 border-violet-300 hover:border-violet-500 text-violet-700 hover:text-violet-800 rounded-xl font-bold transition-all shadow-sm hover:shadow-md flex items-center gap-2">
                <Maximize2 size={16} />
                View in Live Dashboard
              </button>
              <button 
                onClick={onClose}
                className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg"
              >
                Close & Continue
              </button>
            </div>
          </div>
        </div>

        {/* Execution Logs Footer - Show all logs from repeat cycles */}
        <div className="max-w-7xl mx-auto px-6 pb-6">
          <div className="bg-slate-900 rounded-xl shadow-2xl overflow-hidden border-2 border-slate-700">
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 border-b border-slate-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Activity size={20} className="text-green-400 animate-pulse" />
                  <h3 className="text-white font-bold text-lg">Execution Logs - All Cycles</h3>
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                    LIVE
                  </span>
                </div>
                <span className="text-slate-400 text-sm">
                  {Array.isArray(workflowResult) ? workflowResult.length : (workflowResult?.logs?.length || 0)} log entries
                </span>
              </div>
            </div>
            
            <div className="p-4 max-h-96 overflow-y-auto bg-slate-950 font-mono text-sm">
              {(Array.isArray(workflowResult) ? workflowResult : workflowResult?.logs || []).length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Activity size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No execution logs available yet</p>
                  <p className="text-xs mt-2">Logs will appear as the workflow executes</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {(Array.isArray(workflowResult) ? workflowResult : workflowResult?.logs || []).map((log, idx) => {
                    const msg = log.message || log.msg || log.text || String(log);
                    const isError = msg.includes('ERROR') || msg.includes('❌');
                    const isSuccess = msg.includes('SUCCESS') || msg.includes('✅') || msg.includes('✓');
                    const isWarning = msg.includes('WARNING') || msg.includes('⚠️');
                    const isInfo = msg.includes('ℹ️') || msg.includes('INFO');
                    const isCycle = msg.includes('[WORKFLOW]');
                    
                    let textColor = 'text-slate-300';
                    let bgColor = 'bg-transparent';
                    
                    if (isError) {
                      textColor = 'text-red-400';
                      bgColor = 'bg-red-950/30';
                    } else if (isSuccess) {
                      textColor = 'text-green-400';
                      bgColor = 'bg-green-950/30';
                    } else if (isWarning) {
                      textColor = 'text-yellow-400';
                      bgColor = 'bg-yellow-950/30';
                    } else if (isCycle) {
                      textColor = 'text-purple-400';
                      bgColor = 'bg-purple-950/30';
                    } else if (isInfo) {
                      textColor = 'text-blue-400';
                      bgColor = 'bg-blue-950/30';
                    }
                    
                    return (
                      <div key={idx} className={`px-3 py-2 rounded hover:bg-slate-800/50 transition-colors ${bgColor}`}>
                        <span className="text-slate-500 mr-3">{String(idx + 1).padStart(4, '0')}</span>
                        <span className={textColor}>{msg}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="bg-slate-800 px-6 py-3 border-t border-slate-700 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                💡 Tip: Logs update in real-time as workflow cycles repeat
              </span>
              <div className="flex items-center gap-4">
                <span className="text-green-400">✅ = Success</span>
                <span className="text-red-400">❌ = Error</span>
                <span className="text-purple-400">🔄 = Cycle</span>
              </div>
            </div>
          </div>
        </div>

        </div>
      </div>
    </div>
  );
}

// ==================== HELPER COMPONENTS ====================

function PriceChart({ signal, currentPrice }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Generate price data
    const points = 50;
    const data = [];
    let price = currentPrice - 2000;
    for (let i = 0; i < points; i++) {
      price += (Math.random() - 0.4) * 500;
      data.push(price);
    }

    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    if (signal === 'BUY') {
      gradient.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
      gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
    } else if (signal === 'SELL') {
      gradient.addColorStop(0, 'rgba(239, 68, 68, 0.2)');
      gradient.addColorStop(1, 'rgba(239, 68, 68, 0.0)');
    } else {
      gradient.addColorStop(0, 'rgba(100, 116, 139, 0.2)');
      gradient.addColorStop(1, 'rgba(100, 116, 139, 0.0)');
    }

    // Draw line
    ctx.beginPath();
    const maxPrice = Math.max(...data);
    const minPrice = Math.min(...data);
    const priceRange = maxPrice - minPrice;

    data.forEach((price, index) => {
      const x = (index / (points - 1)) * width;
      const y = height - ((price - minPrice) / priceRange) * height;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.strokeStyle = signal === 'BUY' ? '#10b981' : signal === 'SELL' ? '#ef4444' : '#64748b';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Fill area
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

  }, [signal, currentPrice]);

  return <canvas ref={canvasRef} width={600} height={300} className="w-full h-64 rounded-lg" />;
}

function AIAgentCard({ name, status, progress }) {
  const statusColors = {
    completed: 'bg-green-500',
    active: 'bg-blue-500',
    waiting: 'bg-slate-300'
  };

  const statusIcons = {
    completed: CheckCircle,
    active: PlayCircle,
    waiting: Clock
  };

  const Icon = statusIcons[status];

  return (
    <div className="bg-white rounded-lg p-4 border border-violet-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon size={16} className={`${statusColors[status].replace('bg-', 'text-')}`} />
          <span className="font-semibold text-slate-800">{name}</span>
        </div>
        <span className="text-sm text-slate-600">{progress}%</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${statusColors[status]} transition-all duration-500`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, change, positive }) {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-4 border-2 border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={20} className="text-violet-600" />
        <span className="text-slate-600 text-sm font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-900 mb-1">{value}</p>
      <p className={`text-sm font-semibold ${positive ? 'text-green-600' : 'text-red-600'}`}>
        {change}
      </p>
    </div>
  );
}

function AnalysisMetric({ label, value, color }) {
  const colors = {
    green: 'bg-green-100 text-green-700 border-green-300',
    blue: 'bg-blue-100 text-blue-700 border-blue-300',
    red: 'bg-red-100 text-red-700 border-red-300'
  };

  return (
    <div className={`rounded-lg p-4 border-2 ${colors[color]}`}>
      <p className="text-sm font-medium mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function InsightItem({ text, positive }) {
  return (
    <li className="flex items-start gap-2">
      {positive ? (
        <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
      ) : (
        <AlertTriangle size={18} className="text-orange-600 flex-shrink-0 mt-0.5" />
      )}
      <span className="text-slate-700">{text}</span>
    </li>
  );
}

function MarketMetric({ label, value, change, positive }) {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-4 border-2 border-slate-200">
      <p className="text-slate-600 text-sm mb-1">{label}</p>
      <p className="text-3xl font-bold text-slate-900 mb-1">{value}</p>
      <p className={`text-sm font-semibold flex items-center gap-1 ${positive ? 'text-green-600' : 'text-red-600'}`}>
        {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {change}
      </p>
    </div>
  );
}

function IndicatorRow({ name, value, signal }) {
  const signalColors = {
    BUY: 'bg-green-100 text-green-700 border-green-300',
    SELL: 'bg-red-100 text-red-700 border-red-300',
    NEUTRAL: 'bg-slate-100 text-slate-700 border-slate-300'
  };

  return (
    <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-200">
      <span className="font-semibold text-slate-800">{name}</span>
      <span className="text-slate-600">{value}</span>
      <span className={`px-3 py-1 rounded-lg text-xs font-bold border-2 ${signalColors[signal]}`}>
        {signal}
      </span>
    </div>
  );
}

function ExecutionStage({ stage, title, completed, time }) {
  return (
    <div className="flex items-center gap-4">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 ${
        completed 
          ? 'bg-green-500 border-green-600 text-white' 
          : 'bg-slate-200 border-slate-300 text-slate-600'
      }`}>
        {completed ? <CheckCircle size={20} /> : stage}
      </div>
      <div className="flex-1">
        <p className={`font-semibold ${completed ? 'text-slate-900' : 'text-slate-500'}`}>{title}</p>
        {completed && <p className="text-sm text-slate-600">{time}</p>}
      </div>
      {completed && <CheckCircle size={20} className="text-green-500" />}
    </div>
  );
}

function TradeDetail({ label, value }) {
  return (
    <div className="bg-white rounded-lg p-3 border border-green-200">
      <p className="text-slate-600 text-sm mb-1">{label}</p>
      <p className="text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function NewsItem({ title, source, time, sentiment }) {
  const sentimentColors = {
    positive: 'bg-green-100 text-green-700',
    negative: 'bg-red-100 text-red-700',
    neutral: 'bg-slate-100 text-slate-700'
  };

  return (
    <div className="bg-white rounded-lg p-4 border border-blue-200">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h4 className="font-semibold text-slate-800 flex-1">{title}</h4>
        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${sentimentColors[sentiment]}`}>
          {sentiment}
        </span>
      </div>
      <div className="flex items-center gap-3 text-sm text-slate-600">
        <span>{source}</span>
        <span>•</span>
        <span>{time}</span>
      </div>
    </div>
  );
}

function SentimentCard({ label, value, score, color }) {
  const colors = {
    green: 'from-green-50 to-emerald-50 border-green-300 text-green-700',
    blue: 'from-blue-50 to-cyan-50 border-blue-300 text-blue-700',
    orange: 'from-orange-50 to-amber-50 border-orange-300 text-orange-700'
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-xl p-6 border-2`}>
      <p className="text-sm font-medium mb-2 opacity-80">{label}</p>
      <p className="text-3xl font-bold mb-1">{value}</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-white/50 rounded-full h-2">
          <div 
            className={`h-2 rounded-full bg-current`}
            style={{ width: `${score}%` }}
          />
        </div>
        <span className="text-sm font-bold">{score}%</span>
      </div>
    </div>
  );
}
