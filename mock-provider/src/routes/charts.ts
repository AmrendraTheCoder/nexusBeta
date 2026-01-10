import { Router } from "express";
import { btc1hChart, eth1dChart } from "../data/mockData.js";

const router = Router();

/**
 * GET /api/charts/btc/1h
 * Returns BTC 1-hour candlestick data
 */
router.get("/btc/1h", (req, res) => {
  console.log("[CHARTS] Serving BTC 1h chart");
  res.json({
    success: true,
    symbol: "BTC/USD",
    interval: "1h",
    data: btc1hChart,
    count: btc1hChart.length,
    generatedAt: new Date().toISOString(),
  });
});

/**
 * GET /api/charts/eth/1d
 * Returns ETH daily candlestick data
 */
router.get("/eth/1d", (req, res) => {
  console.log("[CHARTS] Serving ETH 1d chart");
  res.json({
    success: true,
    symbol: "ETH/USD",
    interval: "1d",
    data: eth1dChart,
    count: eth1dChart.length,
    generatedAt: new Date().toISOString(),
  });
});

export default router;
