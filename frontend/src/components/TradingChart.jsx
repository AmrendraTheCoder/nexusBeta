import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import {
    TrendingUp, TrendingDown, RefreshCw, Wifi, WifiOff,
    Clock, BarChart3, Activity, Zap
} from 'lucide-react';

// Binance API for real candlestick data
const BINANCE_API = 'https://api.binance.com/api/v3';

const SYMBOLS = [
    { symbol: 'BTCUSDT', display: 'BTC/USD', name: 'Bitcoin' },
    { symbol: 'ETHUSDT', display: 'ETH/USD', name: 'Ethereum' },
    { symbol: 'SOLUSDT', display: 'SOL/USD', name: 'Solana' },
    { symbol: 'BNBUSDT', display: 'BNB/USD', name: 'BNB' },
];

const INTERVALS = [
    { value: '1m', label: '1m' },
    { value: '5m', label: '5m' },
    { value: '15m', label: '15m' },
    { value: '1h', label: '1H' },
    { value: '4h', label: '4H' },
    { value: '1d', label: '1D' },
];

export default function TradingChart({
    onPriceUpdate,
    onChartCapture,
    compact = false,
    defaultSymbol = 'BTCUSDT'
}) {
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);
    const candleSeriesRef = useRef(null);
    const volumeSeriesRef = useRef(null);
    const wsRef = useRef(null);

    const [selectedSymbol, setSelectedSymbol] = useState(
        SYMBOLS.find(s => s.symbol === defaultSymbol) || SYMBOLS[0]
    );
    const [interval, setInterval] = useState('15m');
    const [isLoading, setIsLoading] = useState(true);
    const [isConnected, setIsConnected] = useState(false);
    const [currentPrice, setCurrentPrice] = useState(null);
    const [priceChange, setPriceChange] = useState(0);
    const [volume24h, setVolume24h] = useState(0);
    const [high24h, setHigh24h] = useState(0);
    const [low24h, setLow24h] = useState(0);

    // Fetch historical candlestick data
    const fetchKlines = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(
                `${BINANCE_API}/klines?symbol=${selectedSymbol.symbol}&interval=${interval}&limit=200`
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
                color: parseFloat(d[4]) >= parseFloat(d[1]) ? '#22c55e40' : '#ef444440',
            }));

            if (candleSeriesRef.current) {
                candleSeriesRef.current.setData(candles);
            }
            if (volumeSeriesRef.current) {
                volumeSeriesRef.current.setData(volumes);
            }

            // Get 24h ticker
            const tickerRes = await fetch(
                `${BINANCE_API}/ticker/24hr?symbol=${selectedSymbol.symbol}`
            );
            const ticker = await tickerRes.json();

            setCurrentPrice(parseFloat(ticker.lastPrice));
            setPriceChange(parseFloat(ticker.priceChangePercent));
            setVolume24h(parseFloat(ticker.volume));
            setHigh24h(parseFloat(ticker.highPrice));
            setLow24h(parseFloat(ticker.lowPrice));

            if (onPriceUpdate) {
                onPriceUpdate({
                    symbol: selectedSymbol.symbol,
                    price: parseFloat(ticker.lastPrice),
                    change: parseFloat(ticker.priceChangePercent),
                });
            }

        } catch (error) {
            console.error('Failed to fetch klines:', error);
        }
        setIsLoading(false);
    };

    // WebSocket for real-time updates
    const connectWebSocket = () => {
        if (wsRef.current) {
            wsRef.current.close();
        }

        const ws = new WebSocket(
            `wss://stream.binance.com:9443/ws/${selectedSymbol.symbol.toLowerCase()}@kline_${interval}`
        );

        ws.onopen = () => {
            setIsConnected(true);
            console.log('WebSocket connected');
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.k) {
                const candle = {
                    time: data.k.t / 1000,
                    open: parseFloat(data.k.o),
                    high: parseFloat(data.k.h),
                    low: parseFloat(data.k.l),
                    close: parseFloat(data.k.c),
                };

                if (candleSeriesRef.current) {
                    candleSeriesRef.current.update(candle);
                }

                if (volumeSeriesRef.current) {
                    volumeSeriesRef.current.update({
                        time: data.k.t / 1000,
                        value: parseFloat(data.k.v),
                        color: candle.close >= candle.open ? '#22c55e40' : '#ef444440',
                    });
                }

                setCurrentPrice(candle.close);

                if (onPriceUpdate) {
                    onPriceUpdate({
                        symbol: selectedSymbol.symbol,
                        price: candle.close,
                        change: priceChange,
                    });
                }
            }
        };

        ws.onclose = () => {
            setIsConnected(false);
            console.log('WebSocket disconnected');
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            setIsConnected(false);
        };

        wsRef.current = ws;
    };

    // Initialize chart
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: 'solid', color: '#ffffff' },
                textColor: '#64748b',
            },
            grid: {
                vertLines: { color: '#f1f5f9' },
                horzLines: { color: '#f1f5f9' },
            },
            crosshair: {
                mode: 1,
                vertLine: {
                    color: '#94a3b8',
                    width: 1,
                    style: 2,
                    labelBackgroundColor: '#1e293b',
                },
                horzLine: {
                    color: '#94a3b8',
                    width: 1,
                    style: 2,
                    labelBackgroundColor: '#1e293b',
                },
            },
            rightPriceScale: {
                borderColor: '#e2e8f0',
                scaleMargins: { top: 0.1, bottom: 0.2 },
            },
            timeScale: {
                borderColor: '#e2e8f0',
                timeVisible: true,
                secondsVisible: false,
            },
            handleScroll: { vertTouchDrag: false },
        });

        // Candlestick series
        const candleSeries = chart.addCandlestickSeries({
            upColor: '#22c55e',
            downColor: '#ef4444',
            borderUpColor: '#22c55e',
            borderDownColor: '#ef4444',
            wickUpColor: '#22c55e',
            wickDownColor: '#ef4444',
        });

        // Volume series
        const volumeSeries = chart.addHistogramSeries({
            priceFormat: { type: 'volume' },
            priceScaleId: '',
            scaleMargins: { top: 0.85, bottom: 0 },
        });

        chartRef.current = chart;
        candleSeriesRef.current = candleSeries;
        volumeSeriesRef.current = volumeSeries;

        // Handle resize
        const handleResize = () => {
            if (chartContainerRef.current && chartRef.current) {
                chartRef.current.applyOptions({
                    width: chartContainerRef.current.clientWidth,
                    height: compact ? 250 : 350,
                });
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (wsRef.current) wsRef.current.close();
            if (chartRef.current) chartRef.current.remove();
        };
    }, [compact]);

    // Fetch data when symbol or interval changes
    useEffect(() => {
        fetchKlines();
        connectWebSocket();

        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, [selectedSymbol, interval]);

    const formatPrice = (price) => {
        if (!price) return '--';
        if (price >= 1000) return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        if (price >= 1) return price.toFixed(2);
        return price.toFixed(4);
    };

    const formatVolume = (vol) => {
        if (!vol) return '--';
        if (vol >= 1e9) return (vol / 1e9).toFixed(2) + 'B';
        if (vol >= 1e6) return (vol / 1e6).toFixed(2) + 'M';
        if (vol >= 1e3) return (vol / 1e3).toFixed(2) + 'K';
        return vol.toFixed(2);
    };

    const isPositive = priceChange >= 0;

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {/* Symbol Selector */}
                        <div className="flex gap-1">
                            {SYMBOLS.map((s) => (
                                <button
                                    key={s.symbol}
                                    onClick={() => setSelectedSymbol(s)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedSymbol.symbol === s.symbol
                                            ? 'bg-slate-800 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    {s.display.split('/')[0]}
                                </button>
                            ))}
                        </div>

                        {/* Connection Status */}
                        <div className={`flex items-center gap-1.5 text-xs ${isConnected ? 'text-green-600' : 'text-slate-400'}`}>
                            {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
                            <span>{isConnected ? 'Live' : 'Offline'}</span>
                        </div>
                    </div>

                    {/* Interval Selector */}
                    <div className="flex gap-1">
                        {INTERVALS.map((i) => (
                            <button
                                key={i.value}
                                onClick={() => setInterval(i.value)}
                                className={`px-2 py-1 rounded text-xs font-medium transition-all ${interval === i.value
                                        ? 'bg-slate-800 text-white'
                                        : 'text-slate-500 hover:bg-slate-100'
                                    }`}
                            >
                                {i.label}
                            </button>
                        ))}
                        <button
                            onClick={fetchKlines}
                            className="ml-2 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                        >
                            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Price Info Bar */}
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold text-slate-800">
                                ${formatPrice(currentPrice)}
                            </span>
                            <span className={`flex items-center gap-0.5 text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'
                                }`}>
                                {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
                            </span>
                        </div>
                        <span className="text-xs text-slate-500">{selectedSymbol.name}</span>
                    </div>
                </div>

                <div className="flex gap-6 text-xs">
                    <div>
                        <span className="text-slate-400">24h High</span>
                        <p className="font-medium text-slate-700">${formatPrice(high24h)}</p>
                    </div>
                    <div>
                        <span className="text-slate-400">24h Low</span>
                        <p className="font-medium text-slate-700">${formatPrice(low24h)}</p>
                    </div>
                    <div>
                        <span className="text-slate-400">24h Vol</span>
                        <p className="font-medium text-slate-700">{formatVolume(volume24h)}</p>
                    </div>
                </div>
            </div>

            {/* Chart Container */}
            <div
                ref={chartContainerRef}
                className="w-full"
                style={{ height: compact ? 250 : 350 }}
            />

            {/* Loading Overlay */}
            {isLoading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                    <div className="flex items-center gap-2 text-slate-500">
                        <RefreshCw size={20} className="animate-spin" />
                        <span>Loading chart data...</span>
                    </div>
                </div>
            )}
        </div>
    );
}
