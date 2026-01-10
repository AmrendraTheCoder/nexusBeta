import { Router } from "express";
import { cryptoNews, stockNews } from "../data/mockData.js";

const router = Router();

/**
 * GET /api/news/crypto
 * Returns latest crypto news headlines
 */
router.get("/crypto", (req, res) => {
  console.log("[NEWS] Serving crypto news");
  res.json({
    success: true,
    data: cryptoNews,
    count: cryptoNews.length,
    generatedAt: new Date().toISOString(),
  });
});

/**
 * GET /api/news/stocks
 * Returns latest stock market news
 */
router.get("/stocks", (req, res) => {
  console.log("[NEWS] Serving stock news");
  res.json({
    success: true,
    data: stockNews,
    count: stockNews.length,
    generatedAt: new Date().toISOString(),
  });
});

export default router;
