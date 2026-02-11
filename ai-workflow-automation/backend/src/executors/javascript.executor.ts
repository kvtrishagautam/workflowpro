import { ExecutionContext, ExecutionResult } from '../types';

/**
 * JavaScript/Code Node Executor
 * Executes custom JavaScript code for data transformation and calculations
 */
export class JavaScriptExecutor {
    /**
     * Execute JavaScript code
     * @param context - Execution context containing node configuration and previous data
     * @returns Execution result with transformed data
     */
    async execute(context: ExecutionContext): Promise<ExecutionResult> {
        try {
            const { code } = context.data.config;

            if (!code) {
                throw new Error('No code provided');
            }

            // Get previous node output as the data context
            const data = context.previousNodeOutput || {};

            console.log('💻 Executing JavaScript code...');
            console.log('Input data:', JSON.stringify(data, null, 2));

            // Execute the code
            // WARNING: In production, use vm2 or isolated-vm for security
            // For this demo, we'll use a Function constructor
            try {
                // Create a function that has access to the data
                const executeCode = new Function('data', `
                    ${code}
                `);

                // Execute the code and get the result
                const result = executeCode(data);

                console.log('✅ JavaScript executed successfully');
                console.log('Output:', JSON.stringify(result, null, 2));

                // If the code returns a value, use it; otherwise, return the original data
                const outputData = result !== undefined ? result : data;

                return {
                    success: true,
                    data: outputData
                };
            } catch (codeError: any) {
                throw new Error(`Code execution error: ${codeError.message}`);
            }
        } catch (error: any) {
            console.error('❌ JavaScript execution failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Export singleton instance
export const javascriptExecutor = new JavaScriptExecutor();
