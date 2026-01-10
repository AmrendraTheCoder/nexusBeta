import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import "./index.css";

// 1. Import wagmi and dependencies
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet, sepolia, baseSepolia, polygonAmoy } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { metaMask, injected } from "wagmi/connectors";

// Custom chain: Cronos zkEVM Testnet
const cronosZkEvmTestnet = {
  id: 240,
  name: "Cronos zkEVM Testnet",
  nativeCurrency: {
    name: "zkTCRO",
    symbol: "zkTCRO",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["https://testnet.zkevm.cronos.org"] },
  },
  blockExplorers: {
    default: { name: "Cronos zkEVM Explorer", url: "https://explorer.zkevm.cronos.org/testnet" },
  },
  testnet: true,
};

// 2. Create wagmi config with multi-chain support
// NOTE: Cronos zkEVM Testnet (240) is set as the FIRST chain, making it the default
const config = createConfig({
  chains: [cronosZkEvmTestnet, baseSepolia, polygonAmoy, sepolia, mainnet],
  connectors: [
    injected({ 
      shimDisconnect: true,
      // Target Cronos zkEVM Testnet by default
      target: {
        id: cronosZkEvmTestnet.id,
        name: cronosZkEvmTestnet.name,
      }
    }),
    metaMask({
      // Prefer Cronos zkEVM Testnet
      dappMetadata: {
        name: "Nexus x402",
      },
    }),
  ],
  transports: {
    [cronosZkEvmTestnet.id]: http("https://testnet.zkevm.cronos.org"),
    [baseSepolia.id]: http(),
    [polygonAmoy.id]: http(),
    [sepolia.id]: http(),
    [mainnet.id]: http(),
  },
});

// 3. Create a QueryClient
const queryClient = new QueryClient();

// 4. Wrap your App with the providers
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </WagmiProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

