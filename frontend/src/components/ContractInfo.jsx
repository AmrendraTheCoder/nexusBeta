import React, { useState } from 'react';
import { CheckCircle, ExternalLink, Copy, Check } from 'lucide-react';
import { DEPLOYED_CONTRACTS } from '../constants/deployedContracts';

export default function ContractInfo() {
  const [copied, setCopied] = useState(null);
  const contracts = DEPLOYED_CONTRACTS.cronosZkEvmTestnet;

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const contractsList = [
    {
      name: 'NexusTreasury',
      address: contracts.treasury,
      description: 'Manages user deposits for the Nexus payment system',
      key: 'treasury'
    },
    {
      name: 'NexusRegistry',
      address: contracts.registry,
      description: 'On-chain registry for data providers and services',
      key: 'registry'
    },
    {
      name: 'SessionKeyManager',
      address: contracts.sessionKeyManager,
      description: 'Manages session keys for automated workflow execution',
      key: 'sessionKeyManager'
    }
  ];

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6 rounded-xl shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <CheckCircle className="w-8 h-8 text-green-500" />
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Smart Contracts Deployed ✅
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {contracts.network} (Chain ID: {contracts.chainId})
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {contractsList.map((contract) => (
          <div
            key={contract.key}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                  {contract.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {contract.description}
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 bg-gray-50 dark:bg-gray-900 rounded p-3">
              <code className="text-sm font-mono text-purple-600 dark:text-purple-400 flex-1 overflow-x-auto">
                {contract.address}
              </code>
              <button
                onClick={() => copyToClipboard(contract.address, contract.key)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title="Copy address"
              >
                {copied === contract.key ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                )}
              </button>
              <a
                href={`${contracts.explorer}/address/${contract.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title="View on explorer"
              >
                <ExternalLink className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
          Deployment Information
        </h4>
        <div className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
          <p>
            <span className="font-medium">Deployer:</span>{' '}
            <code className="bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded">
              {contracts.deployer}
            </code>
          </p>
          <p>
            <span className="font-medium">Deployed:</span>{' '}
            {new Date(contracts.deployedAt).toLocaleString()}
          </p>
          <p>
            <span className="font-medium">RPC URL:</span>{' '}
            <code className="bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded">
              {contracts.rpcUrl}
            </code>
          </p>
        </div>
      </div>

      <div className="mt-4 text-center">
        <a
          href={contracts.explorer}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          View all on Cronos zkEVM Explorer
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
