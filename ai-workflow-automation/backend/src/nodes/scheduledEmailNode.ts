import { WorkflowNode, NodeInput, NodeExecutionResult } from '../types/node';
import { jobScheduler } from '../services/jobScheduler';
import { recipientGroupService } from '../services/recipientGroupService';
import { ScheduledEmailJobData } from '../types/scheduledJobTypes';

export const scheduledEmailNode: WorkflowNode = {
    id: 'scheduled-email',
    type: 'SCHEDULED_EMAIL',
    name: 'Scheduled Email Node',
    description: 'Schedule emails to be sent at a specific time or on a recurring basis',
    inputSchema: {
        type: 'object',
        properties: {
            subject: { type: 'string' },
            body: { type: 'string' },
            recipients: { type: 'string' }, // Comma-separated emails
            recipientGroupId: { type: 'string' },
            scheduledDateTime: { type: 'string' }, // ISO 8601 format
            cronExpression: { type: 'string' },
            scheduleType: { type: 'string', enum: ['one-time', 'recurring'] },
            personalizationCSV: { type: 'string' }, // File path
        },
        required: ['subject', 'body', 'scheduleType'],
    },
    outputSchema: {
        type: 'object',
        properties: {
            jobId: { type: 'string' },
            status: { type: 'string' },
            scheduledFor: { type: 'string' },
            cronExpression: { type: 'string' },
            scheduleType: { type: 'string' },
            recipientCount: { type: 'number' },
        },
    },
    execute: async (input: NodeInput): Promise<NodeExecutionResult> => {
        try {
            console.log('[ScheduledEmailNode] Starting execution...');
            console.log('[ScheduledEmailNode] Input:', JSON.stringify(input, null, 2));

            const {
                subject,
                body,
                recipients,
                recipientGroupId,
                scheduledDateTime,
                cronExpression,
                scheduleType,
                personalizationCSV,
            } = input;

            // Validation
            console.log('[ScheduledEmailNode] Received scheduleType:', scheduleType, 'Type:', typeof scheduleType);

            if (!subject || !body) {
                throw new Error('Missing required fields: subject and body');
            }

            if (!scheduleType || !['one-time', 'recurring'].includes(scheduleType as string)) {
                throw new Error(`scheduleType must be either "one-time" or "recurring", received: "${scheduleType}"`);
            }

            if (scheduleType === 'one-time' && !scheduledDateTime) {
                throw new Error('scheduledDateTime is required for one-time schedules');
            }

            if (scheduleType === 'recurring' && !cronExpression) {
                throw new Error('cronExpression is required for recurring schedules');
            }

            // Resolve recipients
            let recipientList: string[] = [];

            if (recipients) {
                // Parse comma-separated emails
                recipientList = recipients
                    .split(',')
                    .map((email: string) => email.trim())
                    .filter((email: string) => email.length > 0);
            } else if (recipientGroupId) {
                // Get recipients from group
                const group = await recipientGroupService.getGroup(recipientGroupId);
                if (!group) {
                    throw new Error(`Recipient group not found: ${recipientGroupId}`);
                }
                recipientList = group.emails;
            }

            if (recipientList.length === 0) {
                throw new Error('No recipients provided. Specify either recipients or recipientGroupId');
            }

            // Create job data
            const jobData: ScheduledEmailJobData = {
                subject,
                body,
                recipients: recipientList,
                recipientGroupId,
                scheduledDateTime: scheduledDateTime ? new Date(scheduledDateTime) : undefined,
                cronExpression,
                scheduleType,
                status: 'scheduled',
                personalizationCSV,
            };

            // Schedule the job
            const job = await jobScheduler.scheduleJob(jobData);

            console.log(`[ScheduledEmailNode] Job scheduled successfully: ${job.id}`);

            return {
                status: 'success',
                data: {
                    jobId: job.id,
                    status: job.status,
                    scheduledFor: job.scheduledDateTime?.toISOString(),
                    cronExpression: job.cronExpression,
                    scheduleType: job.scheduleType,
                    recipientCount: recipientList.length,
                },
            };
        } catch (error: any) {
            console.error('[ScheduledEmailNode] Error:', error);
            return {
                status: 'error',
                error: error.message,
            };
        }
    },
};
