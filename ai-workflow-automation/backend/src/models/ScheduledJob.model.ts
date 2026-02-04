import { Schema, model, Document } from 'mongoose';

export interface IScheduledJob extends Document {
    subject: string;
    body: string;
    recipients: string[];
    recipientGroupId?: string;
    scheduledDateTime?: Date;
    cronExpression?: string;
    scheduleType: 'one-time' | 'recurring';
    status: 'scheduled' | 'sent' | 'failed' | 'cancelled';
    personalizationCSV?: string;
    executedAt?: Date;
    errorMessage?: string;
    createdAt: Date;
    updatedAt: Date;
}

const scheduledJobSchema = new Schema<IScheduledJob>(
    {
        subject: { type: String, required: true },
        body: { type: String, required: true },
        recipients: { type: [String], required: true },
        recipientGroupId: { type: String },
        scheduledDateTime: { type: Date },
        cronExpression: { type: String },
        scheduleType: {
            type: String,
            required: true,
            enum: ['one-time', 'recurring']
        },
        status: {
            type: String,
            required: true,
            enum: ['scheduled', 'sent', 'failed', 'cancelled'],
            default: 'scheduled'
        },
        personalizationCSV: { type: String },
        executedAt: { type: Date },
        errorMessage: { type: String }
    },
    {
        timestamps: true
    }
);

// Indexes for efficient querying
scheduledJobSchema.index({ status: 1 });
scheduledJobSchema.index({ scheduleType: 1 });
scheduledJobSchema.index({ scheduledDateTime: 1 });

export const ScheduledJob = model<IScheduledJob>('ScheduledJob', scheduledJobSchema);
