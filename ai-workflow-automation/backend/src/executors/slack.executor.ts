import { ExecutionContext, ExecutionResult } from '../types';
import { WebClient } from '@slack/web-api';
import { config } from '../config/env';

/**
 * Slack Node Executor
 * Sends messages to Slack channels using the Slack Web API
 */
export class SlackExecutor {
    private client: WebClient;

    constructor() {
        // Initialize Slack client with bot token from environment
        this.client = new WebClient(config.slackBotToken);
    }

    /**
     * Execute Slack message sending
     * @param context - Execution context containing node configuration
     * @returns Execution result with success status and message details
     */
    async execute(context: ExecutionContext): Promise<ExecutionResult> {
        try {
            const { channel, message, threadTs, blocks } = context.data.config;

            // Validate required fields
            if (!channel) {
                throw new Error('Slack channel is required');
            }

            if (!message && !blocks) {
                throw new Error('Either message text or blocks are required');
            }

            // Prepare message payload
            const payload: any = {
                channel,
                text: message,
            };

            // Add optional thread timestamp for threaded replies
            if (threadTs) {
                payload.thread_ts = threadTs;
            }

            // Add blocks for rich formatting (optional)
            if (blocks) {
                payload.blocks = blocks;
            }

            // Send message to Slack
            const result = await this.client.chat.postMessage(payload);

            return {
                success: true,
                data: {
                    messageTs: result.ts,
                    channel: result.channel,
                    message: message,
                    permalink: await this.getPermalink(result.channel!, result.ts!),
                },
            };
        } catch (error: any) {
            return {
                success: false,
                error: `Slack error: ${error.message}`,
            };
        }
    }

    /**
     * Get permalink for a sent message
     * @param channel - Channel ID
     * @param messageTs - Message timestamp
     * @returns Permalink URL or null
     */
    private async getPermalink(channel: string, messageTs: string): Promise<string | null> {
        try {
            const result = await this.client.chat.getPermalink({
                channel,
                message_ts: messageTs,
            });
            return result.permalink || null;
        } catch (error) {
            // Permalink is optional, don't fail if we can't get it
            return null;
        }
    }

    /**
     * Send a message with rich formatting using Block Kit
     * @param channel - Channel ID or name
     * @param blocks - Slack Block Kit blocks
     * @param text - Fallback text
     */
    async sendBlockMessage(
        channel: string,
        blocks: any[],
        text: string
    ): Promise<ExecutionResult> {
        return this.execute({
            workflowId: '',
            executionId: '',
            data: {
                config: { channel, blocks, message: text },
            },
        });
    }

    /**
     * Send a simple text message
     * @param channel - Channel ID or name
     * @param message - Message text
     */
    async sendTextMessage(channel: string, message: string): Promise<ExecutionResult> {
        return this.execute({
            workflowId: '',
            executionId: '',
            data: {
                config: { channel, message },
            },
        });
    }
}

// Export singleton instance
export const slackExecutor = new SlackExecutor();
