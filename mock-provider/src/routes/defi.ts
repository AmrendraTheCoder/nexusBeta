import { Router } from "express";
import { defiYields, defiTvl } from "../data/mockData.js";

const router = Router();

/**
 * GET /api/defi/yields
 * Returns top DeFi yield opportunities
 */
router.get("/yields", (req, res) => {
  console.log("[DEFI] Serving yield data");
  res.json({
    success: true,
    data: defiYields,
    count: defiYields.length,
    generatedAt: new Date().toISOString(),
  });
});

/**
 * GET /api/defi/tvl
 * Returns protocol TVL rankings
 */
router.get("/tvl", (req, res) => {
  console.log("[DEFI] Serving TVL data");
  res.json({
    success: true,
    data: defiTvl,
    count: defiTvl.length,
    generatedAt: new Date().toISOString(),
  });
});

export default router;
