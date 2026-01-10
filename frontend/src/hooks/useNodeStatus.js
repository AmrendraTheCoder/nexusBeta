import { useState, useEffect, useRef, useCallback } from "react";

export function useNodeStatus(walletAddress) {
  const [currentExecutingNode, setCurrentExecutingNode] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [workflowCompleted, setWorkflowCompleted] = useState(false);
  const intervalRef = useRef(null);
  const previousNodeRef = useRef(null);
  
  // Check if status polling is enabled via environment variable
  const isStatusPollingEnabled = import.meta.env.VITE_ENABLE_STATUS_POLLING === 'true';

  const fetchNodeStatus = useCallback(async () => {
    if (!walletAddress || !isStatusPollingEnabled) return;

    try {
      const engineUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
      const statusUrl = `${engineUrl}/status?wallet=${walletAddress}`;
      
      // Suppress 404 errors from appearing in console by using silent fetch
      const response = await fetch(statusUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }).catch(() => null); // Suppress network errors completely

      // If fetch failed completely (network error)
      if (!response) {
        setCurrentExecutingNode(null);
        return;
      }

      if (response.ok) {
        const data = await response.json();

        // The backend now returns { currentNode: "nodeId" } or { currentNode: null }
        const nodeId = data.currentNode;

        // Detect workflow completion: previous node was executing, now it's null
        if (previousNodeRef.current && !nodeId) {
          console.log(
            `[useNodeStatus] ✅ Workflow completed! Previous node: ${previousNodeRef.current}`
          );
          setWorkflowCompleted(true);
          // Reset the completed flag after a short delay
          setTimeout(() => setWorkflowCompleted(false), 100);
        }

        previousNodeRef.current = nodeId;
        setCurrentExecutingNode(nodeId);
      } else if (response.status === 404) {
        // 404 = No workflow exists yet (expected behavior)
        // Silently set current node to null
        setCurrentExecutingNode(null);
      } else {
        // Other errors (500, 403, etc.) should be logged
        console.warn(
          `[useNodeStatus] ⚠️ Unexpected status: ${response.status}`
        );
        setCurrentExecutingNode(null);
      }
    } catch (error) {
      // Any other errors - silently ignore
      setCurrentExecutingNode(null);
    }
  }, [walletAddress, isStatusPollingEnabled]);

  const startPolling = () => {
    if (intervalRef.current || !walletAddress || !isStatusPollingEnabled) return;

    setIsPolling(true);
    // Fetch immediately
    fetchNodeStatus();
    // Then poll every second
    intervalRef.current = setInterval(fetchNodeStatus, 1000);
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
    setCurrentExecutingNode(null);
  };

  useEffect(() => {
    if (!walletAddress || !isStatusPollingEnabled) {
      stopPolling();
      return;
    }

    // Start polling when wallet address is available
    if (intervalRef.current) return; // Already polling

    setIsPolling(true);
    // Fetch immediately
    fetchNodeStatus();
    // Then poll every second
    intervalRef.current = setInterval(fetchNodeStatus, 1000);

    // Cleanup on unmount or wallet address change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsPolling(false);
      setCurrentExecutingNode(null);
    };
  }, [walletAddress, fetchNodeStatus, isStatusPollingEnabled]);

  return {
    currentExecutingNode,
    workflowCompleted,
    isPolling,
    startPolling,
    stopPolling,
  };
}
