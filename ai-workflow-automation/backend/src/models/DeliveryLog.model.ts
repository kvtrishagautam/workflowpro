import { Schema, model, Document } from 'mongoose';

export interface IDeliveryLog extends Document {
    jobId: string;
    recipient: string;
    status: 'sent' | 'failed';
    messageId?: string;
    error?: string;
    timestamp: Date;
}

const deliveryLogSchema = new Schema<IDeliveryLog>(
    {
        jobId: {
            type: String,
            required: true,
            index: true
        },
        recipient: {
            type: String,
            required: true
        },
        status: {
            type: String,
            required: true,
            enum: ['sent', 'failed']
        },
        messageId: { type: String },
        error: { type: String },
        timestamp: {
            type: Date,
            default: Date.now,
            index: true
        }
    }
);

// Index for efficient log retrieval
deliveryLogSchema.index({ timestamp: -1 });

export const DeliveryLog = model<IDeliveryLog>('DeliveryLog', deliveryLogSchema);
