import { DeliveryLog, IDeliveryLog } from '../models/DeliveryLog.model';

class DeliveryLoggerService {
    /**
     * Log a delivery attempt
     */
    async logDelivery(
        jobId: string,
        recipient: string,
        status: 'sent' | 'failed',
        messageId?: string,
        error?: string
    ): Promise<void> {
        try {
            await DeliveryLog.create({
                jobId,
                recipient,
                status,
                messageId,
                error
            });

            console.log(`[DeliveryLogger] Logged ${status} for ${recipient} (job: ${jobId})`);
        } catch (error) {
            console.error('[DeliveryLogger] Error logging delivery:', error);
        }
    }

    /**
     * Get all logs for a specific job
     */
    async getJobLogs(jobId: string): Promise<IDeliveryLog[]> {
        try {
            const logs = await DeliveryLog.find({ jobId }).sort({ timestamp: -1 });
            return logs;
        } catch (error) {
            console.error(`[DeliveryLogger] Error getting logs for job ${jobId}:`, error);
            throw error;
        }
    }

    /**
     * Get all delivery logs with optional limit
     */
    async getAllLogs(limit: number = 100): Promise<IDeliveryLog[]> {
        try {
            const logs = await DeliveryLog.find()
                .sort({ timestamp: -1 })
                .limit(limit);
            return logs;
        } catch (error) {
            console.error('[DeliveryLogger] Error getting all logs:', error);
            throw error;
        }
    }
}

export const deliveryLogger = new DeliveryLoggerService();
