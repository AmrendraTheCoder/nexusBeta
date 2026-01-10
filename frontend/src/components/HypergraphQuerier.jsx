import { useState } from "react";
import { Graph } from "@graphprotocol/grc-20";
import { Search, Loader2, X, Database, FileJson, ToggleLeft, ToggleRight } from "lucide-react";

// Mock workflow data for testing
const mockWorkflowData = {
  walletaddr: "0x1234567890123456789012345678901234567890",
  type: "once",
  name: "AI Trading Workflow",
  nodes: {
    "node-1": { position: { x: 100, y: 100 }, label: "Pyth Price Feed", type: "pyth-network", node_data: { symbol: "ETH_USD" } },
    "node-2": { position: { x: 400, y: 100 }, label: "x402 Payment", type: "nexusPay", node_data: {} },
  },
  edges: { "node-1": { "node-2": { "output-1": "input-1" } } },
};

const mockApiResponse = {
  data: {
    entities: [{ id: "mock-entity-id", name: "Mock Workflow", description: JSON.stringify(mockWorkflowData) }],
  },
};

export default function HypergraphQuerier() {
  const [isOpen, setIsOpen] = useState(false);
  const [spaceId, setSpaceId] = useState("");
  const [workflowData, setWorkflowData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [useMockApi, setUseMockApi] = useState(true);

  const handleQuery = async () => {
    if (!spaceId.trim() && !useMockApi) {
      setError("Please enter a valid Space ID.");
      return;
    }
    setIsLoading(true);
    setWorkflowData(null);
    setError("");

    if (useMockApi) {
      setTimeout(() => {
        try {
          const entities = mockApiResponse.data.entities;
          const entity = entities[0];
          const parsedData = JSON.parse(entity.description);
          setWorkflowData(parsedData);
        } catch (mockError) {
          setError("Failed to parse mock data.");
        } finally {
          setIsLoading(false);
        }
      }, 500);
      return;
    }

    const graphqlQuery = {
      query: `query GetEntitiesInSpace($spaceId: UUID!) { entities(filter: { spaceIds: { in: [$spaceId] } }) { id name description } }`,
      variables: { spaceId: spaceId.trim() },
    };

    try {
      const response = await fetch(`${Graph.TESTNET_API_ORIGIN}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(graphqlQuery),
      });
      if (!response.ok) throw new Error(`API error. Status: ${response.status}`);
      const result = await response.json();
      if (result.errors) throw new Error(result.errors.map((e) => e.message).join("\n"));
      const entities = result.data.entities;
      if (!entities || entities.length === 0) throw new Error("No entities found in this space.");
      const entity = entities[0];
      if (!entity || !entity.description) throw new Error("Workflow data not found.");
      const parsedData = JSON.parse(entity.description);
      setWorkflowData(parsedData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const closePanel = () => {
    setIsOpen(false);
    setWorkflowData(null);
    setError("");
    setSpaceId("");
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all text-sm font-medium"
      >
        <Search size={16} />
        Query
      </button>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={closePanel}
      />

      {/* Sliding Panel */}
      <div className={`fixed top-0 right-0 h-full w-[450px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"} flex flex-col`}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <Database size={20} className="text-slate-600" />
            <div>
              <h2 className="font-semibold text-slate-800">Query Hypergraph</h2>
              <p className="text-xs text-slate-500">Load workflow from GRC-20</p>
            </div>
          </div>
          <button onClick={closePanel} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Search Input */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Space ID</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={spaceId}
                onChange={(e) => setSpaceId(e.target.value)}
                placeholder={useMockApi ? "Mock mode enabled" : "Enter Space ID"}
                disabled={isLoading || useMockApi}
                className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <button
                onClick={handleQuery}
                disabled={isLoading}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-slate-400 flex items-center gap-2"
              >
                {isLoading ? <Loader2 className="animate-spin" size={14} /> : <Search size={14} />}
                Query
              </button>
            </div>
          </div>

          {/* Mock Toggle */}
          <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer">
            <button
              onClick={() => setUseMockApi(!useMockApi)}
              className="text-blue-600"
            >
              {useMockApi ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
            </button>
            <span className="text-sm text-slate-700">Use Mock API (for testing)</span>
          </label>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Result */}
          {workflowData && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileJson size={16} className="text-green-600" />
                <span className="text-sm font-semibold text-slate-700">Workflow Retrieved</span>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Name</span>
                  <span className="text-sm font-medium text-slate-800">{workflowData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Type</span>
                  <span className="text-sm font-medium text-slate-800">{workflowData.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Nodes</span>
                  <span className="text-sm font-medium text-slate-800">{Object.keys(workflowData.nodes || {}).length}</span>
                </div>
              </div>

              <details className="bg-slate-900 rounded-lg overflow-hidden">
                <summary className="px-4 py-2 text-xs text-slate-400 cursor-pointer hover:bg-slate-800">
                  View Raw JSON
                </summary>
                <pre className="px-4 pb-4 text-xs text-slate-300 overflow-auto max-h-48">
                  {JSON.stringify(workflowData, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex-shrink-0">
          <button
            onClick={closePanel}
            className="w-full py-2.5 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
