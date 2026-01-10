import React, { useState, useEffect } from "react";
import { Activity, Clock, StopCircle, PlayCircle, TrendingUp, Zap, CheckCircle, XCircle, Eye } from "lucide-react";

export default function WorkflowPortfolio({ onClose, onViewExecution }) {
  const [activeWorkflows, setActiveWorkflows] = useState([]);
  const [completedWorkflows, setCompletedWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkflows();
    const interval = setInterval(fetchWorkflows, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const fetchWorkflows = async () => {
    try {
      console.log('[Portfolio] Fetching workflows from backend...');
      const response = await fetch("http://localhost:8080/workflows/active");
      console.log('[Portfolio] Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[Portfolio] Received data:', data);
        console.log('[Portfolio] Active workflows:', data.active?.length || 0);
        console.log('[Portfolio] Completed workflows:', data.completed?.length || 0);
        
        setActiveWorkflows(data.active || []);
        setCompletedWorkflows(data.completed || []);
      } else {
        console.error('[Portfolio] Response not OK:', response.status);
      }
    } catch (error) {
      console.error("[Portfolio] Failed to fetch workflows:", error);
    } finally {
      setLoading(false);
    }
  };

  const stopWorkflow = async (workflowId) => {
    try {
      const response = await fetch("http://localhost:8080/workflow/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId })
      });

      if (response.ok) {
        console.log(`✅ Stopped workflow: ${workflowId}`);
        fetchWorkflows(); // Refresh list
      }
    } catch (error) {
      console.error("Failed to stop workflow:", error);
    }
  };

  const getTimeRunning = (startTime) => {
    const elapsed = Date.now() - new Date(startTime).getTime();
    const hours = Math.floor(elapsed / (1000 * 60 * 60));
    const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full h-full bg-gradient-to-br from-slate-50 via-white to-slate-50 overflow-auto">
        
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-lg border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                  Workflow Portfolio
                </h1>
                <p className="text-slate-600 mt-1">Manage your active and completed workflows</p>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          
          {/* Active Workflows */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Activity size={24} className="text-green-600 animate-pulse" />
              <h2 className="text-2xl font-bold text-slate-800">Active Workflows</h2>
              <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                {activeWorkflows.length} Running
              </span>
            </div>

            {loading ? (
              <div className="bg-white rounded-xl p-8 text-center border-2 border-slate-200">
                <Activity size={48} className="mx-auto text-slate-400 animate-spin mb-4" />
                <p className="text-slate-600">Loading workflows...</p>
              </div>
            ) : activeWorkflows.length === 0 ? (
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-12 text-center border-2 border-slate-200">
                <PlayCircle size={64} className="mx-auto text-slate-400 mb-4" />
                <p className="text-xl font-semibold text-slate-700 mb-2">No Active Workflows</p>
                <p className="text-slate-500">Execute a workflow in repeat mode to see it here</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {activeWorkflows.map((workflow) => (
                  <div
                    key={workflow.id}
                    className="bg-white rounded-xl border-2 border-green-200 shadow-lg hover:shadow-xl transition-all"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                            <h3 className="text-xl font-bold text-slate-800">{workflow.name || "Unnamed Workflow"}</h3>
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs font-bold">
                              LIVE
                            </span>
                          </div>
                          <p className="text-slate-600 text-sm mb-3">
                            {workflow.type === "repeat" ? "🔄 Repeat Mode" : "⚡ Single Execution"}
                          </p>
                          <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                              <Clock size={16} className="text-blue-500" />
                              <span className="text-slate-700">Running for: <strong>{getTimeRunning(workflow.startTime)}</strong></span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Zap size={16} className="text-purple-500" />
                              <span className="text-slate-700">Cycles: <strong>{workflow.cycleCount || 0}</strong></span>
                            </div>
                            <div className="flex items-center gap-2">
                              <TrendingUp size={16} className="text-orange-500" />
                              <span className="text-slate-700">Status: <strong>{workflow.status || "Running"}</strong></span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => onViewExecution && onViewExecution(workflow)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all"
                          >
                            <Eye size={16} />
                            View Results
                          </button>
                          <button
                            onClick={() => stopWorkflow(workflow.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all"
                          >
                            <StopCircle size={16} />
                            Stop Workflow
                          </button>
                        </div>
                      </div>

                      {/* Progress Info */}
                      {workflow.type === "repeat" && (
                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-slate-600">Next execution in:</span>
                            <span className="font-mono font-bold text-purple-600">
                              {workflow.nextExecutionIn || "Calculating..."}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 animate-pulse" style={{ width: "45%" }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed Workflows */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle size={24} className="text-slate-600" />
              <h2 className="text-2xl font-bold text-slate-800">Recent Completions</h2>
              <span className="bg-slate-200 text-slate-700 px-3 py-1 rounded-full text-sm font-bold">
                {completedWorkflows.length}
              </span>
            </div>

            {completedWorkflows.length === 0 ? (
              <div className="bg-slate-50 rounded-xl p-8 text-center border-2 border-slate-200">
                <p className="text-slate-500">No completed workflows yet</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {completedWorkflows.slice(0, 5).map((workflow, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-4 border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle size={20} className="text-green-500" />
                      <div>
                        <p className="font-semibold text-slate-800">{workflow.name || "Unnamed Workflow"}</p>
                        <p className="text-sm text-slate-500">Completed {new Date(workflow.endTime).toLocaleString()}</p>
                      </div>
                    </div>
                    <span className="text-sm text-slate-600">
                      {workflow.cycleCount || 1} cycles • {workflow.duration || "N/A"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
