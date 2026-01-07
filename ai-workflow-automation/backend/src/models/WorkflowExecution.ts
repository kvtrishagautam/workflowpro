import mongoose, { Schema, Document } from 'mongoose';
import { LogEntry } from '../types';

export interface IWorkflowExecution extends Document {
    workflowId: mongoose.Types.ObjectId;
    status: 'running' | 'completed' | 'failed';
    startedAt: Date;
    completedAt?: Date;
    error?: string;
    logs: LogEntry[];
    inputData?: any;
    outputData?: any;
    result?: any;
}

const WorkflowExecutionSchema = new Schema<IWorkflowExecution>(
    {
        workflowId: {
            type: Schema.Types.ObjectId,
            ref: 'Workflow',
            required: true,
        },
        status: {
            type: String,
            enum: ['running', 'completed', 'failed'],
            default: 'running',
        },
        startedAt: {
            type: Date,
            default: Date.now,
        },
        completedAt: {
            type: Date,
        },
        error: {
            type: String,
        },
        logs: {
            type: [
                {
                    nodeId: { type: String, required: true },
                    timestamp: { type: Date, default: Date.now },
                    message: { type: String, required: true },
                    data: { type: Schema.Types.Mixed },
                    level: {
                        type: String,
                        enum: ['info', 'warn', 'error'],
                        default: 'info',
                    },
                },
            ],
            default: [],
        },
        inputData: {
            type: Schema.Types.Mixed,
        },
        outputData: {
            type: Schema.Types.Mixed,
        },
        result: {
            type: Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
WorkflowExecutionSchema.index({ workflowId: 1, startedAt: -1 });

export const WorkflowExecution = mongoose.model<IWorkflowExecution>(
    'WorkflowExecution',
    WorkflowExecutionSchema
);
