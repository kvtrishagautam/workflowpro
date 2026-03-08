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
    maxExecutions?: number; // Maximum number of times to execute (for recurring jobs)
    executionCount: number; // Counter for number of times executed
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
        errorMessage: { type: String },
        maxExecutions: { type: Number }, // Maximum executions for recurring jobs
        executionCount: { type: Number, default: 0 } // Track number of executions
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
