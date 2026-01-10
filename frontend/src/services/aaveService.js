// Aave Health Factor Service
// Integrates with Aave V3 protocol to fetch real health factor data

const AAVE_POOL_DATA_PROVIDER_ABI = [
    {
        "inputs": [{ "name": "user", "type": "address" }],
        "name": "getUserAccountData",
        "outputs": [
            { "name": "totalCollateralBase", "type": "uint256" },
            { "name": "totalDebtBase", "type": "uint256" },
            { "name": "availableBorrowsBase", "type": "uint256" },
            { "name": "currentLiquidationThreshold", "type": "uint256" },
            { "name": "ltv", "type": "uint256" },
            { "name": "healthFactor", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

// Aave V3 Pool addresses by chain
const AAVE_POOL_ADDRESSES = {
    // Mainnet
    1: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
    // Polygon
    137: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    // Arbitrum
    42161: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    // Optimism
    10: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    // Base
    8453: "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5",
    // Sepolia testnet
    11155111: "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951",
};

export class AaveHealthFactorService {
    constructor(publicClient, chainId = 1) {
        this.publicClient = publicClient;
        this.chainId = chainId;
        this.poolAddress = AAVE_POOL_ADDRESSES[chainId];
    }

    async getUserHealthFactor(userAddress) {
        if (!this.poolAddress) {
            throw new Error(`Aave not supported on chain ${this.chainId}`);
        }

        try {
            const data = await this.publicClient.readContract({
                address: this.poolAddress,
                abi: AAVE_POOL_DATA_PROVIDER_ABI,
                functionName: "getUserAccountData",
                args: [userAddress],
            });

            const [
                totalCollateralBase,
                totalDebtBase,
                availableBorrowsBase,
                currentLiquidationThreshold,
                ltv,
                healthFactor
            ] = data;

            // Health factor is in 18 decimals (1e18 = 1.0)
            const healthFactorFormatted = Number(healthFactor) / 1e18;

            return {
                totalCollateral: Number(totalCollateralBase) / 1e8, // USD value (8 decimals)
                totalDebt: Number(totalDebtBase) / 1e8,
                availableBorrows: Number(availableBorrowsBase) / 1e8,
                liquidationThreshold: Number(currentLiquidationThreshold) / 100, // Percentage
                ltv: Number(ltv) / 100,
                healthFactor: healthFactorFormatted,
                riskLevel: this.getRiskLevel(healthFactorFormatted),
                isHealthy: healthFactorFormatted > 1.1,
            };
        } catch (error) {
            console.error("Error fetching Aave health factor:", error);
            throw error;
        }
    }

    getRiskLevel(healthFactor) {
        if (healthFactor >= 2) return { level: "safe", color: "green", label: "Safe" };
        if (healthFactor >= 1.5) return { level: "moderate", color: "yellow", label: "Moderate" };
        if (healthFactor >= 1.1) return { level: "warning", color: "orange", label: "Warning" };
        if (healthFactor >= 1.0) return { level: "danger", color: "red", label: "Danger" };
        return { level: "liquidation", color: "red", label: "Liquidation Risk" };
    }

    // Monitor health factor with callback
    async monitorHealthFactor(userAddress, callback, intervalMs = 30000) {
        const check = async () => {
            try {
                const data = await this.getUserHealthFactor(userAddress);
                callback(data);
            } catch (error) {
                callback(null, error);
            }
        };

        // Initial check
        await check();

        // Set up interval
        const intervalId = setInterval(check, intervalMs);

        // Return cleanup function
        return () => clearInterval(intervalId);
    }

    // Calculate how much to repay to reach target health factor
    calculateRepayAmount(currentDebt, currentHF, targetHF, collateralValue, liquidationThreshold) {
        // HF = (Collateral * LiquidationThreshold) / Debt
        // To increase HF, we need to repay debt
        // TargetHF = (Collateral * LT) / (Debt - RepayAmount)
        // RepayAmount = Debt - (Collateral * LT) / TargetHF
        
        const numerator = collateralValue * (liquidationThreshold / 100);
        const targetDebt = numerator / targetHF;
        const repayAmount = currentDebt - targetDebt;
        
        return Math.max(0, repayAmount);
    }
}

// Export for use in engine
export async function queryAaveHealthFactor(publicClient, chainId, userAddress) {
    const service = new AaveHealthFactorService(publicClient, chainId);
    return service.getUserHealthFactor(userAddress);
}

// Mock data for demo purposes when not connected
export function getMockHealthFactorData(address) {
    const mockData = {
        "0x1234": { healthFactor: 1.85, totalCollateral: 15000, totalDebt: 8000, riskLevel: { level: "moderate", color: "yellow", label: "Moderate" } },
        "0x5678": { healthFactor: 2.45, totalCollateral: 25000, totalDebt: 10000, riskLevel: { level: "safe", color: "green", label: "Safe" } },
        "0x9abc": { healthFactor: 1.12, totalCollateral: 5000, totalDebt: 4200, riskLevel: { level: "warning", color: "orange", label: "Warning" } },
    };

    // Return based on address prefix or random
    const prefix = address?.slice(0, 6) || "0x1234";
    const seed = parseInt(prefix, 16) % 3;
    
    return {
        totalCollateral: 10000 + seed * 5000,
        totalDebt: 4000 + seed * 2000,
        availableBorrows: 3000 + seed * 1000,
        liquidationThreshold: 82.5,
        ltv: 75,
        healthFactor: 1.5 + (seed * 0.5),
        riskLevel: seed === 0 ? { level: "moderate", color: "yellow", label: "Moderate" } 
                   : seed === 1 ? { level: "safe", color: "green", label: "Safe" }
                   : { level: "warning", color: "orange", label: "Warning" },
        isHealthy: true,
    };
}
