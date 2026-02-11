import { ExecutionContext, ExecutionResult } from '../types';
import { get } from 'lodash';

/**
 * Set/Edit Fields Executor
 * Selects, transforms, and sets specific fields in the data
 */
export class SetExecutor {
    /**
     * Execute field selection and transformation
     * @param context - Execution context containing field configurations
     * @returns Execution result with only selected/transformed fields
     */
    async execute(context: ExecutionContext): Promise<ExecutionResult> {
        try {
            const { fields, includeOtherFields } = context.data.config;
            const previousOutput = context.previousNodeOutput || {};

            if (!fields || !Array.isArray(fields) || fields.length === 0) {
                throw new Error('No fields configuration provided');
            }

            console.log('✏️ Set node: Processing fields...');

            // Helper to process variable substitution
            const processValue = (value: string) => {
                if (typeof value !== 'string') return value;

                // Replace ${data.field} or {{data.field}} syntax
                return value.replace(/\${([^}]+)}|\{\{([^}]+)\}\}/g, (_, path1, path2) => {
                    const path = path1 || path2;
                    const cleanPath = path.replace('data.', '');
                    const fieldValue = get(previousOutput, cleanPath);
                    return fieldValue !== undefined ? fieldValue : '';
                });
            };

            // Build output object with selected/transformed fields
            const outputData: any = {};

            for (const field of fields) {
                const { name, value } = field;

                if (!name) continue;

                // Process the value (supports variable substitution)
                const processedValue = processValue(value);

                // Set the field in output
                outputData[name] = processedValue;
            }

            // Optionally include other fields from previous output
            if (includeOtherFields) {
                // Merge with previous output, but prioritize new fields
                Object.assign(outputData, previousOutput, outputData);
            }

            console.log('✅ Set node: Fields processed');
            console.log('Output fields:', Object.keys(outputData));

            return {
                success: true,
                data: outputData
            };
        } catch (error: any) {
            console.error('❌ Set node failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Export singleton instance
export const setExecutor = new SetExecutor();
