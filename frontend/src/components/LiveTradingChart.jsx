import React, { useEffect, useState, useRef } from "react";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

export default function LiveTradingChart({ isExecuting, executedNodes = 0, totalNodes = 7 }) {
    const canvasRef = useRef(null);
    const [candlesVisible, setCandlesVisible] = useState(0);
    const [currentPrice, setCurrentPrice] = useState(94500 + Math.random() * 2000);
    const [signal, setSignal] = useState(null);

    // Animate candles based on execution progress
    useEffect(() => {
        if (isExecuting) {
            setCandlesVisible(0);
            setSignal(null);
            const baseCandles = 5;
            const candlesPerNode = Math.floor(35 / totalNodes);

            let count = baseCandles;
            setCandlesVisible(count);

            const timer = setInterval(() => {
                count += 1;
                setCandlesVisible(Math.min(count, 40));
                if (count >= 40) clearInterval(timer);
            }, 150);

            return () => clearInterval(timer);
        }
    }, [isExecuting, totalNodes]);

    // Update candles based on executed nodes
    useEffect(() => {
        if (executedNodes > 0) {
            const progress = Math.min((executedNodes / totalNodes) * 40, 40);
            setCandlesVisible(Math.max(candlesVisible, Math.floor(progress)));
        }
    }, [executedNodes, totalNodes]);

    // Determine signal when enough nodes executed
    useEffect(() => {
        if (executedNodes >= totalNodes - 1) {
            setSignal(Math.random() > 0.5 ? 'BUY' : 'SELL');
        }
    }, [executedNodes, totalNodes]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const W = canvas.width;
        const H = canvas.height;

        ctx.clearRect(0, 0, W, H);

        // Background
        const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
        bgGrad.addColorStop(0, '#0f172a');
        bgGrad.addColorStop(1, '#1e293b');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        // Generate candles
        const numCandles = 40;
        const candles = [];
        let price = currentPrice * 0.96;
        const trend = signal === 'SELL' ? -1 : 1;

        for (let i = 0; i < numCandles; i++) {
            const vol = currentPrice * 0.005;
            const momentum = trend * vol * 0.1 * Math.pow(i / numCandles, 0.7);
            const noise = (Math.random() - 0.5) * vol * 1.2;

            const open = price;
            const close = open + momentum + noise;
            const high = Math.max(open, close) + vol * Math.random() * 0.5;
            const low = Math.min(open, close) - vol * Math.random() * 0.5;

            candles.push({ o: open, h: high, l: low, c: close, bull: close >= open });
            price = close;
        }

        const allPrices = candles.flatMap(c => [c.h, c.l]);
        const minP = Math.min(...allPrices) * 0.999;
        const maxP = Math.max(...allPrices) * 1.001;
        const priceRange = maxP - minP;

        const leftPad = 8;
        const rightPad = 50;
        const topPad = 10;
        const bottomPad = 10;
        const chartW = W - leftPad - rightPad;
        const chartH = H - topPad - bottomPad;

        const scaleY = (p) => topPad + chartH - ((p - minP) / priceRange) * chartH;
        const candleW = chartW / numCandles;

        // Grid
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 3; i++) {
            const y = topPad + (chartH / 3) * i;
            ctx.beginPath();
            ctx.moveTo(leftPad, y);
            ctx.lineTo(W - rightPad, y);
            ctx.stroke();
        }

        // Price labels
        ctx.fillStyle = '#475569';
        ctx.font = '9px system-ui';
        ctx.textAlign = 'left';
        for (let i = 0; i <= 3; i++) {
            const p = maxP - (priceRange / 3) * i;
            const y = topPad + (chartH / 3) * i;
            ctx.fillText('$' + p.toFixed(0), W - rightPad + 4, y + 3);
        }

        // Draw candles
        const visibleCount = Math.min(candlesVisible, numCandles);
        for (let i = 0; i < visibleCount; i++) {
            const c = candles[i];
            const x = leftPad + i * candleW + candleW / 2;

            // Wick
            ctx.strokeStyle = c.bull ? '#22c55e' : '#ef4444';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, scaleY(c.h));
            ctx.lineTo(x, scaleY(c.l));
            ctx.stroke();

            // Body
            const bodyTop = scaleY(Math.max(c.o, c.c));
            const bodyBot = scaleY(Math.min(c.o, c.c));
            const bodyH = Math.max(bodyBot - bodyTop, 1.5);
            const bodyW = candleW * 0.65;

            ctx.fillStyle = c.bull ? '#22c55e' : '#ef4444';
            ctx.fillRect(x - bodyW / 2, bodyTop, bodyW, bodyH);
        }

        // Current price line if we have candles
        if (visibleCount > 0) {
            const lastCandle = candles[visibleCount - 1];
            const cpY = scaleY(lastCandle.c);

            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(leftPad, cpY);
            ctx.lineTo(W - rightPad, cpY);
            ctx.stroke();
            ctx.setLineDash([]);

            // Price label
            ctx.fillStyle = '#3b82f6';
            ctx.fillRect(W - rightPad + 2, cpY - 8, 46, 16);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 9px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText('$' + lastCandle.c.toFixed(0), W - rightPad + 25, cpY + 4);

            // Pulsing dot
            ctx.beginPath();
            ctx.fillStyle = '#3b82f6';
            ctx.shadowColor = '#3b82f6';
            ctx.shadowBlur = 6;
            ctx.arc(leftPad + visibleCount * candleW - candleW / 2, cpY, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

    }, [candlesVisible, currentPrice, signal]);

    if (!isExecuting && candlesVisible === 0) return null;

    return (
        <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden shadow-xl mb-3">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-800/50 border-b border-slate-700">
                <div className="flex items-center gap-2">
                    <Activity size={14} className="text-blue-400" />
                    <span className="text-xs font-semibold text-white">BTC/USD</span>
                    <span className="text-[10px] text-slate-500">1m</span>
                </div>
                <div className="flex items-center gap-2">
                    {signal ? (
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${signal === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                            {signal === 'BUY' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                            {signal}
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-medium">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                            Analyzing...
                        </div>
                    )}
                </div>
            </div>

            {/* Chart */}
            <canvas ref={canvasRef} width={384} height={120} className="w-full" />

            {/* Progress */}
            <div className="px-3 py-2 bg-slate-800/30 border-t border-slate-700/50">
                <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                    <span>Analysis Progress</span>
                    <span>{Math.round((candlesVisible / 40) * 100)}%</span>
                </div>
                <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-300"
                        style={{ width: `${(candlesVisible / 40) * 100}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
