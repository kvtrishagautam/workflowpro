import mongoose, { Schema, Document } from 'mongoose';
import { WorkflowNode, WorkflowEdge } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface IWorkflow extends Document {
    userId: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    isActive: boolean;
    webhookUrl: string;
    createdAt: Date;
    updatedAt: Date;
}

const WorkflowSchema = new Schema<IWorkflow>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        id: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        description: {
            type: String,
            trim: true,
        },
        nodes: {
            type: [
                {
                    id: { type: String, required: true },
                    type: {
                        type: String,
                        enum: [
                            'webhook', 'javascript', 'slack', 'http', 'conditional', 'delay',
                            'schedule', 'set', 'filter', 'merge', 'splitBatches',
                            'email', 'whatsapp', 'telegram', 'discord',
                            'googleSheets', 'airtable', 'notion', 'mysql', 'postgres', 'openai'
                        ],
                        required: true,
                    },
                    data: {
                        label: { type: String, required: true },
                        config: { type: Schema.Types.Mixed, default: {} },
                    },
                    position: {
                        x: { type: Number, required: true },
                        y: { type: Number, required: true },
                    },
                },
            ],
            default: [],
        },
        edges: {
            type: [
                {
                    id: { type: String, required: true },
                    source: { type: String, required: true },
                    target: { type: String, required: true },
                },
            ],
            default: [],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        webhookUrl: {
            type: String,
            required: true,
            unique: true,
            default: () => uuidv4(),
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
WorkflowSchema.index({ userId: 1, createdAt: -1 });
WorkflowSchema.index({ webhookUrl: 1 });

export const Workflow = mongoose.model<IWorkflow>('Workflow', WorkflowSchema);
