import * as cron from 'node-cron';
import { supabase } from './supabaseClient';
import { ScheduledEmailJobData, JobStatus } from '../types/scheduledJobTypes';
import * as nodemailer from 'nodemailer';
import { deliveryLogger } from './deliveryLogger';
import { templateEngine } from './templateEngine';

interface CronTask {
    task: cron.ScheduledTask;
    jobId: string;
}

class JobScheduler {
    private cronTasks: Map<string, cron.ScheduledTask> = new Map();

    /**
     * Initialize scheduler on server start
     */
    async initializeScheduler(): Promise<void> {
        console.log('[JobScheduler] Initializing scheduler...');

        try {
            const { data: scheduledJobs, error } = await supabase
                .from('scheduled_email_jobs')
                .select('*')
                .eq('status', 'scheduled');

            if (error) throw error;

            console.log(`[JobScheduler] Found ${scheduledJobs?.length || 0} scheduled jobs`);

            for (const job of scheduledJobs || []) {
                await this.registerCronTask(job);
            }

            console.log('[JobScheduler] Scheduler initialized successfully');
        } catch (error) {
            console.error('[JobScheduler] Error initializing scheduler:', error);
            throw error;
        }
    }

    /**
     * Schedule a new email job
     */
    async scheduleJob(jobData: ScheduledEmailJobData): Promise<any> {
        try {
            const { data: job, error } = await supabase
                .from('scheduled_email_jobs')
                .insert({
                    subject: jobData.subject,
                    body: jobData.body,
                    recipients: jobData.recipients,
                    recipient_group_id: jobData.recipientGroupId,
                    scheduled_date_time: jobData.scheduledDateTime,
                    cron_expression: jobData.cronExpression,
                    schedule_type: jobData.scheduleType,
                    status: 'scheduled',
                    personalization_csv: jobData.personalizationCSV,
                })
                .select()
                .single();

            if (error) throw error;

            console.log(`[JobScheduler] Created job ${job.id}`);
            await this.registerCronTask(job);

            return job;
        } catch (error) {
            console.error('[JobScheduler] Error scheduling job:', error);
            throw error;
        }
    }

    /**
     * Register a cron task for a job
     */
    private async registerCronTask(job: any): Promise<void> {
        try {
            let cronExpression: string;

            if (job.schedule_type === 'one-time') {
                const scheduledDate = new Date(job.scheduled_date_time);
                const minute = scheduledDate.getMinutes();
                const hour = scheduledDate.getHours();
                const dayOfMonth = scheduledDate.getDate();
                const month = scheduledDate.getMonth() + 1;

                cronExpression = `${minute} ${hour} ${dayOfMonth} ${month} *`;
            } else {
                cronExpression = job.cron_expression;
            }

            console.log(`[JobScheduler] Registering cron task for job ${job.id}: ${cronExpression}`);

            const task = cron.schedule(cronExpression, async () => {
                await this.executeJob(job.id);
            });

            this.cronTasks.set(job.id, task);
        } catch (error) {
            console.error(`[JobScheduler] Error registering cron task for job ${job.id}:`, error);
        }
    }

    /**
     * Execute a scheduled job
     */
    async executeJob(jobId: string): Promise<void> {
        console.log(`[JobScheduler] Executing job ${jobId}`);

        try {
            const { data: job, error } = await supabase
                .from('scheduled_email_jobs')
                .select('*')
                .eq('id', jobId)
                .single();

            if (error || !job) {
                console.error(`[JobScheduler] Job ${jobId} not found`);
                return;
            }

            if (job.status !== 'scheduled') {
                console.log(`[JobScheduler] Job ${jobId} is not in scheduled status, skipping`);
                return;
            }

            let recipients: string[] = job.recipients;
            if (job.recipient_group_id) {
                // Fetch recipient group separately
                const { data: group } = await supabase
                    .from('recipient_groups')
                    .select('emails')
                    .eq('id', job.recipient_group_id)
                    .single();

                if (group) {
                    recipients = group.emails;
                }
            }

            let personalizationData: any[] = [];
            if (job.personalization_csv) {
                personalizationData = await templateEngine.parseCSV(job.personalization_csv);
            }

            const transporter = this.createTransporter();
            let successCount = 0;
            let failureCount = 0;

            for (const recipient of recipients) {
                try {
                    let personalizedSubject = job.subject;
                    let personalizedBody = job.body;

                    const personalization = personalizationData.find(p => p.email === recipient);
                    if (personalization) {
                        personalizedSubject = templateEngine.personalize(job.subject, personalization.variables);
                        personalizedBody = templateEngine.personalize(job.body, personalization.variables);
                    }

                    const info = await transporter.sendMail({
                        from: process.env.SMTP_FROM || '"Workflow Automation" <no-reply@workflowpro.com>',
                        to: recipient,
                        subject: personalizedSubject,
                        html: personalizedBody,
                    });

                    await deliveryLogger.logDelivery(jobId, recipient, 'sent', info.messageId);
                    successCount++;
                } catch (error: any) {
                    await deliveryLogger.logDelivery(jobId, recipient, 'failed', undefined, error.message);
                    failureCount++;
                }
            }

            if (job.schedule_type === 'one-time') {
                await supabase
                    .from('scheduled_email_jobs')
                    .update({
                        status: failureCount === 0 ? 'sent' : 'failed',
                        executed_at: new Date().toISOString(),
                        error_message: failureCount > 0 ? `${failureCount} emails failed` : null,
                    })
                    .eq('id', jobId);

                const task = this.cronTasks.get(jobId);
                if (task) {
                    task.stop();
                    this.cronTasks.delete(jobId);
                }
            } else {
                await supabase
                    .from('scheduled_email_jobs')
                    .update({ executed_at: new Date().toISOString() })
                    .eq('id', jobId);
            }

            console.log(`[JobScheduler] Job ${jobId} executed: ${successCount} sent, ${failureCount} failed`);
        } catch (error) {
            console.error(`[JobScheduler] Error executing job ${jobId}:`, error);

            await supabase
                .from('scheduled_email_jobs')
                .update({
                    status: 'failed',
                    error_message: error instanceof Error ? error.message : 'Unknown error',
                })
                .eq('id', jobId);
        }
    }

    /**
     * Cancel a scheduled job
     */
    async cancelJob(jobId: string): Promise<void> {
        try {
            await supabase
                .from('scheduled_email_jobs')
                .update({ status: 'cancelled' })
                .eq('id', jobId);

            const task = this.cronTasks.get(jobId);
            if (task) {
                task.stop();
                this.cronTasks.delete(jobId);
            }

            console.log(`[JobScheduler] Job ${jobId} cancelled`);
        } catch (error) {
            console.error(`[JobScheduler] Error cancelling job ${jobId}:`, error);
            throw error;
        }
    }

    /**
     * Get all scheduled jobs
     */
    async getScheduledJobs(status?: JobStatus): Promise<any[]> {
        try {
            let query = supabase
                .from('scheduled_email_jobs')
                .select('*')
                .order('created_at', { ascending: false });

            if (status) {
                query = query.eq('status', status);
            }

            const { data, error } = await query;
            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('[JobScheduler] Error getting scheduled jobs:', error);
            throw error;
        }
    }

    /**
     * Get job by ID
     */
    async getJobById(jobId: string): Promise<any> {
        try {
            const { data, error } = await supabase
                .from('scheduled_email_jobs')
                .select('*')
                .eq('id', jobId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error(`[JobScheduler] Error getting job ${jobId}:`, error);
            throw error;
        }
    }

    /**
     * Create email transporter
     */
    private createTransporter() {
        const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

        if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
            return nodemailer.createTransport({
                host: SMTP_HOST,
                port: Number(SMTP_PORT) || 587,
                secure: SMTP_PORT === '465',
                auth: {
                    user: SMTP_USER,
                    pass: SMTP_PASS,
                },
            });
        }

        return nodemailer.createTransport({
            jsonTransport: true,
        });
    }
}

export const jobScheduler = new JobScheduler();
