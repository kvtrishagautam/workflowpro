import { WorkflowNode, NodeInput, NodeExecutionResult } from '../types/node';
import { jobScheduler } from '../services/jobScheduler.service';

export const scheduledEmailNode: WorkflowNode = {
    id: 'scheduledEmail',
    type: 'SCHEDULED_EMAIL',
    name: 'Scheduled Email',
    description: 'Schedule emails to be sent at a specific time or on a recurring basis',

    inputSchema: {
        subject: { type: 'string', required: true },
        body: { type: 'string', required: true },
        recipients: { type: 'array', required: false },
        recipientGroupId: { type: 'string', required: false },
        scheduledDateTime: { type: 'date', required: false },
        cronExpression: { type: 'string', required: false },
        scheduleType: { type: 'string', required: true, enum: ['one-time', 'recurring'] },
        personalizationCSV: { type: 'string', required: false },
        maxExecutions: { type: 'number', required: false } // Max times to execute for recurring
    },

    outputSchema: {
        jobId: { type: 'string' },
        status: { type: 'string' },
        scheduledFor: { type: 'string' }
    },

    execute: async (input: NodeInput): Promise<NodeExecutionResult> => {
        try {
            console.log('[ScheduledEmailNode] Scheduling email job...');

            // Validate input
            if (!input.subject || !input.body) {
                throw new Error('Subject and body are required');
            }

            if (!input.recipients && !input.recipientGroupId) {
                throw new Error('Either recipients or recipientGroupId must be provided');
            }

            if (input.scheduleType === 'one-time' && !input.scheduledDateTime) {
                throw new Error('scheduledDateTime is required for one-time jobs');
            }

            if (input.scheduleType === 'recurring' && !input.cronExpression) {
                throw new Error('cronExpression is required for recurring jobs');
            }

            // Normalize recipients: accept comma-separated string or array
            let recipientsList: string[] = [];
            if (input.recipients) {
                if (Array.isArray(input.recipients)) {
                    recipientsList = input.recipients.map((r: string) => r.trim()).filter(Boolean);
                } else if (typeof input.recipients === 'string') {
                    recipientsList = input.recipients.split(',').map((r: string) => r.trim()).filter(Boolean);
                }
            }

            console.log(`[ScheduledEmailNode] Recipients (${recipientsList.length}):`, recipientsList);

            // Schedule the job
            const job = await jobScheduler.scheduleJob({
                subject: input.subject,
                body: input.body,
                recipients: recipientsList,
                recipientGroupId: input.recipientGroupId,
                scheduledDateTime: input.scheduledDateTime ? new Date(input.scheduledDateTime) : undefined,
                cronExpression: input.cronExpression,
                scheduleType: input.scheduleType,
                personalizationCSV: input.personalizationCSV,
                maxExecutions: input.maxExecutions,
            });

            console.log(`[ScheduledEmailNode] Job scheduled successfully: ${job._id}`);

            return {
                status: 'success',
                data: {
                    jobId: job._id.toString(),
                    status: job.status,
                    scheduledFor: job.scheduledDateTime?.toISOString() || job.cronExpression
                }
            };
        } catch (error: any) {
            console.error('[ScheduledEmailNode] Error:', error);
            return {
                status: 'error',
                error: error.message || 'Failed to schedule email'
            };
        }
    }
};
