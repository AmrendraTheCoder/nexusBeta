import type { Node } from '../interfaces/Node.js';

export class PrintNode implements Node {
    id: string;
    label: string;
    type = "print";
    inputs: Record<string, any> = {};
    outputs: Record<string, any> = {};
    walletConfig = undefined;
    message?: string;

    constructor(id: string, label: string, inputs: Record<string, any>, message?: string) {
        this.id = id;
        this.label = label;
        this.inputs = inputs;
        this.message = message || "";
    }

    execute() {
        // Print message if provided
        if (this.message) {
            console.log(`📝 [PrintNode ${this.id}] ${this.message}`);
            this.outputs.printOutput = this.message;
        }
        
        // Print all inputs
        for(const[input_name, input_value] of Object.entries(this.inputs)){
            console.log(`📝 [PrintNode ${this.id}] [${input_name}]: ${JSON.stringify(input_value)}`);
        }
    }
}
