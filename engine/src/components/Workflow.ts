import type { Node } from "../interfaces/Node.js";
import type { Edges } from "../interfaces/Edges.js";

export class Workflow {
  type: string = "";
  name: string = "";
  nodes: Record<string, Node> = {};
  edges: Edges;
  status: string = "";
  logs: Array<{timestamp: string, type: string, nodeId: string, message: string}> = [];
  shouldStop: boolean = false;
  startTime: string = new Date().toISOString();
  cycleCount: number = 0;

  constructor(type: string, nodes: Record<string, Node>, edges: Edges, name?: string) {
    if (type === "once" || type === "repeat") this.type = type;
    else {
      console.log("Type not specified");
    }
    this.edges = edges;
    this.nodes = nodes;
    this.name = name || "Unnamed Workflow";
  }

  stop() {
    this.shouldStop = true;
    this.type = "once"; // Convert to once to stop after current execution
    this.addLog('info', 'workflow', '🛑 Stop signal received - workflow will terminate');
  }

  addLog(type: string, nodeId: string, message: string) {
    const log = {
      timestamp: new Date().toISOString(),
      type,
      nodeId,
      message
    };
    this.logs.push(log);
    console.log(`[${type.toUpperCase()}] [Node ${nodeId}] ${message}`);
  }

  async run() {
    // Step 1: Build in-degree map for all nodes
    const inDegree: Record<string, number> = {};
    for (const id of Object.keys(this.nodes)) {
      inDegree[id] = 0;
    }

    for (const from in this.edges) {
      for (const to in this.edges[from]) {
        if (inDegree[to] === undefined) {
          inDegree[to] = 0;
        }
        inDegree[to] += 1;
      }
    }

    // Step 2: Initialize queue with nodes having in-degree 0
    const queue: string[] = Object.keys(inDegree).filter(
      (id) => inDegree[id] === 0
    );

    // Step 3: Process queue
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const currentNode = this.nodes[currentId];

      if (!currentNode) continue;

      // Execute the node
      this.status = currentNode.id;
      this.addLog('info', currentNode.id, `Executing node type: ${currentNode.type}`);
      
      // Capture console.log during execution
      const originalLog = console.log;
      const capturedLogs: string[] = [];
      
      console.log = (...args: any[]) => {
        // Call original to maintain console output
        originalLog(...args);
        
        // Capture the message
        const message = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ');
        
        capturedLogs.push(message);
      };
      
      try {
        const result = await currentNode.execute();
        
        // Restore console.log
        console.log = originalLog;
        
        // Add all captured console logs to workflow logs
        for (const msg of capturedLogs) {
          this.addLog('console', currentNode.id, msg);
        }
        
        // Detailed logging for specific node types
        if (currentNode.type === 'sendToken' && result) {
          const { amount, token, destination, txHash } = result;
          this.addLog('payment', currentNode.id, `Sent ${amount} ${token} to ${destination}`);
          this.addLog('info', currentNode.id, `Tx Hash: ${txHash}`);
        } else if (result) {
          // Generic logging for other nodes returning data
          this.addLog('success', currentNode.id, `Execution result: ${JSON.stringify(result)}`);
        } else {
          this.addLog('success', currentNode.id, `Node execution completed`);
        }
        
        originalLog(`[WORKFLOW] Completed executing node: ${currentNode.id}`);
      } catch (error) {
        // Restore console.log
        console.log = originalLog;
        
        // Add any captured logs before error
        for (const msg of capturedLogs) {
          this.addLog('console', currentNode.id, msg);
        }
        
        const errorMsg = error instanceof Error ? error.message : String(error);
        this.addLog('error', currentNode.id, `Execution failed: ${errorMsg}`);
        throw error;
      }

      // Step 4: Wire outputs to downstream nodes
      if (this.edges[currentId]) {
        for (const [toNodeId, mapping] of Object.entries(
          this.edges[currentId]
        )) {
          let shouldActivate = true;

          // Handle condition nodes: only continue along the chosen path
          if (currentNode.type === "condition") {
            const chosenPath = currentNode.outputs.path;
            // mapping has keys like { "true-path": "activate" }
            const mappingKeys = Object.keys(mapping);
            if (!mappingKeys.includes(chosenPath!)) {
              shouldActivate = false;
            }
          }

          if (shouldActivate) {
            const targetNode = this.nodes[toNodeId];
            if (targetNode) {
              // If mapping is empty, try to auto-wire common outputs
              if (Object.keys(mapping).length === 0) {
                // Auto-wire: Pyth price -> Condition price input
                if (currentNode.type === "pyth-network" && targetNode.type === "condition") {
                  if (currentNode.outputs.price !== undefined) {
                    targetNode.inputs.price = currentNode.outputs.price;
                    console.log(`🔗 [Auto-wire] Pyth price (${currentNode.outputs.price}) → Condition`);
                  }
                }
                // Auto-wire: QueryBalance -> other nodes
                else if (currentNode.type === "queryBalance") {
                  if (currentNode.outputs.balance !== undefined) {
                    targetNode.inputs.balance = currentNode.outputs.balance;
                    console.log(`🔗 [Auto-wire] Balance (${currentNode.outputs.balance}) → Node ${toNodeId}`);
                  }
                }
                // Generic auto-wire: copy all outputs to inputs
                else {
                  for (const [key, value] of Object.entries(currentNode.outputs)) {
                    if (value !== undefined && value !== null) {
                      targetNode.inputs[key] = value;
                      console.log(`🔗 [Auto-wire] ${key} (${value}) → Node ${toNodeId}`);
                    }
                  }
                }
              } else {
                // Use explicit mapping
                for (const [fromOutput, toInput] of Object.entries(mapping)) {
                  if (currentNode.outputs[fromOutput] !== undefined) {
                    targetNode.inputs[toInput] = currentNode.outputs[fromOutput];
                  }
                }
              }
            }

            // Step 5: Reduce in-degree and enqueue if ready (only for active paths)
            inDegree[toNodeId] = (inDegree[toNodeId] ?? 0) - 1;
            if (inDegree[toNodeId] === 0) {
              queue.push(toNodeId);
            }
          }
        }
      }
    }
    this.status = "";
    console.log(`[WORKFLOW] Workflow execution completed, status cleared`);
  }

  async start(repeatIntervalMs: number = 60000) {
    console.log(`[WORKFLOW] Starting workflow execution (type: ${this.type})`);
    this.startTime = new Date().toISOString();
    this.cycleCount = 0;
    
    await this.run();
    this.cycleCount++;
    
    while (this.type === "repeat" && !this.shouldStop) {
      console.log(`[WORKFLOW] Waiting ${repeatIntervalMs / 1000}s before next execution...`);
      await new Promise(resolve => setTimeout(resolve, repeatIntervalMs));
      
      if (this.shouldStop) {
        console.log(`[WORKFLOW] Stop signal detected, terminating repeat loop`);
        break;
      }
      
      console.log(`[WORKFLOW] Repeating workflow execution (Cycle #${this.cycleCount + 1})`);
      this.cycleCount++;
      
      // Reset node inputs for fresh execution
      for (const node of Object.values(this.nodes)) {
        if (node.type !== "condition") {
          node.inputs = { activate: true };
        }
      }
      
      // Keep reasonable log history (last 500 entries)
      if (this.logs.length > 500) {
        this.logs = this.logs.slice(-500);
      }
      
      await this.run();
    }
    console.log(`[WORKFLOW] Workflow execution finished`);
  }
}
