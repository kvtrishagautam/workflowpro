import { WorkflowNode, NodeInput, NodeExecutionResult } from '../types/node';
import * as csvParser from 'csv-parse/sync';

interface CsvReadConfig {
    csvData: string;
    delimiter?: string;
}

export const csvReadNode: WorkflowNode = {
    id: 'csvRead',
    type: 'csvRead',
    name: 'CSV Parser',
    description: 'Parses raw CSV string into an array of objects',
    inputSchema: {
        type: 'object',
        properties: {
            csvData: { type: 'string', description: 'Raw CSV text content' },
            delimiter: { type: 'string', description: 'Delimiter (default: ,)' }
        },
        required: ['csvData']
    },
    outputSchema: {
        type: 'object',
        properties: {
            rows: { type: 'array' }
        }
    },
    execute: async (input: NodeInput): Promise<NodeExecutionResult> => {
        try {
            const config = input as CsvReadConfig;

            if (!config.csvData) {
                return { status: 'error', error: 'CSV Data is required' };
            }

            const records = csvParser.parse(config.csvData, {
                columns: true,
                skip_empty_lines: true,
                delimiter: config.delimiter || ',',
                trim: true
            });

            return {
                status: 'success',
                data: {
                    rows: records,
                    totalRows: records.length
                }
            };
        } catch (error: any) {
            console.error('[CSVReadNode] Error:', error);
            return {
                status: 'error',
                error: error.message || 'Failed to parse CSV'
            };
        }
    }
};

export default csvReadNode;
