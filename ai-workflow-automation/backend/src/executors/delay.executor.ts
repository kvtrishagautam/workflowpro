import { ExecutionContext, ExecutionResult } from '../types';

/**
 * Delay Node Executor
 * Waits for a specified duration before continuing workflow execution
 */
export class DelayExecutor {
    /**
     * Execute delay
     * @param context - Execution context containing node configuration
     * @returns Execution result after delay
     */
    async execute(context: ExecutionContext): Promise<ExecutionResult> {
        try {
            const { amount, unit } = context.data.config;

            if (!amount || amount <= 0) {
                throw new Error('Delay amount must be greater than 0');
            }

            if (!unit) {
                throw new Error('Delay unit is required (seconds, minutes, hours, days)');
            }

            // Convert to milliseconds
            let delayMs = 0;
            switch (unit) {
                case 'seconds':
                    delayMs = amount * 1000;
                    break;
                case 'minutes':
                    delayMs = amount * 60 * 1000;
                    break;
                case 'hours':
                    delayMs = amount * 60 * 60 * 1000;
                    break;
                case 'days':
                    delayMs = amount * 24 * 60 * 60 * 1000;
                    break;
                default:
                    throw new Error(`Invalid delay unit: ${unit}`);
            }

            // Maximum delay: 24 hours (for synchronous execution)
            const maxDelay = 24 * 60 * 60 * 1000;
            if (delayMs > maxDelay) {
                throw new Error('Delay cannot exceed 24 hours in synchronous execution. Consider using scheduled workflows for longer delays.');
            }

            console.log(`⏳ Delaying for ${amount} ${unit} (${delayMs}ms)...`);

            // Wait for the specified duration
            await new Promise(resolve => setTimeout(resolve, delayMs));

            console.log(`✅ Delay completed`);

            return {
                success: true,
                data: {
                    ...context.previousNodeOutput,
                    delayResult: {
                        amount,
                        unit,
                        delayMs,
                        completedAt: new Date().toISOString()
                    }
                }
            };
        } catch (error: any) {
            return {
                success: false,
                error: `Delay error: ${error.message}`
            };
        }
    }
}

// Export singleton instance
export const delayExecutor = new DelayExecutor();
