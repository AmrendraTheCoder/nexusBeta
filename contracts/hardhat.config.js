require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("@matterlabs/hardhat-zksync-solc");
require("@matterlabs/hardhat-zksync-deploy");
require("@matterlabs/hardhat-zksync-verify");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Cronos zkEVM Testnet (Primary - Hackathon Focus)
    cronosZkEvmTestnet: {
      url: process.env.CRONOS_RPC_URL || "https://testnet.zkevm.cronos.org",
      chainId: 240,
      accounts: [PRIVATE_KEY],
      ethNetwork: "sepolia",
      zksync: true,
    },
    // Base Sepolia
    baseSepolia: {
      url: process.env.BASE_RPC_URL || "https://sepolia.base.org",
      chainId: 84532,
      accounts: [PRIVATE_KEY],
    },
    // Polygon Amoy
    polygonAmoy: {
      url: process.env.POLYGON_RPC_URL || "https://rpc-amoy.polygon.technology",
      chainId: 80002,
      accounts: [PRIVATE_KEY],
    },
    // Ethereum Sepolia
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
      chainId: 11155111,
      accounts: [PRIVATE_KEY],
    },
    // Local Hardhat for testing
    hardhat: {
      chainId: 31337,
      zksync: false,
    },
  },
  etherscan: {
    apiKey: {
      cronosZkEvmTestnet: process.env.CRONOS_API_KEY || "",
      baseSepolia: process.env.BASESCAN_API_KEY || "",
      polygonAmoy: process.env.POLYGONSCAN_API_KEY || "",
      sepolia: process.env.ETHERSCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "cronosZkEvmTestnet",
        chainId: 240,
        urls: {
          apiURL: "https://explorer.zkevm.cronos.org/testnet/api",
          browserURL: "https://explorer.zkevm.cronos.org/testnet",
        },
      },
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org",
        },
      },
      {
        network: "polygonAmoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com",
        },
      },
    ],
  },
  paths: {
    sources: "./src",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  zksolc: {
    version: "1.5.0",
    settings: {
      optimizer: {
        enabled: true,
      },
    },
  },
};
