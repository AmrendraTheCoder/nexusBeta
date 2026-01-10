import { Router } from "express";
import { btcSentiment, ethSentiment } from "../data/mockData.js";

const router = Router();

/**
 * GET /api/sentiment/btc
 * Returns Bitcoin sentiment and fear/greed index
 */
router.get("/btc", (req, res) => {
  console.log("[SENTIMENT] Serving BTC sentiment");
  res.json({
    success: true,
    data: btcSentiment,
    generatedAt: new Date().toISOString(),
  });
});

/**
 * GET /api/sentiment/eth
 * Returns Ethereum sentiment and social metrics
 */
router.get("/eth", (req, res) => {
  console.log("[SENTIMENT] Serving ETH sentiment");
  res.json({
    success: true,
    data: ethSentiment,
    generatedAt: new Date().toISOString(),
  });
});

export default router;
