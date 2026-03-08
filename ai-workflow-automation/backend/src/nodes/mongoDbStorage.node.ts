import { WorkflowNode, NodeInput, NodeExecutionResult } from '../types/node';
import { AnalysisResult } from '../models/AnalysisResult.model';

interface MongoStorageConfig {
    datasetId?: string;
    category?: string;
    summaryStats?: any;
    chartData?: any;
    rawRows?: any[];
    // If saving raw rows instead of analysis results:
    rows?: any[];
    collectionName?: string;
}

export const mongoDbStorageNode: WorkflowNode = {
    id: 'mongoDbStorage',
    type: 'mongoDbStorage',
    name: 'MongoDB Storage',
    description: 'Saves analysis results or raw data to MongoDB',
    inputSchema: {
        type: 'object',
        properties: {
            datasetId: { type: 'string' },
            category: { type: 'string' },
            summaryStats: { type: 'object' },
            chartData: { type: 'array' },
            rows: { type: 'array', description: 'Raw rows to save (optional)' },
            collectionName: { type: 'string', description: 'Collection to save to (defaults to AnalysisResult)' }
        }
    },
    outputSchema: {
        type: 'object',
        properties: {
            success: { type: 'boolean' },
            documentId: { type: 'string' }
        }
    },
    execute: async (input: NodeInput): Promise<NodeExecutionResult> => {
        try {
            const config = input as MongoStorageConfig;
            let documentId = '';

            // Multi-category: save one document per category
            if (Array.isArray((config as any).allResults) && (config as any).allResults.length > 0) {
                const allResults: any[] = (config as any).allResults;
                const saved = await Promise.all(
                    allResults.map((r: any) =>
                        AnalysisResult.create({
                            datasetId: r.datasetId || `dataset_${Date.now()}`,
                            category: r.category || 'Generic',
                            summaryStats: r.summaryStats,
                            chartData: r.chartData,
                            rawRows: r.rawRows || []
                        })
                    )
                );
                return {
                    status: 'success',
                    data: {
                        success: true,
                        documentIds: saved.map((r: any) => r._id.toString()),
                        categories: allResults.map((r: any) => r.category),
                        message: `Saved ${saved.length} analysis result(s) to MongoDB`
                    }
                };
            }

            // Single-category (backward compat)
            if (config.summaryStats && config.chartData) {
                const result = await AnalysisResult.create({
                    datasetId: config.datasetId || `dataset_${Date.now()}`,
                    category: config.category || 'Generic',
                    summaryStats: config.summaryStats,
                    chartData: config.chartData,
                    rawRows: config.rawRows || []
                });
                documentId = result._id.toString();
            } else {
                return { status: 'error', error: 'Input must contain summaryStats and chartData to save an AnalysisResult.' };
            }

            return {
                status: 'success',
                data: {
                    success: true,
                    documentId,
                    message: `Successfully saved to MongoDB (${documentId})`
                }
            };
        } catch (error: any) {
            console.error('[MongoDBStorageNode] Error:', error);
            return {
                status: 'error',
                error: error.message || 'Failed to save to MongoDB'
            };
        }
    }
};

export default mongoDbStorageNode;
