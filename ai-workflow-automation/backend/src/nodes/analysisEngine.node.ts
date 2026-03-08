import { WorkflowNode, NodeInput, NodeExecutionResult } from '../types/node';
import { runSalesAnalysis } from '../services/analyzers/sales';
import { runTasksAnalysis } from '../services/analyzers/tasks';
import { runAttendanceAnalysis } from '../services/analyzers/attendance';
import { runExpensesAnalysis } from '../services/analyzers/expenses';

interface AnalysisEngineConfig {
    rows: any[];
    category?: string;       // Legacy single-category support
    categories?: string[];   // New multi-select support
    datasetId?: string;
}

async function runCategory(category: string, rows: any[]): Promise<{ summaryStats: any; chartData: any }> {
    switch (category) {
        case 'Sales': return runSalesAnalysis(rows);
        case 'Tasks': return runTasksAnalysis(rows);
        case 'Attendance': return runAttendanceAnalysis(rows);
        case 'Expenses': return runExpensesAnalysis(rows);
        default:
            return {
                summaryStats: { TotalRecords: rows.length },
                chartData: { generic: rows.slice(0, 100).map((_, i) => ({ name: `Row ${i + 1}`, value: 1 })) }
            };
    }
}

export const analysisEngineNode: WorkflowNode = {
    id: 'analysisEngine',
    type: 'analysisEngine',
    name: 'Analysis Engine',
    description: 'Analyzes tabular data for one or more categories (Sales, Tasks, etc.)',
    inputSchema: {
        type: 'object',
        properties: {
            rows: { type: 'array', description: 'Cleaned data array' },
            categories: { type: 'array', description: 'List of analysis categories to run' },
            category: { type: 'string', description: 'Single category (legacy)' },
            datasetId: { type: 'string', description: 'Unique ID for this dataset' }
        },
        required: ['rows']
    },
    outputSchema: {
        type: 'object',
        properties: {
            results: { type: 'array', description: 'One result object per category' }
        }
    },
    execute: async (input: NodeInput): Promise<NodeExecutionResult> => {
        try {
            const config = input as AnalysisEngineConfig;

            if (!config.rows || !Array.isArray(config.rows)) {
                return { status: 'error', error: 'Input must contain a "rows" array.' };
            }

            // Resolve which categories to run
            const categoriesToRun: string[] = Array.isArray(config.categories) && config.categories.length
                ? config.categories
                : config.category
                    ? [config.category]
                    : ['Generic'];

            const baseDatasetId = config.datasetId || `dataset_${Date.now()}`;

            // Run each selected category and collect results
            const allResults = await Promise.all(
                categoriesToRun.map(async (cat) => {
                    const result = await runCategory(cat, config.rows);
                    return {
                        datasetId: `${baseDatasetId}_${cat}`,
                        category: cat,
                        summaryStats: result.summaryStats,
                        chartData: result.chartData,
                        rawRows: config.rows
                    };
                })
            );

            // Primary result (first category) — for backward-compat with MongoStorage node
            const primary = allResults[0];

            return {
                status: 'success',
                data: {
                    // Flat fields for backward compatibility
                    datasetId: primary.datasetId,
                    category: primary.category,
                    summaryStats: primary.summaryStats,
                    chartData: primary.chartData,
                    rawRows: config.rows,
                    // Full multi-category results (MongoStorage will iterate these)
                    allResults,
                    categories: categoriesToRun
                }
            };
        } catch (error: any) {
            console.error('[AnalysisEngineNode] Error:', error);
            return { status: 'error', error: error.message || 'Failed to execute analysis' };
        }
    }
};

export default analysisEngineNode;
