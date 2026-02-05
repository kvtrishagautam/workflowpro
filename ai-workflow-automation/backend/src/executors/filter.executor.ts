import { ExecutionContext, ExecutionResult } from '../types';
import { get } from 'lodash';

export class FilterExecutor {
    async execute(context: ExecutionContext): Promise<ExecutionResult> {
        try {
            const { data, previousNodeOutput } = context;
            const config = data.config;

            // Combine previous output with input data if needed, or mostly rely on previousNodeOutput
            // The frontend uses 'data.field' where 'data' usually refers to the workflow data context
            // In our simple execution engine, we'll traverse 'previousNodeOutput'

            const conditions = config.conditions || [];
            const combineConditions = config.combineConditions || 'AND';

            if (conditions.length === 0) {
                return { success: true, data: previousNodeOutput };
            }

            const results = conditions.map((condition: any) => {
                const fieldPath = condition.field.replace('data.', ''); // Strip 'data.' prefix if present
                const fieldValue = get(previousNodeOutput, fieldPath);
                const targetValue = condition.value;
                const operator = condition.operator;

                switch (operator) {
                    case 'equals':
                        return fieldValue == targetValue;
                    case 'notEquals':
                        return fieldValue != targetValue;
                    case 'contains':
                        return String(fieldValue).includes(targetValue);
                    case 'notContains':
                        return !String(fieldValue).includes(targetValue);
                    case 'startsWith':
                        return String(fieldValue).startsWith(targetValue);
                    case 'endsWith':
                        return String(fieldValue).endsWith(targetValue);
                    case 'greaterThan':
                        return Number(fieldValue) > Number(targetValue);
                    case 'lessThan':
                        return Number(fieldValue) < Number(targetValue);
                    case 'isEmpty':
                        return !fieldValue || fieldValue === '';
                    case 'isNotEmpty':
                        return !!fieldValue && fieldValue !== '';
                    default:
                        return false;
                }
            });

            let passed = false;
            if (combineConditions === 'AND') {
                passed = results.every((r: boolean) => r === true);
            } else {
                passed = results.some((r: boolean) => r === true);
            }

            if (!passed) {
                return {
                    success: false,
                    data: null,
                    error: 'Filtered out'
                };
            }

            return {
                success: true,
                data: previousNodeOutput
            };

        } catch (error: any) {
            return {
                success: false,
                data: null,
                error: error.message
            };
        }
    }
}

export const filterExecutor = new FilterExecutor();
