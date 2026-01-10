import { Router } from "express";
import { trendingNfts } from "../data/mockData.js";

const router = Router();

/**
 * GET /api/nft/trending
 * Returns trending NFT collections
 */
router.get("/trending", (req, res) => {
  console.log("[NFT] Serving trending collections");
  res.json({
    success: true,
    data: trendingNfts,
    count: trendingNfts.length,
    generatedAt: new Date().toISOString(),
  });
});

export default router;
