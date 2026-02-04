import * as cron from 'node-cron';
import { ScheduledJob, IScheduledJob } from '../models/ScheduledJob.model';
import { RecipientGroup } from '../models/RecipientGroup.model';
import * as nodemailer from 'nodemailer';
import { deliveryLogger } from './deliveryLogger.service';
import { templateEngine } from './templateEngine.service';

class JobSchedulerService {
    private cronTasks: Map<string, cron.ScheduledTask> = new Map();

    /**
     * Initialize scheduler on server start
     */
    async initializeScheduler(): Promise<void> {
        console.log('[JobScheduler] Initializing scheduler...');

        try {
            const scheduledJobs = await ScheduledJob.find({ status: 'scheduled' });

            console.log(`[JobScheduler] Found ${scheduledJobs.length} scheduled jobs`);

            for (const job of scheduledJobs) {
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
    async scheduleJob(jobData: {
        subject: string;
        body: string;
        recipients?: string[];
        recipientGroupId?: string;
        scheduledDateTime?: Date;
        cronExpression?: string;
        scheduleType: 'one-time' | 'recurring';
        personalizationCSV?: string;
    }): Promise<IScheduledJob> {
        try {
            const job = await ScheduledJob.create({
                subject: jobData.subject,
                body: jobData.body,
                recipients: jobData.recipients || [],
                recipientGroupId: jobData.recipientGroupId,
                scheduledDateTime: jobData.scheduledDateTime,
                cronExpression: jobData.cronExpression,
                scheduleType: jobData.scheduleType,
                status: 'scheduled',
                personalizationCSV: jobData.personalizationCSV,
            });

            console.log(`[JobScheduler] Created job ${job._id}`);
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
    private async registerCronTask(job: IScheduledJob): Promise<void> {
        try {
            let cronExpression: string;

            if (job.scheduleType === 'one-time' && job.scheduledDateTime) {
                const scheduledDate = new Date(job.scheduledDateTime);
                const minute = scheduledDate.getMinutes();
                const hour = scheduledDate.getHours();
                const dayOfMonth = scheduledDate.getDate();
                const month = scheduledDate.getMonth() + 1;

                cronExpression = `${minute} ${hour} ${dayOfMonth} ${month} *`;
            } else if (job.cronExpression) {
                cronExpression = job.cronExpression;
            } else {
                console.error(`[JobScheduler] Job ${job._id} has no valid schedule`);
                return;
            }

            console.log(`[JobScheduler] Registering cron task for job ${job._id}: ${cronExpression}`);

            const task = cron.schedule(cronExpression, async () => {
                await this.executeJob(job._id.toString());
            });

            this.cronTasks.set(job._id.toString(), task);
        } catch (error) {
            console.error(`[JobScheduler] Error registering cron task for job ${job._id}:`, error);
        }
    }

    /**
     * Execute a scheduled job
     */
    async executeJob(jobId: string): Promise<void> {
        console.log(`[JobScheduler] Executing job ${jobId}`);

        try {
            const job = await ScheduledJob.findById(jobId);

            if (!job) {
                console.error(`[JobScheduler] Job ${jobId} not found`);
                return;
            }

            if (job.status !== 'scheduled') {
                console.log(`[JobScheduler] Job ${jobId} is not in scheduled status, skipping`);
                return;
            }

            let recipients: string[] = job.recipients;
            if (job.recipientGroupId) {
                const group = await RecipientGroup.findById(job.recipientGroupId);
                if (group) {
                    recipients = group.emails;
                }
            }

            let personalizationData: any[] = [];
            if (job.personalizationCSV) {
                personalizationData = await templateEngine.parseCSV(job.personalizationCSV);
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

            if (job.scheduleType === 'one-time') {
                job.status = failureCount === 0 ? 'sent' : 'failed';
                job.executedAt = new Date();
                if (failureCount > 0) {
                    job.errorMessage = `${failureCount} emails failed`;
                }
                await job.save();

                const task = this.cronTasks.get(jobId);
                if (task) {
                    task.stop();
                    this.cronTasks.delete(jobId);
                }
            } else {
                job.executedAt = new Date();
                await job.save();
            }

            console.log(`[JobScheduler] Job ${jobId} executed: ${successCount} sent, ${failureCount} failed`);
        } catch (error: any) {
            console.error(`[JobScheduler] Error executing job ${jobId}:`, error);

            await ScheduledJob.findByIdAndUpdate(jobId, {
                status: 'failed',
                errorMessage: error.message || 'Unknown error',
            });
        }
    }

    /**
     * Cancel a scheduled job
     */
    async cancelJob(jobId: string): Promise<void> {
        try {
            await ScheduledJob.findByIdAndUpdate(jobId, { status: 'cancelled' });

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
    async getScheduledJobs(status?: string): Promise<IScheduledJob[]> {
        try {
            const query = status ? { status } : {};
            const jobs = await ScheduledJob.find(query).sort({ createdAt: -1 });
            return jobs;
        } catch (error) {
            console.error('[JobScheduler] Error getting scheduled jobs:', error);
            throw error;
        }
    }

    /**
     * Get job by ID
     */
    async getJobById(jobId: string): Promise<IScheduledJob | null> {
        try {
            const job = await ScheduledJob.findById(jobId);
            return job;
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

export const jobScheduler = new JobSchedulerService();
