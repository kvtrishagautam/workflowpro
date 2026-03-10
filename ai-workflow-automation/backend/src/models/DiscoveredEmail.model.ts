import mongoose, { Schema, Document } from 'mongoose';

export interface IDiscoveredEmail extends Document {
    email: string;
    source_url: string;
    matched_keyword?: string;
    industry?: string;
    confidence_score: number;
    discoveredAt: Date;
    workflowRunId?: string;
    status: 'pending' | 'sent' | 'failed' | 'skipped';
    sentAt?: Date;
    errorMessage?: string;
}

const DiscoveredEmailSchema: Schema = new Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true
    },
    source_url: {
        type: String,
        required: true
    },
    matched_keyword: {
        type: String,
        default: null
    },
    industry: {
        type: String,
        default: null
    },
    confidence_score: {
        type: Number,
        required: true,
        min: 0,
        max: 1,
        default: 0.5
    },
    discoveredAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    workflowRunId: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['pending', 'sent', 'failed', 'skipped'],
        default: 'pending',
        index: true
    },
    sentAt: {
        type: Date,
        default: null
    },
    errorMessage: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Index for efficient querying
DiscoveredEmailSchema.index({ email: 1, discoveredAt: -1 });
DiscoveredEmailSchema.index({ status: 1, discoveredAt: -1 });

export const DiscoveredEmail = mongoose.model<IDiscoveredEmail>('DiscoveredEmail', DiscoveredEmailSchema);
