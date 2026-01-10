import React, { useState, useEffect } from "react";
import { Activity, TrendingUp, Zap, Clock, CheckCircle } from "lucide-react";

export default function LiveUpdateBanner({ logs, workflowType, isExecuting }) {
  const [latestUpdate, setLatestUpdate] = useState(null);
  const [cycleCount, setCycleCount] = useState(0);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (!logs || logs.length === 0) return;

    // Get the latest log entry
    const latest = logs[logs.length - 1];
    const msg = latest.message || latest.msg || String(latest);

    // Check if it's a new cycle
    if (msg.includes('[WORKFLOW] Repeating workflow execution')) {
      setCycleCount(prev => prev + 1);
      setPulse(true);
      setTimeout(() => setPulse(false), 1000);
    }

    // Extract key updates
    if (msg.includes('💰 Current Price:')) {
      const price = msg.match(/\$[\d,]+\.?\d*/)?.[0];
      setLatestUpdate({ type: 'price', text: `BTC Price: ${price}`, icon: TrendingUp, color: 'blue' });
    } else if (msg.includes('🤖 Trading Agent Decision:')) {
      const signal = msg.match(/(BUY|SELL|HOLD)/i)?.[0];
      const confidence = msg.match(/(\d+)%/)?.[0];
      setLatestUpdate({ 
        type: 'signal', 
        text: `Signal: ${signal} (${confidence})`, 
        icon: Zap,
        color: signal === 'BUY' ? 'green' : signal === 'SELL' ? 'red' : 'yellow'
      });
    } else if (msg.includes('✅ Trade executed')) {
      setLatestUpdate({ type: 'trade', text: 'Trade Executed Successfully!', icon: CheckCircle, color: 'green' });
    } else if (msg.includes('Waiting')) {
      const time = msg.match(/\d+s/)?.[0];
      setLatestUpdate({ type: 'wait', text: `Next cycle in ${time}`, icon: Clock, color: 'purple' });
    }
  }, [logs]);

  if (!isExecuting && cycleCount === 0) return null;

  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
    yellow: 'from-yellow-500 to-yellow-600',
    purple: 'from-purple-500 to-purple-600'
  };

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
      <div className={`
        bg-gradient-to-r ${colors[latestUpdate?.color] || colors.blue}
        text-white px-8 py-4 rounded-full shadow-2xl
        transition-all duration-300
        ${pulse ? 'scale-110' : 'scale-100'}
        flex items-center gap-4
      `}>
        <Activity className={`${isExecuting ? 'animate-pulse' : ''}`} size={24} />
        
        <div className="flex flex-col">
          <div className="text-sm font-semibold">
            {workflowType === 'repeat' ? '🔄 Live Trading Active' : '⚡ Executing Workflow'}
          </div>
          {latestUpdate && (
            <div className="text-xs flex items-center gap-2">
              {React.createElement(latestUpdate.icon, { size: 14 })}
              {latestUpdate.text}
            </div>
          )}
        </div>

        {workflowType === 'repeat' && (
          <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-mono">
            Cycle #{cycleCount}
          </div>
        )}
      </div>
    </div>
  );
}
