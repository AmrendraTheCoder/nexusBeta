import { Router } from "express";
import { whaleAlerts, gasEstimate } from "../data/mockData.js";

const router = Router();

/**
 * GET /api/onchain/whale-alerts
 * Returns large transaction alerts
 */
router.get("/whale-alerts", (req, res) => {
  console.log("[ONCHAIN] Serving whale alerts");
  res.json({
    success: true,
    data: whaleAlerts,
    count: whaleAlerts.length,
    generatedAt: new Date().toISOString(),
  });
});

/**
 * GET /api/onchain/gas-estimate
 * Returns gas price estimates for multiple chains
 */
router.get("/gas-estimate", (req, res) => {
  console.log("[ONCHAIN] Serving gas estimates");
  res.json({
    success: true,
    data: gasEstimate,
    generatedAt: new Date().toISOString(),
  });
});

export default router;
