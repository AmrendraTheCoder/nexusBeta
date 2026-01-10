import { Router } from "express";
import { btcPrediction } from "../data/mockData.js";

const router = Router();

/**
 * GET /api/predictions/btc
 * Returns AI price predictions for Bitcoin
 */
router.get("/btc", (req, res) => {
  console.log("[PREDICTIONS] Serving BTC prediction");
  res.json({
    success: true,
    data: btcPrediction,
    generatedAt: new Date().toISOString(),
  });
});

export default router;
