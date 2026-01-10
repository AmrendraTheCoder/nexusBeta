import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import middleware
import { paywallMiddleware } from "./middleware/paywall.js";

// Import routes
import newsRoutes from "./routes/news.js";
import sentimentRoutes from "./routes/sentiment.js";
import chartsRoutes from "./routes/charts.js";
import onchainRoutes from "./routes/onchain.js";
import defiRoutes from "./routes/defi.js";
import nftRoutes from "./routes/nft.js";
import predictionsRoutes from "./routes/predictions.js";

const app = express();
const PORT = parseInt(process.env.PORT || "4000", 10);

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check (no payment required)
app.get("/", (req, res) => {
  res.json({
    service: "Nexus Mock Data Provider",
    version: "1.0.0",
    status: "healthy",
    demoMode: process.env.DEMO_MODE === "true",
    endpoints: {
      news: ["/api/news/crypto", "/api/news/stocks"],
      sentiment: ["/api/sentiment/btc", "/api/sentiment/eth"],
      charts: ["/api/charts/btc/1h", "/api/charts/eth/1d"],
      onchain: ["/api/onchain/whale-alerts", "/api/onchain/gas-estimate"],
      defi: ["/api/defi/yields", "/api/defi/tvl"],
      nft: ["/api/nft/trending"],
      predictions: ["/api/predictions/btc"],
    },
    paymentInfo: {
      message: "All /api/* endpoints require HTTP 402 payment",
      acceptedChains: [
        { chainId: 240, name: "Cronos zkEVM Testnet" },
        { chainId: 84532, name: "Base Sepolia" },
        { chainId: 80002, name: "Polygon Amoy" },
        { chainId: 11155111, name: "Ethereum Sepolia" },
      ],
      paymentHeader: "X-PAYMENT: <txHash>:<chainId>",
    },
  });
});

// Health endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Apply paywall middleware to all /api routes
app.use("/api", paywallMiddleware);

// API Routes (all protected by paywall)
app.use("/api/news", newsRoutes);
app.use("/api/sentiment", sentimentRoutes);
app.use("/api/charts", chartsRoutes);
app.use("/api/onchain", onchainRoutes);
app.use("/api/defi", defiRoutes);
app.use("/api/nft", nftRoutes);
app.use("/api/predictions", predictionsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Endpoint ${req.path} does not exist`,
    availableEndpoints: [
      "/api/news/crypto",
      "/api/news/stocks",
      "/api/sentiment/btc",
      "/api/sentiment/eth",
      "/api/charts/btc/1h",
      "/api/charts/eth/1d",
      "/api/onchain/whale-alerts",
      "/api/onchain/gas-estimate",
      "/api/defi/yields",
      "/api/defi/tvl",
      "/api/nft/trending",
      "/api/predictions/btc",
    ],
  });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("[ERROR]", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
  });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║           NEXUS MOCK DATA PROVIDER                           ║
╠══════════════════════════════════════════════════════════════╣
║  Server running on: http://localhost:${PORT}                    ║
║  Demo Mode: ${process.env.DEMO_MODE === "true" ? "ENABLED (payments simulated)" : "DISABLED (real verification)"}           ║
║                                                              ║
║  Endpoints: 12 premium data APIs                             ║
║  Payment: HTTP 402 with X-PAYMENT header                     ║
║                                                              ║
║  Try: curl http://localhost:${PORT}/api/news/crypto             ║
║  (Will return 402 Payment Required)                          ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

export default app;
