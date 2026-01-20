import { supabase } from './supabaseClient';

class DeliveryLogger {
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
            await supabase.from('delivery_logs').insert({
                job_id: jobId,
                recipient,
                status,
                message_id: messageId,
                error,
            });

            console.log(`[DeliveryLogger] Logged ${status} for ${recipient} (job: ${jobId})`);
        } catch (error) {
            console.error('[DeliveryLogger] Error logging delivery:', error);
        }
    }

    /**
     * Get all logs for a specific job
     */
    async getJobLogs(jobId: string): Promise<any[]> {
        try {
            const { data, error } = await supabase
                .from('delivery_logs')
                .select('*')
                .eq('job_id', jobId)
                .order('timestamp', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error(`[DeliveryLogger] Error getting logs for job ${jobId}:`, error);
            throw error;
        }
    }

    /**
     * Get all delivery logs with optional limit
     */
    async getAllLogs(limit: number = 100): Promise<any[]> {
        try {
            const { data, error } = await supabase
                .from('delivery_logs')
                .select('*, job:scheduled_email_jobs(subject, schedule_type)')
                .order('timestamp', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('[DeliveryLogger] Error getting all logs:', error);
            throw error;
        }
    }
}

export const deliveryLogger = new DeliveryLogger();
