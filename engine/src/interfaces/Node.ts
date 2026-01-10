import type { WalletConfig } from "./WalletConfig.js";

export interface Node{
    id: string;
    label: string;
    type: string;
    inputs: Record<string, any>;
    outputs: Record<string, any>;
    walletConfig: WalletConfig | undefined;  // Optional wallet configuration for transaction nodes
    execute(): Promise<any> | void;
}