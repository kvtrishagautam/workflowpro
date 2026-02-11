import { ExecutionContext, ExecutionResult } from '../types';
import { get } from 'lodash';

/**
 * Database Node Executor
 * Executes database queries (currently supports MongoDB via existing connection)
 */
export class DatabaseExecutor {
    /**
     * Execute database operation
     * @param context - Execution context containing node configuration
     * @returns Execution result with query results
     */
    async execute(context: ExecutionContext): Promise<ExecutionResult> {
        try {
            const {
                operation,
                collection,
                query,
                data: updateData,
                projection
            } = context.data.config;

            if (!operation) {
                throw new Error('Database operation is required');
            }

            if (!collection) {
                throw new Error('Collection/table name is required');
            }

            // Variable replacement helper
            const processTemplate = (template: any): any => {
                if (typeof template === 'string') {
                    return template.replace(/\${([^}]+)}/g, (_, path) => {
                        const cleanPath = path.replace('data.', '');
                        const value = get(context.previousNodeOutput, cleanPath);
                        return value !== undefined ? value : '';
                    });
                } else if (typeof template === 'object' && template !== null) {
                    const processed: any = Array.isArray(template) ? [] : {};
                    for (const [key, value] of Object.entries(template)) {
                        processed[key] = processTemplate(value);
                    }
                    return processed;
                }
                return template;
            };

            // Process query and data with variables
            const processedQuery = query ? processTemplate(query) : {};
            const processedData = updateData ? processTemplate(updateData) : {};

            // For now, we'll use MongoDB (since it's already connected)
            // In a production system, you'd support multiple database types
            const mongoose = require('mongoose');
            const db = mongoose.connection.db;

            if (!db) {
                throw new Error('Database connection not available');
            }

            const coll = db.collection(collection);
            let result: any;

            switch (operation) {
                case 'find':
                    result = await coll.find(processedQuery, { projection }).toArray();
                    break;

                case 'findOne':
                    result = await coll.findOne(processedQuery, { projection });
                    break;

                case 'insert':
                    result = await coll.insertOne(processedData);
                    break;

                case 'insertMany':
                    result = await coll.insertMany(Array.isArray(processedData) ? processedData : [processedData]);
                    break;

                case 'update':
                    result = await coll.updateOne(processedQuery, { $set: processedData });
                    break;

                case 'updateMany':
                    result = await coll.updateMany(processedQuery, { $set: processedData });
                    break;

                case 'delete':
                    result = await coll.deleteOne(processedQuery);
                    break;

                case 'deleteMany':
                    result = await coll.deleteMany(processedQuery);
                    break;

                case 'count':
                    result = await coll.countDocuments(processedQuery);
                    break;

                default:
                    throw new Error(`Unsupported operation: ${operation}`);
            }

            return {
                success: true,
                data: {
                    ...context.previousNodeOutput,
                    databaseResult: {
                        operation,
                        collection,
                        result
                    }
                }
            };
        } catch (error: any) {
            return {
                success: false,
                error: `Database error: ${error.message}`
            };
        }
    }
}

// Export singleton instance
export const databaseExecutor = new DatabaseExecutor();
