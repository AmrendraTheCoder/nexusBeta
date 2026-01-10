import React, { useState } from "react";
import { X, Book, Code, Copy, Check, ExternalLink, Zap, Server, Lock } from "lucide-react";

const apiEndpoints = [
    {
        method: "POST",
        path: "/api/execute",
        description: "Execute a workflow",
        category: "Core",
        request: `{
  "workflow": {
    "name": "My Workflow",
    "nodes": [...],
    "edges": [...]
  },
  "signer": "0x..."
}`,
        response: `{
  "success": true,
  "results": {...},
  "executionId": "abc123"
}`,
    },
    {
        method: "GET",
        path: "/api/registry/services",
        description: "Query x402 service registry",
        category: "x402",
        request: `GET /api/registry/services?category=oracle`,
        response: `{
  "services": [
    {
      "id": "pyth-oracle",
      "name": "Pyth Network",
      "price": "0.001 CRO",
      "endpoint": "..."
    }
  ]
}`,
    },
    {
        method: "POST",
        path: "/api/pay",
        description: "Process x402 payment",
        category: "x402",
        request: `{
  "serviceId": "pyth-oracle",
  "paymentReceipt": "0x...",
  "chainId": 240
}`,
        response: `{
  "success": true,
  "data": {...},
  "paymentTx": "0x..."
}`,
    },
    {
        method: "GET",
        path: "/api/workflows/:address",
        description: "Get saved workflows for wallet",
        category: "Storage",
        request: `GET /api/workflows/0x1234...`,
        response: `[
  {
    "_id": "...",
    "workflowName": "My Flow",
    "nodes": [...],
    "createdAt": "..."
  }
]`,
    },
];

const categories = ["All", "Core", "x402", "Storage"];

export default function DocsPanel({ isOpen, onClose }) {
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [copiedIndex, setCopiedIndex] = useState(null);

    const filteredEndpoints = selectedCategory === "All"
        ? apiEndpoints
        : apiEndpoints.filter(e => e.category === selectedCategory);

    const handleCopy = (text, index) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const methodColors = {
        GET: "bg-green-100 text-green-700",
        POST: "bg-blue-100 text-blue-700",
        PUT: "bg-amber-100 text-amber-700",
        DELETE: "bg-red-100 text-red-700",
    };

    return (
        <>
            <div
                className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                onClick={onClose}
            />

            <div className={`fixed top-0 right-0 h-full w-[550px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"} flex flex-col`}>
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0 bg-gradient-to-r from-slate-50 to-blue-50">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg flex items-center justify-center">
                            <Book size={18} className="text-white" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-800">API Documentation</h2>
                            <p className="text-xs text-slate-500">Nexus x402 Endpoints</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                        <X size={18} />
                    </button>
                </div>

                {/* Categories */}
                <div className="px-5 py-3 border-b border-slate-100 flex gap-2">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedCategory === cat
                                    ? "bg-slate-800 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Endpoints List */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {filteredEndpoints.map((endpoint, index) => (
                        <div key={index} className="border border-slate-200 rounded-xl overflow-hidden">
                            {/* Endpoint Header */}
                            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${methodColors[endpoint.method]}`}>
                                        {endpoint.method}
                                    </span>
                                    <code className="text-sm font-mono text-slate-700">{endpoint.path}</code>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 bg-slate-200 text-slate-600 rounded font-medium">
                                    {endpoint.category}
                                </span>
                            </div>

                            {/* Description */}
                            <div className="px-4 py-2 border-b border-slate-100">
                                <p className="text-sm text-slate-600">{endpoint.description}</p>
                            </div>

                            {/* Request */}
                            <div className="px-4 py-2 border-b border-slate-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold text-slate-500 uppercase">Request</span>
                                    <button
                                        onClick={() => handleCopy(endpoint.request, `req-${index}`)}
                                        className="p-1 text-slate-400 hover:text-slate-600"
                                    >
                                        {copiedIndex === `req-${index}` ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                                    </button>
                                </div>
                                <pre className="text-xs bg-slate-900 text-slate-300 p-3 rounded-lg overflow-x-auto">
                                    {endpoint.request}
                                </pre>
                            </div>

                            {/* Response */}
                            <div className="px-4 py-2">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold text-slate-500 uppercase">Response</span>
                                    <button
                                        onClick={() => handleCopy(endpoint.response, `res-${index}`)}
                                        className="p-1 text-slate-400 hover:text-slate-600"
                                    >
                                        {copiedIndex === `res-${index}` ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                                    </button>
                                </div>
                                <pre className="text-xs bg-slate-900 text-slate-300 p-3 rounded-lg overflow-x-auto">
                                    {endpoint.response}
                                </pre>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Zap size={12} />
                            <span>Cronos zkEVM Testnet (Chain ID: 240)</span>
                        </div>
                        <a
                            href="https://github.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                        >
                            View on GitHub
                            <ExternalLink size={10} />
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
}
