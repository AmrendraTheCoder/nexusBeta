import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, Terminal, CheckCircle, XCircle, Loader, Clock, Trash2 } from "lucide-react";

export default function ExecutionLogsPanel({ logs, isExecuting, onClear }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const logsEndRef = useRef(null);

    // Auto-expand when execution starts
    useEffect(() => {
        if (isExecuting) {
            setIsExpanded(true);
        }
    }, [isExecuting]);

    // Auto-scroll to bottom when new logs arrive
    useEffect(() => {
        if (isExpanded && logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [logs, isExpanded]);

    const getLogIcon = (type) => {
        switch (type) {
            case "success":
                return <CheckCircle size={14} className="text-green-500" />;
            case "error":
                return <XCircle size={14} className="text-red-500" />;
            case "executing":
                return <Loader size={14} className="text-blue-500 animate-spin" />;
            case "payment":
                return <span className="text-sm">💰</span>;
            default:
                return <Clock size={14} className="text-slate-400" />;
        }
    };

    const getLogColor = (type) => {
        switch (type) {
            case "success":
                return "text-green-600";
            case "error":
                return "text-red-600";
            case "executing":
                return "text-blue-600";
            case "payment":
                return "text-purple-600";
            default:
                return "text-slate-600";
        }
    };

    return (
        <div
            className={`fixed bottom-0 left-0 right-0 bg-slate-900 text-white transition-all duration-300 z-40 ${isExpanded ? "h-64" : "h-10"
                }`}
        >
            {/* Header */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center justify-between px-4 h-10 bg-slate-800 cursor-pointer hover:bg-slate-700 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Terminal size={16} className="text-green-400" />
                    <span className="text-sm font-medium">Execution Logs</span>
                    {isExecuting && (
                        <span className="flex items-center gap-1 text-xs bg-blue-600 px-2 py-0.5 rounded-full">
                            <Loader size={12} className="animate-spin" />
                            Running
                        </span>
                    )}
                    {logs.length > 0 && !isExecuting && (
                        <span className="text-xs bg-slate-700 px-2 py-0.5 rounded-full">
                            {logs.length} {logs.length === 1 ? "entry" : "entries"}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {logs.length > 0 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onClear?.();
                            }}
                            className="p-1 hover:bg-slate-600 rounded transition-colors"
                            title="Clear logs"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                </div>
            </div>

            {/* Logs Content */}
            {isExpanded && (
                <div className="h-[calc(100%-40px)] overflow-y-auto px-4 py-2 font-mono text-sm">
                    {logs.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-slate-500">
                            <p>No logs yet. Execute a workflow to see output here.</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {logs.map((log, index) => (
                                <div
                                    key={index}
                                    className={`flex items-start gap-2 py-1 ${getLogColor(log.type)}`}
                                >
                                    <span className="text-slate-500 text-xs min-w-[70px]">
                                        {log.timestamp}
                                    </span>
                                    <span className="flex-shrink-0">{getLogIcon(log.type)}</span>
                                    <span className="flex-1">{log.message}</span>
                                </div>
                            ))}
                            <div ref={logsEndRef} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Hook to manage execution logs
export function useExecutionLogs() {
    const [logs, setLogs] = useState([]);
    const [isExecuting, setIsExecuting] = useState(false);

    // Listen for workflow logs from backend
    useEffect(() => {
        const handleWorkflowLogs = (event) => {
            const { logs: backendLogs, isRunning, status } = event.detail;
            
            // Update execution status
            setIsExecuting(isRunning);
            
            // Transform backend logs to frontend format
            const formattedLogs = backendLogs.map(log => ({
                message: `[Node ${log.nodeId}] ${log.message}`,
                type: log.type,
                timestamp: new Date(log.timestamp).toLocaleTimeString("en-US", {
                    hour12: false,
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                })
            }));
            
            setLogs(formattedLogs);
        };

        window.addEventListener('workflowLogs', handleWorkflowLogs);
        return () => window.removeEventListener('workflowLogs', handleWorkflowLogs);
    }, []);

    const addLog = (message, type = "info") => {
        const timestamp = new Date().toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
        setLogs((prev) => [...prev, { message, type, timestamp }]);
    };

    const clearLogs = () => setLogs([]);

    const startExecution = (workflowName) => {
        setIsExecuting(true);
        addLog(`Starting workflow: ${workflowName}`, "info");
    };

    const endExecution = (success = true, message = "") => {
        setIsExecuting(false);
        if (success) {
            addLog(message || "Workflow completed successfully!", "success");
        } else {
            addLog(message || "Workflow failed", "error");
        }
    };

    const logNodeStart = (nodeLabel) => {
        addLog(`Executing node: ${nodeLabel}`, "executing");
    };

    const logNodeComplete = (nodeLabel) => {
        addLog(`Completed: ${nodeLabel}`, "success");
    };

    const logPayment = (amount, txHash) => {
        addLog(`Payment: ${amount} → ${txHash?.slice(0, 10)}...`, "payment");
    };

    return {
        logs,
        isExecuting,
        addLog,
        clearLogs,
        startExecution,
        endExecution,
        logNodeStart,
        logNodeComplete,
        logPayment,
    };
}
