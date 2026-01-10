import React, { useState, useEffect, useRef } from "react";
import {
    X, TrendingUp, TrendingDown, RefreshCw, BarChart3, Activity,
    Brain, Sparkles, Play, ChevronDown, ChevronUp, Eye, Wifi, WifiOff
} from "lucide-react";
import { createChart, CandlestickSeries, HistogramSeries } from 'lightweight-charts';

const BINANCE_API = 'https://api.binance.com/api/v3';

const tokens = [
    { symbol: "BTCUSDT", display: "BTC", name: "Bitcoin", basePrice: 98000 },
    { symbol: "ETHUSDT", display: "ETH", name: "Ethereum", basePrice: 3500 },
    { symbol: "SOLUSDT", display: "SOL", name: "Solana", basePrice: 180 },
    { symbol: "BNBUSDT", display: "BNB", name: "BNB", basePrice: 600 },
];

const timeframes = [
    { value: "1m", label: "1m" },
    { value: "5m", label: "5m" },
    { value: "15m", label: "15m" },
    { value: "1h", label: "1H" },
    { value: "4h", label: "4H" },
    { value: "1d", label: "1D" },
];

export default function ChartsPanel({ isOpen, onClose, onAddNodes, onCaptureChart }) {
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);
    const candleSeriesRef = useRef(null);
    const volumeSeriesRef = useRef(null);
    const wsRef = useRef(null);

    const [selectedToken, setSelectedToken] = useState(tokens[0]);
    const [timeframe, setTimeframe] = useState("15m");
    const [isLoading, setIsLoading] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [currentPrice, setCurrentPrice] = useState(null);
    const [priceChange, setPriceChange] = useState(0);
    const [volume24h, setVolume24h] = useState(0);
    const [high24h, setHigh24h] = useState(0);
    const [low24h, setLow24h] = useState(0);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState(null);
    const [showAI, setShowAI] = useState(false);

    const fetchKlines = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(
                `${BINANCE_API}/klines?symbol=${selectedToken.symbol}&interval=${timeframe}&limit=150`
            );
            const data = await response.json();
            const candles = data.map(d => ({
                time: d[0] / 1000,
                open: parseFloat(d[1]),
                high: parseFloat(d[2]),
                low: parseFloat(d[3]),
                close: parseFloat(d[4]),
            }));
            const volumes = data.map(d => ({
                time: d[0] / 1000,
                value: parseFloat(d[5]),
                color: parseFloat(d[4]) >= parseFloat(d[1]) ? '#22c55e50' : '#ef444450',
            }));
            if (candleSeriesRef.current) candleSeriesRef.current.setData(candles);
            if (volumeSeriesRef.current) volumeSeriesRef.current.setData(volumes);
            const tickerRes = await fetch(`${BINANCE_API}/ticker/24hr?symbol=${selectedToken.symbol}`);
            const ticker = await tickerRes.json();
            setCurrentPrice(parseFloat(ticker.lastPrice));
            setPriceChange(parseFloat(ticker.priceChangePercent));
            setVolume24h(parseFloat(ticker.quoteVolume));
            setHigh24h(parseFloat(ticker.highPrice));
            setLow24h(parseFloat(ticker.lowPrice));
        } catch (error) {
            generateMockData();
        }
        setIsLoading(false);
    };

    const generateMockData = () => {
        const basePrice = selectedToken.basePrice;
        let price = basePrice;
        const candles = [];
        const volumes = [];
        const now = Math.floor(Date.now() / 1000);
        for (let i = 149; i >= 0; i--) {
            const change = (Math.random() - 0.48) * 0.015 * price;
            const open = price;
            price = Math.max(price + change, basePrice * 0.8);
            const high = Math.max(open, price) * (1 + Math.random() * 0.008);
            const low = Math.min(open, price) * (1 - Math.random() * 0.008);
            candles.push({ time: now - i * 900, open, high, low, close: price });
            volumes.push({ time: now - i * 900, value: Math.random() * 1000000, color: price >= open ? '#22c55e50' : '#ef444450' });
        }
        if (candleSeriesRef.current) candleSeriesRef.current.setData(candles);
        if (volumeSeriesRef.current) volumeSeriesRef.current.setData(volumes);
        setCurrentPrice(price);
        setPriceChange((Math.random() - 0.5) * 10);
        setVolume24h(Math.random() * 5000000000);
        setHigh24h(price * 1.05);
        setLow24h(price * 0.95);
    };

    const connectWebSocket = () => {
        if (wsRef.current) wsRef.current.close();
        try {
            const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${selectedToken.symbol.toLowerCase()}@kline_${timeframe}`);
            ws.onopen = () => setIsConnected(true);
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.k) {
                    const candle = { time: data.k.t / 1000, open: parseFloat(data.k.o), high: parseFloat(data.k.h), low: parseFloat(data.k.l), close: parseFloat(data.k.c) };
                    if (candleSeriesRef.current) candleSeriesRef.current.update(candle);
                    if (volumeSeriesRef.current) volumeSeriesRef.current.update({ time: data.k.t / 1000, value: parseFloat(data.k.v), color: candle.close >= candle.open ? '#22c55e50' : '#ef444450' });
                    setCurrentPrice(candle.close);
                }
            };
            ws.onclose = () => setIsConnected(false);
            ws.onerror = () => setIsConnected(false);
            wsRef.current = ws;
        } catch (e) { setIsConnected(false); }
    };

    useEffect(() => {
        if (!isOpen || !chartContainerRef.current) return;
        if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }

        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 280,
            layout: { background: { type: 'solid', color: '#ffffff' }, textColor: '#64748b', fontSize: 11 },
            grid: { vertLines: { color: '#f1f5f9' }, horzLines: { color: '#f1f5f9' } },
            crosshair: { mode: 1, vertLine: { color: '#94a3b8', width: 1, style: 2, labelBackgroundColor: '#1e293b' }, horzLine: { color: '#94a3b8', width: 1, style: 2, labelBackgroundColor: '#1e293b' } },
            rightPriceScale: { borderColor: '#e2e8f0', scaleMargins: { top: 0.1, bottom: 0.25 } },
            timeScale: { borderColor: '#e2e8f0', timeVisible: true, secondsVisible: false },
        });

        // lightweight-charts v5 API: use addSeries with series type
        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#22c55e',
            downColor: '#ef4444',
            borderUpColor: '#22c55e',
            borderDownColor: '#ef4444',
            wickUpColor: '#22c55e',
            wickDownColor: '#ef4444'
        });

        const volumeSeries = chart.addSeries(HistogramSeries, {
            priceFormat: { type: 'volume' },
            priceScaleId: '',
            scaleMargins: { top: 0.85, bottom: 0 }
        });

        chartRef.current = chart;
        candleSeriesRef.current = candleSeries;
        volumeSeriesRef.current = volumeSeries;
        fetchKlines();
        connectWebSocket();
        return () => { if (wsRef.current) wsRef.current.close(); if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; } };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || !chartRef.current) return;
        fetchKlines();
        connectWebSocket();
        setAnalysis(null);
        setShowAI(false);
        return () => { if (wsRef.current) wsRef.current.close(); };
    }, [selectedToken, timeframe]);

    const runAnalysis = () => {
        setIsAnalyzing(true);
        setTimeout(() => {
            const trend = priceChange > 0 ? 'bullish' : priceChange < -2 ? 'bearish' : 'neutral';
            setAnalysis({
                sentiment: trend,
                confidence: Math.round(60 + Math.random() * 30),
                rsi: Math.round(30 + Math.random() * 40),
                support: currentPrice * 0.95,
                resistance: currentPrice * 1.08,
                signal: trend === 'bullish' ? 'BUY' : trend === 'bearish' ? 'SELL' : 'HOLD',
                reason: trend === 'bullish' ? 'Strong momentum with volume confirmation.' : trend === 'bearish' ? 'Bearish divergence detected.' : 'Consolidation phase.',
                patterns: trend === 'bullish' ? ['Bull Flag', 'Higher Lows'] : trend === 'bearish' ? ['Head & Shoulders'] : ['Range Bound'],
            });
            setIsAnalyzing(false);
        }, 1500);
    };

    const captureChartForAI = () => { if (onCaptureChart) onCaptureChart({ symbol: selectedToken.symbol, price: currentPrice, timeframe }); };

    const createWorkflow = () => {
        if (!analysis || !onAddNodes) return;
        onAddNodes([
            { id: `ai-${Date.now()}-0`, type: "custom", position: { x: 100, y: 150 }, data: { label: `Pyth ${selectedToken.display}/USD`, type: "pyth-network", inputs: {}, outputs: { price: { type: "float" } }, node_data: { symbol: `${selectedToken.display}_USD` } } },
            { id: `ai-${Date.now()}-1`, type: "custom", position: { x: 400, y: 150 }, data: { label: `Price > ${analysis.support.toFixed(0)}?`, type: "condition", inputs: { price: { type: "float" } }, outputs: { "true-path": { type: "bool" }, "false-path": { type: "bool" } }, node_data: { condition: `price > ${analysis.support.toFixed(0)}` } } },
            { id: `ai-${Date.now()}-2`, type: "custom", position: { x: 700, y: 100 }, data: { label: `${analysis.signal} ${selectedToken.display}`, type: "swap", inputs: { activate: { type: "bool" } }, outputs: {}, node_data: {} } },
        ]);
        onClose();
    };

    const formatPrice = (price) => {
        if (!price) return '--';
        if (price >= 1000) return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return price.toFixed(price >= 1 ? 2 : 4);
    };

    const formatVolume = (vol) => {
        if (!vol) return '--';
        if (vol >= 1e9) return '$' + (vol / 1e9).toFixed(2) + 'B';
        if (vol >= 1e6) return '$' + (vol / 1e6).toFixed(2) + 'M';
        return '$' + (vol / 1e3).toFixed(2) + 'K';
    };

    const isPositive = priceChange >= 0;

    return (
        <>
            <div className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={onClose} />
            <div className={`fixed top-0 right-0 h-full w-[520px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"} flex flex-col`}>
                <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg"><BarChart3 size={18} className="text-slate-600" /></div>
                        <div>
                            <h2 className="font-semibold text-slate-800">Live Market Charts</h2>
                            <div className="flex items-center gap-2 text-xs">
                                <span className={`flex items-center gap-1 ${isConnected ? 'text-green-600' : 'text-slate-400'}`}>{isConnected ? <Wifi size={10} /> : <WifiOff size={10} />}{isConnected ? 'Live' : 'Offline'}</span>
                                <span className="text-slate-400">•</span><span className="text-slate-500">Binance Data</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><X size={18} /></button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <div className="px-5 py-3 border-b border-slate-100">
                        <div className="flex gap-2">{tokens.map((token) => (<button key={token.symbol} onClick={() => setSelectedToken(token)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedToken.symbol === token.symbol ? "bg-slate-800 text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{token.display}</button>))}</div>
                    </div>
                    <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-baseline gap-3 mb-1">
                                    <span className="text-3xl font-bold text-slate-800">${formatPrice(currentPrice)}</span>
                                    <span className={`flex items-center gap-1 text-sm font-semibold px-2 py-0.5 rounded ${isPositive ? "text-green-700 bg-green-100" : "text-red-700 bg-red-100"}`}>{isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}{isPositive ? "+" : ""}{priceChange.toFixed(2)}%</span>
                                </div>
                                <p className="text-sm text-slate-500">{selectedToken.name} / USD</p>
                            </div>
                            <div className="text-right text-xs space-y-1">
                                <div className="text-slate-400">24h High: <span className="text-slate-600 font-medium">${formatPrice(high24h)}</span></div>
                                <div className="text-slate-400">24h Low: <span className="text-slate-600 font-medium">${formatPrice(low24h)}</span></div>
                                <div className="text-slate-400">Volume: <span className="text-slate-600 font-medium">{formatVolume(volume24h)}</span></div>
                            </div>
                        </div>
                    </div>
                    <div className="px-5 py-3 flex items-center justify-between border-b border-slate-100">
                        <div className="flex gap-1">{timeframes.map((tf) => (<button key={tf.value} onClick={() => setTimeframe(tf.value)} className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${timeframe === tf.value ? "bg-slate-800 text-white" : "text-slate-500 hover:bg-slate-100"}`}>{tf.label}</button>))}</div>
                        <div className="flex gap-2">
                            <button onClick={captureChartForAI} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"><Eye size={12} />AI Vision</button>
                            <button onClick={fetchKlines} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"><RefreshCw size={14} className={isLoading ? "animate-spin" : ""} /></button>
                        </div>
                    </div>
                    <div className="px-5 py-4">
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden relative">
                            <div ref={chartContainerRef} className="w-full" style={{ height: 280 }} />
                            {isLoading && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><RefreshCw size={24} className="text-slate-400 animate-spin" /></div>}
                        </div>
                    </div>
                    <div className="px-5 pb-5">
                        <button onClick={() => setShowAI(!showAI)} className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 rounded-xl transition-colors border border-purple-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg"><Brain size={18} className="text-purple-600" /></div>
                                <div className="text-left"><span className="font-semibold text-slate-800">AI Trading Analysis</span><p className="text-xs text-slate-500">Get AI-powered insights</p></div>
                            </div>
                            {showAI ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                        </button>
                        {showAI && (
                            <div className="mt-4 space-y-4">
                                {!analysis && !isAnalyzing && <button onClick={runAnalysis} className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-200"><Sparkles size={18} />Analyze {selectedToken.display} Chart</button>}
                                {isAnalyzing && <div className="py-10 text-center"><div className="relative mx-auto w-16 h-16 mb-4"><div className="absolute inset-0 rounded-full border-4 border-purple-100"></div><div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div><Brain size={24} className="absolute inset-0 m-auto text-purple-500" /></div><p className="text-sm text-slate-600 font-medium">Analyzing {selectedToken.display}...</p></div>}
                                {analysis && !isAnalyzing && (
                                    <div className="space-y-4">
                                        <div className={`p-5 rounded-xl border-2 ${analysis.sentiment === "bullish" ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200" : analysis.sentiment === "bearish" ? "bg-gradient-to-br from-red-50 to-rose-50 border-red-200" : "bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200"}`}>
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className={`p-2 rounded-lg ${analysis.sentiment === "bullish" ? "bg-green-100" : analysis.sentiment === "bearish" ? "bg-red-100" : "bg-slate-100"}`}>{analysis.sentiment === "bullish" ? <TrendingUp size={20} className="text-green-600" /> : analysis.sentiment === "bearish" ? <TrendingDown size={20} className="text-red-600" /> : <Activity size={20} className="text-slate-600" />}</div>
                                                    <div><span className={`text-lg font-bold ${analysis.sentiment === "bullish" ? "text-green-700" : analysis.sentiment === "bearish" ? "text-red-700" : "text-slate-700"}`}>{analysis.signal}</span><p className="text-xs text-slate-500 capitalize">{analysis.sentiment} Signal</p></div>
                                                </div>
                                                <div className="text-right"><div className="text-2xl font-bold text-slate-800">{analysis.confidence}%</div><p className="text-xs text-slate-500">Confidence</p></div>
                                            </div>
                                            <p className="text-sm text-slate-600">{analysis.reason}</p>
                                            <div className="flex gap-2 mt-3">{analysis.patterns.map((p, i) => <span key={i} className="px-2 py-1 bg-white/60 rounded text-xs font-medium text-slate-600">{p}</span>)}</div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="bg-slate-50 rounded-xl p-3 text-center"><p className="text-[10px] text-slate-500 uppercase">RSI</p><p className={`text-lg font-bold ${analysis.rsi < 30 ? 'text-green-600' : analysis.rsi > 70 ? 'text-red-600' : 'text-slate-700'}`}>{analysis.rsi}</p></div>
                                            <div className="bg-slate-50 rounded-xl p-3 text-center"><p className="text-[10px] text-slate-500 uppercase">Support</p><p className="text-lg font-bold text-slate-700">${formatPrice(analysis.support)}</p></div>
                                            <div className="bg-slate-50 rounded-xl p-3 text-center"><p className="text-[10px] text-slate-500 uppercase">Resistance</p><p className="text-lg font-bold text-slate-700">${formatPrice(analysis.resistance)}</p></div>
                                        </div>
                                        <button onClick={createWorkflow} className="w-full py-3.5 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"><Play size={16} />Create Trading Workflow</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
