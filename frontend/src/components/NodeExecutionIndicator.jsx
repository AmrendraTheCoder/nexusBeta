import React, { useEffect, useState } from "react";

export default function NodeExecutionIndicator({ logs, nodes }) {
  const [executingNodes, setExecutingNodes] = useState(new Set());
  const [completedNodes, setCompletedNodes] = useState(new Set());

  useEffect(() => {
    if (!logs || logs.length === 0) return;

    const latest = logs[logs.length - 1];
    const msg = latest.message || latest.msg || String(latest);

    // Detect node execution patterns
    const executionMatch = msg.match(/Executing node: (\S+)|Running (\S+)|Node (\S+) executing/i);
    if (executionMatch) {
      const nodeId = executionMatch[1] || executionMatch[2] || executionMatch[3];
      setExecutingNodes(prev => new Set([...prev, nodeId]));
    }

    // Detect node completion
    const completionMatch = msg.match(/Completed node: (\S+)|Node (\S+) completed|✅.*(\S+)/i);
    if (completionMatch) {
      const nodeId = completionMatch[1] || completionMatch[2] || completionMatch[3];
      setExecutingNodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(nodeId);
        return newSet;
      });
      setCompletedNodes(prev => new Set([...prev, nodeId]));
    }
  }, [logs]);

  return (
    <>
      <style>
        {`
          @keyframes pulse-ring {
            0% {
              transform: scale(0.95);
              box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
            }
            70% {
              transform: scale(1);
              box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
            }
            100% {
              transform: scale(0.95);
              box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
            }
          }

          .node-executing {
            animation: pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
            border-color: #3b82f6 !important;
            border-width: 3px !important;
          }

          .node-completed {
            border-color: #10b981 !important;
            border-width: 2px !important;
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%);
          }
        `}
      </style>
      {nodes.map(node => {
        if (executingNodes.has(node.id)) {
          return (
            <div
              key={node.id}
              className="node-executing"
              style={{
                position: 'absolute',
                left: node.position.x,
                top: node.position.y,
                width: '250px',
                height: '100px',
                pointerEvents: 'none',
                zIndex: 1000
              }}
            />
          );
        }
        if (completedNodes.has(node.id)) {
          return (
            <div
              key={node.id}
              className="node-completed"
              style={{
                position: 'absolute',
                left: node.position.x,
                top: node.position.y,
                width: '250px',
                height: '100px',
                pointerEvents: 'none',
                zIndex: 999
              }}
            />
          );
        }
        return null;
      })}
    </>
  );
}
