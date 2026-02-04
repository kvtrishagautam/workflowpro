import { ExecutionContext, ExecutionResult } from '../types';

export class ConditionExecutor {
    async execute(context: ExecutionContext): Promise<ExecutionResult> {
        try {
            const { data, previousNodeOutput } = context;
            const config = data.config || {};

            // Resolve input data (use previous output if available)
            const inputData = previousNodeOutput || {};

            let isConditionMet = false;

            if (config.conditionType === 'expression') {
                // Advanced mode: JavaScript Expression
                // WARNING: In a production environment, use vm2 or isolated-vm for security
                // For this demo, we'll use a simple Function constructor
                try {
                    const checkCondition = new Function('data', `return ${config.expression}`);
                    isConditionMet = Boolean(checkCondition(inputData));
                } catch (err: any) {
                    return {
                        success: false,
                        error: `Expression error: ${err.message}`
                    };
                }
            } else {
                // Simple mode: field operator value
                const fieldPath = config.field || '';
                const operator = config.operator || 'equals';
                const targetValue = config.value;

                // Helper to get nested value
                const getNestedValue = (obj: any, path: string) => {
                    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
                };

                const actualValue = fieldPath ? getNestedValue(inputData, fieldPath) : inputData;

                switch (operator) {
                    case 'equals':
                        isConditionMet = actualValue == targetValue;
                        break;
                    case 'notEquals':
                        isConditionMet = actualValue != targetValue;
                        break;
                    case 'contains':
                        isConditionMet = String(actualValue).includes(String(targetValue));
                        break;
                    case 'greaterThan':
                        isConditionMet = Number(actualValue) > Number(targetValue);
                        break;
                    case 'lessThan':
                        isConditionMet = Number(actualValue) < Number(targetValue);
                        break;
                    case 'isEmpty':
                        isConditionMet = !actualValue || actualValue === '' || (Array.isArray(actualValue) && actualValue.length === 0);
                        break;
                    case 'isNotEmpty':
                        isConditionMet = !!actualValue && actualValue !== '' && (!Array.isArray(actualValue) || actualValue.length > 0);
                        break;
                    case 'isTrue':
                        isConditionMet = actualValue === true || actualValue === 'true';
                        break;
                    case 'isFalse':
                        isConditionMet = actualValue === false || actualValue === 'false';
                        break;
                    default:
                        isConditionMet = false;
                }
            }

            console.log(`🔀 Condition evaluated: ${isConditionMet}`);

            // Return result indicating which handle to follow
            // Standardizing output: output to 'true' handle if met, 'false' if not
            return {
                success: true,
                data: inputData,
                outputHandle: isConditionMet ? 'true' : 'false'
            };

        } catch (error: any) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

export const conditionExecutor = new ConditionExecutor();
