import React, { useEffect, useState, useRef } from "react";
import { X, CheckCircle2, ArrowRight, Zap, TrendingUp, Shield, Eye, Rocket, PartyPopper, ChevronRight, TrendingDown, AlertTriangle, DollarSign, Newspaper } from "lucide-react";
import confetti from "canvas-confetti";

// Professional TradingView-style Candlestick Chart
function CandlestickChart({ signal, currentPrice, stopLoss, takeProfit, isAnimating }) {
    const canvasRef = useRef(null);
    const [candlesVisible, setCandlesVisible] = useState(0);

    useEffect(() => {
        if (isAnimating) {
            setCandlesVisible(0);
            let count = 0;
            const timer = setInterval(() => {
                count += 1;
                setCandlesVisible(count);
                if (count >= 40) clearInterval(timer);
            }, 60);
            return () => clearInterval(timer);
        } else {
            setCandlesVisible(40);
        }
    }, [isAnimating]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const W = canvas.width;
        const H = canvas.height;

        // Clear
        ctx.clearRect(0, 0, W, H);

        // Background gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
        bgGrad.addColorStop(0, '#0c0f14');
        bgGrad.addColorStop(1, '#151921');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        // Generate realistic OHLC data
        const numCandles = 40;
        const candles = [];
        let price = currentPrice * (signal === 'BUY' ? 0.94 : 1.06);
        const trend = signal === 'BUY' ? 1 : -1;

        for (let i = 0; i < numCandles; i++) {
            const vol = currentPrice * 0.006;
            const momentum = trend * vol * 0.12 * Math.pow(i / numCandles, 0.8);
            const noise = (Math.random() - 0.5) * vol * 1.5;

            const open = price;
            const close = open + momentum + noise;
            const wickSize = vol * (0.3 + Math.random() * 0.7);
            const high = Math.max(open, close) + wickSize * Math.random();
            const low = Math.min(open, close) - wickSize * Math.random();

            candles.push({ o: open, h: high, l: low, c: close, bull: close >= open });
            price = close;
        }

        // Calculate price range
        const allPrices = candles.flatMap(c => [c.h, c.l]).concat([stopLoss, takeProfit, currentPrice]);
        const minP = Math.min(...allPrices) * 0.998;
        const maxP = Math.max(...allPrices) * 1.002;
        const priceRange = maxP - minP;

        // Chart area
        const leftPad = 12;
        const rightPad = 65;
        const topPad = 15;
        const bottomPad = 25;
        const chartW = W - leftPad - rightPad;
        const chartH = H - topPad - bottomPad;

        const scaleY = (p) => topPad + chartH - ((p - minP) / priceRange) * chartH;
        const candleW = chartW / numCandles;

        // Horizontal grid lines
        ctx.strokeStyle = '#1e2530';
        ctx.lineWidth = 1;
        const gridLines = 5;
        for (let i = 0; i <= gridLines; i++) {
            const y = topPad + (chartH / gridLines) * i;
            ctx.beginPath();
            ctx.moveTo(leftPad, y);
            ctx.lineTo(W - rightPad, y);
            ctx.stroke();
        }

        // Price labels on right
        ctx.fillStyle = '#4b5563';
        ctx.font = '10px Inter, system-ui, sans-serif';
        ctx.textAlign = 'left';
        for (let i = 0; i <= gridLines; i++) {
            const p = maxP - (priceRange / gridLines) * i;
            const y = topPad + (chartH / gridLines) * i;
            ctx.fillText('$' + p.toFixed(0), W - rightPad + 5, y + 4);
        }

        // Draw candles
        const visibleCount = Math.min(candlesVisible, numCandles);
        for (let i = 0; i < visibleCount; i++) {
            const c = candles[i];
            const x = leftPad + i * candleW + candleW / 2;

            // Wick
            ctx.strokeStyle = c.bull ? '#10b981' : '#ef4444';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, scaleY(c.h));
            ctx.lineTo(x, scaleY(c.l));
            ctx.stroke();

            // Body
            const bodyTop = scaleY(Math.max(c.o, c.c));
            const bodyBot = scaleY(Math.min(c.o, c.c));
            const bodyH = Math.max(bodyBot - bodyTop, 2);
            const bodyW = candleW * 0.7;

            ctx.fillStyle = c.bull ? '#10b981' : '#ef4444';
            ctx.fillRect(x - bodyW / 2, bodyTop, bodyW, bodyH);
        }

        // Stop Loss line
        const slY = scaleY(stopLoss);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(leftPad, slY);
        ctx.lineTo(W - rightPad, slY);
        ctx.stroke();

        // SL label
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(W - rightPad + 2, slY - 9, 58, 18);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('SL $' + stopLoss.toFixed(0), W - rightPad + 31, slY + 4);

        // Take Profit line
        const tpY = scaleY(takeProfit);
        ctx.strokeStyle = '#10b981';
        ctx.beginPath();
        ctx.moveTo(leftPad, tpY);
        ctx.lineTo(W - rightPad, tpY);
        ctx.stroke();

        // TP label
        ctx.fillStyle = '#10b981';
        ctx.fillRect(W - rightPad + 2, tpY - 9, 58, 18);
        ctx.fillStyle = '#fff';
        ctx.fillText('TP $' + takeProfit.toFixed(0), W - rightPad + 31, tpY + 4);

        ctx.setLineDash([]);

        // Current price line
        const cpY = scaleY(currentPrice);
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(leftPad, cpY);
        ctx.lineTo(W - rightPad, cpY);
        ctx.stroke();

        // Current price label
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(W - rightPad + 2, cpY - 10, 58, 20);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Inter, system-ui, sans-serif';
        ctx.fillText('$' + currentPrice.toFixed(0), W - rightPad + 31, cpY + 4);

        // Pulsing dot at current price
        if (visibleCount >= numCandles) {
            ctx.beginPath();
            ctx.fillStyle = '#3b82f6';
            ctx.shadowColor = '#3b82f6';
            ctx.shadowBlur = 10;
            ctx.arc(leftPad + chartW - candleW / 2, cpY, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Time labels
        ctx.fillStyle = '#4b5563';
        ctx.font = '9px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        const times = ['1h ago', '45m', '30m', '15m', 'Now'];
        times.forEach((t, i) => {
            const x = leftPad + (chartW / 4) * i;
            ctx.fillText(t, x, H - 8);
        });

    }, [signal, currentPrice, stopLoss, takeProfit, candlesVisible]);

    return (
        <div className="relative">
            <canvas ref={canvasRef} width={480} height={200} className="w-full rounded-lg" />
            <div className="absolute top-2 left-3 flex items-center gap-2">
                <span className="text-[10px] font-medium text-slate-400">BTC/USD</span>
                <span className="text-[10px] text-slate-500">1m</span>
            </div>
        </div>
    );
}


function parseLogsForResults(logs) {
    const r = { price: null, vision: null, news: null, trading: null, risk: null, investment: null };
    if (!logs?.length) return null;
    
    logs.forEach(log => {
        const msg = log.message || '';
        
        // Parse execution results from JSON
        if (msg.includes('Execution result:')) {
            try {
                const jsonStr = msg.split('Execution result:')[1].trim();
                const d = JSON.parse(jsonStr);
                
                if (d.price && d.symbol) {
                    r.price = d;
                } else if (d.sentiment !== undefined) {
                    // Check if it's vision or news based on available fields
                    if (d.pattern !== undefined || d.rsi !== undefined) {
                        r.vision = d;
                    } else if (d.headline !== undefined || d.score !== undefined) {
                        r.news = d;
                    }
                } else if (d.signal && (d.positionSize !== undefined || d.action !== undefined)) {
                    r.trading = d;
                } else if (d.approved !== undefined && d.exposure !== undefined) {
                    r.risk = d;
                } else if (d.approved !== undefined && d.adjustedAmount !== undefined) {
                    r.investment = d;
                }
            } catch (e) {
                console.error('Failed to parse log result:', e);
            }
        }
        
        // Parse price data
        if (msg.includes('Current Price:') || msg.includes('💰 Current Price:')) {
            const priceMatch = msg.match(/\$([0-9,]+\.?[0-9]*)/);
            if (priceMatch && !r.price) {
                r.price = { price: parseFloat(priceMatch[1].replace(/,/g, '')), symbol: 'BTC' };
            }
        }
        
        // Parse Vision Analysis results
        if (msg.includes('📊 [VisionAnalysis] Results:')) {
            const sentimentMatch = msg.match(/Sentiment:\s*([A-Z]+)/);
            const confidenceMatch = msg.match(/Confidence:\s*([0-9.]+)%/);
            const actionMatch = msg.match(/Action:\s*([A-Z]+)/);
            const patternsMatch = msg.match(/Patterns:\s*(.+)/);
            
            if (sentimentMatch) {
                r.vision = {
                    sentiment: sentimentMatch[1],
                    confidence: confidenceMatch ? parseFloat(confidenceMatch[1]) : 0,
                    action: actionMatch ? actionMatch[1] : 'HOLD',
                    pattern: patternsMatch ? patternsMatch[1].split(',')[0].trim() : 'Unknown',
                    rsi: 50 // Vision doesn't provide RSI
                };
            }
        }
        
        // Parse News Analysis results
        if (msg.includes('📊 News Analysis Results:')) {
            const sentimentMatch = msg.match(/Overall Sentiment:\s*([a-z]+)/);
            const confidenceMatch = msg.match(/Confidence:\s*([0-9]+)%/);
            
            if (sentimentMatch) {
                r.news = {
                    sentiment: sentimentMatch[1].charAt(0).toUpperCase() + sentimentMatch[1].slice(1),
                    score: confidenceMatch ? confidenceMatch[1] : '0',
                    headline: 'News analysis complete'
                };
            }
        }
        
        // Parse Trading Agent Signal
        if (msg.includes('📊 [TradingAgent] Signal Generated:')) {
            // Look for the next few log messages after this one
            const logIndex = logs.indexOf(log);
            let actionMsg = '', confidenceMsg = '', reasoningMsg = '';
            
            for (let i = logIndex + 1; i < Math.min(logIndex + 10, logs.length); i++) {
                const nextMsg = logs[i].message || '';
                if (nextMsg.includes('Action:')) actionMsg = nextMsg;
                if (nextMsg.includes('Confidence:')) confidenceMsg = nextMsg;
                if (nextMsg.includes('Reasoning:')) reasoningMsg = nextMsg;
            }
            
            const actionMatch = actionMsg.match(/Action:\s*([A-Z]+)/);
            const confidenceMatch = confidenceMsg.match(/([0-9.]+)%/);
            const reasoningMatch = reasoningMsg.split('Reasoning:')[1];
            
            if (actionMatch) {
                r.trading = {
                    signal: actionMatch[1],
                    action: actionMatch[1].toLowerCase(),
                    confidence: confidenceMatch ? parseFloat(confidenceMatch[1]) : 0,
                    reasoning: reasoningMatch ? reasoningMatch.trim() : '',
                    positionSize: '0.01'
                };
            }
        }
        
        // Parse Risk Manager
        if (msg.includes('[RiskManager]') && (msg.includes('approved') || msg.includes('rejected'))) {
            r.risk = {
                approved: !msg.includes('rejected') && !msg.includes('failed'),
                exposure: 0,
                maxExposure: 30
            };
        }
        
        // Parse Investment Limits
        if (msg.includes('Investment approved:') || msg.includes('✅ Investment approved:')) {
            const amountMatch = msg.match(/([0-9.]+)\s*ETH/);
            r.investment = {
                approved: true,
                amount: amountMatch ? amountMatch[1] + ' ETH' : '0.01 ETH',
                maxAllowed: '0.05 ETH'
            };
        }
    });
    
    return r;
}

function DecisionExplanation({ tradingResult, parsedFromLogs }) {
    const { signal, agents } = tradingResult;
    const bullish = [], bearish = [];
    if (agents.vision.sentiment === 'BULLISH') bullish.push('Bullish chart pattern');
    else if (agents.vision.sentiment === 'BEARISH') bearish.push('Bearish chart pattern');
    if (agents.news.sentiment === 'Positive') bullish.push('Positive news sentiment');
    else if (agents.news.sentiment === 'Negative') bearish.push('Negative news sentiment');
    if (agents.vision.rsi < 35) bullish.push('RSI oversold (' + agents.vision.rsi + ')');
    if (agents.vision.rsi > 65) bearish.push('RSI overbought (' + agents.vision.rsi + ')');

    return (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 mt-4 border border-slate-700">
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-white">🧠 AI Decision Analysis</span>
                {parsedFromLogs && <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded-full">● LIVE</span>}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <p className="text-xs text-emerald-400 font-semibold mb-2 flex items-center gap-1">
                        <TrendingUp size={12} /> Bullish Factors
                    </p>
                    {bullish.length > 0 ? bullish.map((f, i) => (
                        <p key={i} className="text-xs text-slate-300 py-0.5">✓ {f}</p>
                    )) : <p className="text-xs text-slate-500 italic">None detected</p>}
                </div>
                <div>
                    <p className="text-xs text-red-400 font-semibold mb-2 flex items-center gap-1">
                        <TrendingDown size={12} /> Bearish Factors
                    </p>
                    {bearish.length > 0 ? bearish.map((f, i) => (
                        <p key={i} className="text-xs text-slate-300 py-0.5">✗ {f}</p>
                    )) : <p className="text-xs text-slate-500 italic">None detected</p>}
                </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-700">
                <p className="text-xs text-slate-400">
                    <span className="font-semibold text-white">Verdict: </span>
                    {signal === 'BUY' ? <span className="text-emerald-400">{bullish.length} bullish signals outweigh {bearish.length} bearish. Opening LONG.</span>
                        : signal === 'SELL' ? <span className="text-red-400">{bearish.length} bearish signals outweigh {bullish.length} bullish. Opening SHORT.</span>
                            : <span className="text-amber-400">Signals inconclusive. Holding position.</span>}
                </p>
            </div>
        </div>
    );
}

export default function WorkflowResultModal({ isOpen, onClose, workflowName, logs = [] }) {
    const [tradingResult, setTradingResult] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [parsedFromLogs, setParsedFromLogs] = useState(false);
    const [chartAnimating, setChartAnimating] = useState(true);
    const totalSteps = (logs || []).filter(l => l.type === 'success' || l.message?.includes('completed')).length || 7;

    useEffect(() => {
        if (!isOpen) return;
        setChartAnimating(true);
        setTimeout(() => setChartAnimating(false), 2500);

        const isAI = workflowName?.includes('Trading') || workflowName?.includes('Agent') || workflowName?.includes('AI');
        if (!isAI) return;

        const parsed = parseLogsForResults(logs);
        
        // Check if we have actual trading results from the workflow
        if (parsed?.trading?.signal || parsed?.price || parsed?.vision || parsed?.news) {
            setParsedFromLogs(true);
            
            // Extract actual data from logs
            const sig = parsed.trading?.signal || 'HOLD';
            const price = parseFloat(parsed.price?.price) || 90492; // Use actual price from logs
            
            // Get actual vision analysis or show error
            let visionSent = 'ERROR';
            let visionPattern = 'Analysis Failed';
            let visionRSI = 0;
            if (parsed.vision) {
                visionSent = parsed.vision.sentiment || 'NEUTRAL';
                visionPattern = parsed.vision.pattern || 'No pattern detected';
                visionRSI = parseInt(parsed.vision.rsi) || 50;
            }
            
            // Get actual news analysis
            let newsSent = 'Unknown';
            let newsScore = '0';
            let newsHeadline = 'No news data available';
            if (parsed.news) {
                newsSent = parsed.news.sentiment || 'Neutral';
                newsScore = parsed.news.score || '0';
                newsHeadline = parsed.news.headline || 'Analysis complete';
            }
            
            // Get actual risk and investment data
            const riskApproved = parsed.risk?.approved !== false;
            const investmentApproved = parsed.investment?.approved !== false;
            
            setTradingResult({
                signal: sig, 
                confidence: parseInt(parsed.trading?.confidence) || 0,
                currentPrice: price, 
                entryPrice: price * 1.002,
                stopLoss: sig === 'BUY' ? price * 0.95 : price * 1.05,
                takeProfit: sig === 'BUY' ? price * 1.08 : price * 0.92,
                positionSize: parsed.trading?.positionSize || '0 ETH', 
                riskReward: '1:2.5',
                agents: {
                    vision: { 
                        sentiment: visionSent, 
                        confidence: parsed.vision?.confidence || 0, 
                        pattern: visionPattern, 
                        rsi: visionRSI 
                    },
                    news: { 
                        sentiment: newsSent, 
                        score: newsScore, 
                        headline: newsHeadline 
                    },
                    risk: { 
                        approved: riskApproved, 
                        exposure: parsed.risk?.exposure || 0, 
                        maxExposure: parsed.risk?.maxExposure || 30 
                    },
                    investment: { 
                        approved: investmentApproved, 
                        amount: parsed.investment?.amount || '0 ETH', 
                        maxAllowed: parsed.investment?.maxAllowed || '0.1 ETH' 
                    }
                }
            });
        } else {
            // No data available - show this clearly to user
            setParsedFromLogs(false);
            setTradingResult({
                signal: 'HOLD',
                confidence: 0,
                currentPrice: 90492,
                entryPrice: 90492,
                stopLoss: 85967,
                takeProfit: 95000,
                positionSize: '0 ETH',
                riskReward: 'N/A',
                agents: {
                    vision: { sentiment: 'NO DATA', confidence: 0, pattern: 'Workflow incomplete', rsi: 0 },
                    news: { sentiment: 'NO DATA', score: '0', headline: 'Workflow did not complete' },
                    risk: { approved: false, exposure: 0, maxExposure: 30 },
                    investment: { approved: false, amount: '0 ETH', maxAllowed: '0 ETH' }
                }
            });
        }
    }, [isOpen, logs, workflowName]);

    useEffect(() => { if (isOpen) setTimeout(() => confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, zIndex: 200 }), 400); }, [isOpen]);

    if (!isOpen) return null;

    const signalColors = {
        BUY: { bg: 'from-emerald-500 to-green-600', text: 'text-emerald-500', icon: <TrendingUp size={32} strokeWidth={3} /> },
        SELL: { bg: 'from-red-500 to-rose-600', text: 'text-red-500', icon: <TrendingDown size={32} strokeWidth={3} /> },
        HOLD: { bg: 'from-amber-500 to-orange-500', text: 'text-amber-500', icon: <AlertTriangle size={32} strokeWidth={3} /> }
    };
    const sc = tradingResult ? signalColors[tradingResult.signal] || signalColors.HOLD : signalColors.HOLD;


    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto border border-slate-700">
                {/* Header */}
                <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-4 sticky top-0 z-10 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <PartyPopper className="w-5 h-5 text-amber-300" />
                            <h2 className="text-lg font-bold text-white">AI Analysis Complete</h2>
                        </div>
                        <button onClick={onClose} className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"><X size={20} /></button>
                    </div>
                    <p className="text-xs text-violet-200 mt-1 opacity-80">{workflowName || "Multi-Agent Trading"}</p>
                </div>

                <div className="p-4">
                    {tradingResult && (
                        <>
                            {/* Signal Header */}
                            <div className={`bg-gradient-to-r ${sc.bg} rounded-xl p-4 mb-4`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white/20 rounded-lg p-2">{sc.icon}</div>
                                        <div>
                                            <p className="text-white/70 text-xs">AI Signal</p>
                                            <p className="text-3xl font-black text-white">{tradingResult.signal}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-white">${tradingResult.currentPrice.toFixed(0)}</p>
                                        <p className="text-white/70 text-sm">{tradingResult.confidence}% confidence</p>
                                    </div>
                                </div>
                            </div>

                            {/* Chart */}
                            <div className="mb-4 rounded-xl overflow-hidden border border-slate-700">
                                <CandlestickChart {...tradingResult} isAnimating={chartAnimating} />
                            </div>

                            {/* Price Levels */}
                            <div className="grid grid-cols-3 gap-2 mb-4">
                                <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-center">
                                    <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wide">Entry</p>
                                    <p className="text-lg font-bold text-white">${tradingResult.entryPrice.toFixed(0)}</p>
                                </div>
                                <div className="bg-slate-800 border border-red-900/50 rounded-xl p-3 text-center">
                                    <p className="text-[10px] text-red-400 font-semibold uppercase tracking-wide">Stop Loss</p>
                                    <p className="text-lg font-bold text-red-400">${tradingResult.stopLoss.toFixed(0)}</p>
                                </div>
                                <div className="bg-slate-800 border border-emerald-900/50 rounded-xl p-3 text-center">
                                    <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wide">Take Profit</p>
                                    <p className="text-lg font-bold text-emerald-400">${tradingResult.takeProfit.toFixed(0)}</p>
                                </div>
                            </div>

                            {/* Agent Cards */}
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                <div className="bg-slate-800 border border-violet-900/50 rounded-xl p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="bg-violet-500/20 p-1.5 rounded-lg"><Eye size={14} className="text-violet-400" /></div>
                                        <span className="text-xs font-semibold text-violet-300">Vision Agent</span>
                                    </div>
                                    <p className={`text-sm font-bold ${
                                        tradingResult.agents.vision.sentiment === 'BULLISH' ? 'text-emerald-400' : 
                                        tradingResult.agents.vision.sentiment === 'BEARISH' ? 'text-red-400' : 
                                        tradingResult.agents.vision.sentiment === 'ERROR' || tradingResult.agents.vision.sentiment === 'NO DATA' ? 'text-rose-500' :
                                        'text-amber-400'}`}>
                                        {tradingResult.agents.vision.sentiment}
                                    </p>
                                    <p className="text-[10px] text-slate-500 mt-1">
                                        {tradingResult.agents.vision.sentiment === 'ERROR' || tradingResult.agents.vision.sentiment === 'NO DATA' 
                                            ? tradingResult.agents.vision.pattern
                                            : `RSI: ${tradingResult.agents.vision.rsi} • ${tradingResult.agents.vision.pattern}`}
                                    </p>
                                </div>
                                <div className="bg-slate-800 border border-orange-900/50 rounded-xl p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="bg-orange-500/20 p-1.5 rounded-lg"><Newspaper size={14} className="text-orange-400" /></div>
                                        <span className="text-xs font-semibold text-orange-300">News Agent</span>
                                    </div>
                                    <p className={`text-sm font-bold ${
                                        tradingResult.agents.news.sentiment === 'Positive' ? 'text-emerald-400' : 
                                        tradingResult.agents.news.sentiment === 'Negative' ? 'text-red-400' : 
                                        tradingResult.agents.news.sentiment === 'NO DATA' ? 'text-rose-500' :
                                        'text-amber-400'}`}>
                                        {tradingResult.agents.news.sentiment} <span className="text-xs opacity-70">({tradingResult.agents.news.score})</span>
                                    </p>
                                    <p className="text-[10px] text-slate-500 mt-1 truncate">{tradingResult.agents.news.headline}</p>
                                </div>
                                <div className="bg-slate-800 border border-emerald-900/50 rounded-xl p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="bg-emerald-500/20 p-1.5 rounded-lg"><Shield size={14} className="text-emerald-400" /></div>
                                        <span className="text-xs font-semibold text-emerald-300">Risk Manager</span>
                                    </div>
                                    <p className={`text-sm font-bold ${tradingResult.agents.risk.approved ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {tradingResult.agents.risk.approved ? '✓ APPROVED' : '✗ REJECTED'}
                                    </p>
                                    <p className="text-[10px] text-slate-500 mt-1">Exposure: {tradingResult.agents.risk.exposure}% / {tradingResult.agents.risk.maxExposure}%</p>
                                </div>
                                <div className="bg-slate-800 border border-amber-900/50 rounded-xl p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="bg-amber-500/20 p-1.5 rounded-lg"><DollarSign size={14} className="text-amber-400" /></div>
                                        <span className="text-xs font-semibold text-amber-300">Investment Guard</span>
                                    </div>
                                    <p className={`text-sm font-bold ${tradingResult.agents.investment.approved ? 'text-amber-400' : 'text-red-400'}`}>
                                        {tradingResult.agents.investment.approved ? '✓ WITHIN LIMITS' : '✗ EXCEEDS LIMITS'}
                                    </p>
                                    <p className="text-[10px] text-slate-500 mt-1">{tradingResult.agents.investment.amount} (max: {tradingResult.agents.investment.maxAllowed})</p>
                                </div>
                            </div>

                            {/* Decision Analysis */}
                            <DecisionExplanation tradingResult={tradingResult} parsedFromLogs={parsedFromLogs} />

                            {/* Logs */}
                            {logs?.length > 0 && (
                                <div className="mt-4">
                                    <button onClick={() => setShowDetails(!showDetails)} className="flex items-center gap-1 text-xs text-slate-500 font-medium hover:text-slate-300 transition">
                                        <ChevronRight size={14} className={`transition-transform ${showDetails ? 'rotate-90' : ''}`} />
                                        {showDetails ? 'Hide' : 'Show'} Execution Logs ({logs.length})
                                    </button>
                                    {showDetails && (
                                        <div className="bg-slate-800/50 rounded-lg p-3 mt-2 max-h-28 overflow-y-auto border border-slate-700">
                                            {logs.map((log, i) => (
                                                <div key={i} className="text-[10px] py-0.5 text-slate-400 font-mono">
                                                    <span className={log.type === 'success' ? 'text-emerald-500' : 'text-slate-600'}>{log.type === 'success' ? '✓' : '›'}</span> {log.message}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {/* Stats */}
                    <div className="flex gap-2 mt-4 mb-4">
                        <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5 mb-1">
                                <Zap size={14} className="text-violet-400" />
                                <span className="text-[10px] font-semibold text-slate-400 uppercase">Agents</span>
                            </div>
                            <p className="text-xl font-bold text-white">{totalSteps}</p>
                        </div>
                        <div className="flex-1 bg-slate-800 border border-emerald-900/50 rounded-xl p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5 mb-1">
                                <CheckCircle2 size={14} className="text-emerald-400" />
                                <span className="text-[10px] font-semibold text-slate-400 uppercase">Status</span>
                            </div>
                            <p className="text-xl font-bold text-emerald-400">Success</p>
                        </div>
                    </div>

                    {/* Continue Button */}
                    <button onClick={onClose} className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                        <Rocket size={18} /> Continue Trading <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
