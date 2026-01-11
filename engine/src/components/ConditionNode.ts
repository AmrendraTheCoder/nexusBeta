import type { Node } from '../interfaces/Node.js';
import { Parser } from 'expr-eval';

export class ConditionNode implements Node {
    id: string;
    label: string;
    type = "condition";
    inputs: Record<string, any> = {};
    outputs: { path: string | null } = { path: null };
    walletConfig = undefined;
    condition: string | any;

    constructor(id: string, label: string, inputs: Record<string, any>, condition: string | any) {
        this.id = id;
        this.label = label;
        this.condition = condition;
        this.inputs = inputs;
    }

    /**
     * Get a value from inputs, supporting nested paths like "data.fearGreedIndex"
     */
    private getNestedValue(obj: any, path: string): any {
        const parts = path.split('.');
        let current = obj;
        
        for (const part of parts) {
            if (current === undefined || current === null) {
                return undefined;
            }
            current = current[part];
        }
        
        return current;
    }

    /**
     * Try to find a value in inputs by checking multiple possible locations
     */
    private findValue(varName: string): any {
        // Direct match
        if (this.inputs[varName] !== undefined) {
            return this.inputs[varName];
        }

        // Check nested in 'data' object (common for API responses)
        if (this.inputs.data && this.inputs.data[varName] !== undefined) {
            return this.inputs.data[varName];
        }

        // Check with dot notation path
        const nestedValue = this.getNestedValue(this.inputs, varName);
        if (nestedValue !== undefined) {
            return nestedValue;
        }

        // Check in data with dot notation
        if (this.inputs.data) {
            const dataNestedValue = this.getNestedValue(this.inputs.data, varName);
            if (dataNestedValue !== undefined) {
                return dataNestedValue;
            }
        }

        // Check common sentiment/trading fields
        const commonMappings: Record<string, string[]> = {
            'sentiment': ['data.classification', 'data.sentiment', 'classification', 'sentiment'],
            'bullish': ['data.classification', 'data.sentiment'],
            'fearGreedIndex': ['data.fearGreedIndex', 'fearGreedIndex'],
            'price': ['data.currentPrice', 'currentPrice', 'data.price', 'price'],
            'confidence': ['data.confidence', 'confidence', 'data.predictions.24h.confidence'],
        };

        if (commonMappings[varName]) {
            for (const path of commonMappings[varName]) {
                const value = this.getNestedValue(this.inputs, path);
                if (value !== undefined) {
                    console.log(`📊 [Condition] Found ${varName} at ${path}: ${value}`);
                    return value;
                }
            }
        }

        return undefined;
    }

    execute() {
        console.log(`\n🔍 [Condition] ${this.label} - Inputs received:`, JSON.stringify(this.inputs, null, 2));
        
        let expressionString: string;

        // Handle both string expressions and object-based conditions
        if (typeof this.condition === 'string') {
            expressionString = this.condition;
        } else if (typeof this.condition === 'object') {
            // Build expression from object: {leftVariable, operator, rightValue}
            let { leftVariable, operator, rightValue } = this.condition;
            
            // If leftVariable not specified, try common fields
            if (!leftVariable) {
                const commonFields = ['price', 'fearGreedIndex', 'sentiment', 'confidence'];
                for (const field of commonFields) {
                    const value = this.findValue(field);
                    if (value !== undefined) {
                        leftVariable = field;
                        console.log(`📊 [Condition] Auto-detected ${field}: ${value}`);
                        break;
                    }
                }
            }
            
            // If rightValue not specified, use a default comparison value
            if (rightValue === undefined) {
                rightValue = 3000;
                console.log(`⚠️ [Condition] Using default comparison value: ${rightValue}`);
            }
            
            // Map operator names to symbols
            const operatorMap: Record<string, string> = {
                'greaterThan': '>',
                'lessThan': '<',
                'equals': '==',
                'notEquals': '!=',
                'greaterThanOrEqual': '>=',
                'lessThanOrEqual': '<=',
                'contains': 'contains'
            };

            const opSymbol = operatorMap[operator] || operator;
            
            // Get left value from inputs (with nested path support)
            let leftValue = this.findValue(leftVariable);
            
            if (leftValue === undefined) {
                console.error(`❌ [Condition] Variable "${leftVariable}" not found in inputs`);
                console.log(`   Available inputs:`, Object.keys(this.inputs));
                if (this.inputs.data) {
                    console.log(`   Available in data:`, Object.keys(this.inputs.data));
                }
                this.outputs.path = "false-path";
                return;
            }

            // Handle string comparisons (e.g., sentiment === "bullish")
            if (typeof rightValue === 'string') {
                // Remove quotes if present
                rightValue = rightValue.replace(/^['"]|['"]$/g, '');
                
                // String equality check
                if (opSymbol === '==' || opSymbol === 'equals') {
                    const result = String(leftValue).toLowerCase() === String(rightValue).toLowerCase();
                    console.log(`🔍 [Condition] String compare: "${leftValue}" == "${rightValue}" → ${result}`);
                    this.outputs.path = result ? "true-path" : "false-path";
                    return;
                }
                
                // Contains check
                if (opSymbol === 'contains') {
                    const result = String(leftValue).toLowerCase().includes(String(rightValue).toLowerCase());
                    console.log(`🔍 [Condition] Contains: "${leftValue}" contains "${rightValue}" → ${result}`);
                    this.outputs.path = result ? "true-path" : "false-path";
                    return;
                }
            }
            
            // NEW: Use variable binding for safer evaluation
            // Instead of interpolating values directly (which breaks strings and security),
            // we bind the values to temporary variables in the evaluation context.
            const evalContext = { ...this.inputs, _leftVal: leftValue, _rightVal: rightValue };
            
            // Constructs: "_leftVal > _rightVal"
            expressionString = `_leftVal ${opSymbol} _rightVal`;
            console.log(`🔍 [Condition] Evaluating: ${expressionString} with values`, { _leftVal: leftValue, _rightVal: rightValue });
            
            try {
                const parser = new Parser();
                const expr = parser.parse(expressionString);
                const result = expr.evaluate(evalContext);
    
                this.outputs.path = result ? "true-path" : "false-path";
                console.log(`✅ [Condition] Result: ${result} → ${this.outputs.path}`);
            } catch (error) {
                console.error('❌ [Condition] Evaluation error:', error instanceof Error ? error.message : String(error));
                this.outputs.path = "false-path";
            }
            return; // Exit after object-based evaluation
        } else {
            console.error('❌ Invalid condition format:', this.condition);
            this.outputs.path = "false-path";
            return;
        }

        // String expression evaluation (fallthrough for string conditions)
        try {
            // Sanitize expression to support common operators that expr-eval might not like by default
            // convert & -> and, | -> or, but be careful about existing 'and'/'or'
            // parsing "shorthand" operators if they exist in the string
            const sanitizedExpression = expressionString
                .replace(/ && /g, ' and ')
                .replace(/ & /g, ' and ')
                .replace(/ \|\| /g, ' or ')
                .replace(/ \| /g, ' or ');

            if (sanitizedExpression !== expressionString) {
                console.log(`🔧 [Condition] Sanitized expression: "${expressionString}" -> "${sanitizedExpression}"`);
            }

            const parser = new Parser();
            const expr = parser.parse(sanitizedExpression);
            const result = expr.evaluate(this.inputs);

            this.outputs.path = result ? "true-path" : "false-path";
            console.log(`✅ [Condition] Result: ${result} → ${this.outputs.path}`);
        } catch (error) {
            console.error('❌ [Condition] Evaluation error:', error instanceof Error ? error.message : String(error));
            console.error('   Expression was:', expressionString);
            this.outputs.path = "false-path";
        }
    }
}
