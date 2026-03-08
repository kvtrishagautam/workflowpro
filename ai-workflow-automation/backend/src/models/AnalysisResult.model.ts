import { Schema, model, Document } from 'mongoose';

export interface IAnalysisResult extends Document {
    datasetId: string;
    category: 'Sales' | 'Tasks' | 'Attendance' | 'Expenses' | 'Generic';
    workflowId?: string;
    summaryStats: any;
    chartData: any;
    rawRows?: any[];
    createdAt: Date;
    updatedAt: Date;
}

const analysisResultSchema = new Schema<IAnalysisResult>(
    {
        datasetId: { type: String, required: true },
        category: {
            type: String,
            required: true,
            enum: ['Sales', 'Tasks', 'Attendance', 'Expenses', 'Generic'],
            default: 'Generic'
        },
        workflowId: { type: String },
        summaryStats: { type: Schema.Types.Mixed, required: true },
        chartData: { type: Schema.Types.Mixed, required: true },
        rawRows: { type: Schema.Types.Mixed, default: [] }
    },
    {
        timestamps: true
    }
);

// Indexes for fast retrieval by the dashboard
analysisResultSchema.index({ datasetId: 1 });
analysisResultSchema.index({ category: 1 });
analysisResultSchema.index({ createdAt: -1 });

export const AnalysisResult = model<IAnalysisResult>('AnalysisResult', analysisResultSchema);
