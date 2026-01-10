// src/components/ViewWorkflows.jsx

import { useState } from "react";
import { useAccount } from "wagmi";
import { FolderOpen, Loader2, X, FileText, Clock, Trash2 } from "lucide-react";

export default function ViewWorkflows({ onLoadWorkflow }) {
  const [isOpen, setIsOpen] = useState(false);
  const [workflows, setWorkflows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { address, isConnected } = useAccount();

  const fetchWorkflows = async () => {
    if (!isConnected) {
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(
        `http://d8n-dz9h.vercel.app/api/workflows/${address}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch workflows.");
      }
      const data = await response.json();
      setWorkflows(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    fetchWorkflows();
  };

  const handleLoad = (workflow) => {
    onLoadWorkflow(workflow);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 px-3 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all text-sm font-medium"
      >
        <FolderOpen size={16} /> Workflows
      </button>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sliding Panel */}
      <div className={`fixed top-0 right-0 h-full w-[380px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"} flex flex-col`}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <FolderOpen size={20} className="text-slate-600" />
            <div>
              <h2 className="font-semibold text-slate-800">Saved Workflows</h2>
              <p className="text-xs text-slate-500">Your workflow library</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto">
          {!isConnected ? (
            <div className="p-8 text-center">
              <FolderOpen size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm text-slate-500">Connect wallet to view workflows</p>
            </div>
          ) : isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="animate-spin text-blue-500 mx-auto" size={32} />
              <p className="text-sm text-slate-500 mt-2">Loading...</p>
            </div>
          ) : workflows.length > 0 ? (
            <div className="p-3 space-y-2">
              {workflows.map((flow) => (
                <button
                  key={flow._id}
                  onClick={() => handleLoad(flow)}
                  className="w-full text-left p-4 bg-slate-50 hover:bg-blue-50 rounded-xl border border-slate-200 hover:border-blue-200 transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <FileText size={18} className="text-slate-400 group-hover:text-blue-500" />
                      <div>
                        <p className="font-medium text-slate-800 group-hover:text-blue-700">{flow.workflowName}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock size={10} />
                          {new Date(flow.createdAt || Date.now()).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <FolderOpen size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm text-slate-500">No workflows saved yet</p>
              <p className="text-xs text-slate-400 mt-1">Create and save your first workflow</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex-shrink-0">
          <p className="text-xs text-slate-500 text-center">
            {workflows.length} workflow{workflows.length !== 1 ? 's' : ''} saved
          </p>
        </div>
      </div>
    </>
  );
}
