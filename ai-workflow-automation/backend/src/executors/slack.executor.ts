
import { ExecutionContext, ExecutionResult } from '../types';
import { WebClient } from '@slack/web-api';
import { config } from '../config/env';
import { get } from 'lodash';

/**
 * Slack Node Executor
 * Sends messages to Slack channels using the Slack Web API
 */
export class SlackExecutor {
    private client: WebClient;

    constructor() {
        // Initialize Slack client with default bot token from environment if available
        if (config.slackBotToken) {
            this.client = new WebClient(config.slackBotToken);
        } else {
            this.client = new WebClient(); // Empty client, will need token per request or re-init
        }
    }

    /**
     * Execute Slack message sending
     * @param context - Execution context containing node configuration
     * @returns Execution result with success status and message details
     */
    async execute(context: ExecutionContext): Promise<ExecutionResult> {
        try {
            const { channel, message, threadTs, blocks, slackToken, token } = context.data.config;

            // Determine which token to use: config-specific or env-level
            const effectiveToken = slackToken || token || config.slackBotToken;

            if (!effectiveToken) {
                throw new Error('Slack Bot Token is required (either in node config or SLACK_BOT_TOKEN env var)');
            }

            // If using a specific token (different from default), create a new client instance
            const client = (effectiveToken !== config.slackBotToken || !this.client.token)
                ? new WebClient(effectiveToken)
                : this.client;

            if (!channel) {
                throw new Error('Slack channel is required');
            }

            if (!message && !blocks) {
                throw new Error('Either message text or blocks are required');
            }

            // Variable replacement helper
            const processTemplate = (template: string) => {
                if (!template) return '';
                return template.replace(/\${([^}]+)}/g, (_, path) => {
                    const cleanPath = path.replace('data.', '');
                    const value = get(context.previousNodeOutput, cleanPath);
                    return value !== undefined ? value : '';
                });
            };

            // Prepare message payload
            const payload: any = {
                channel: processTemplate(channel),
                text: processTemplate(message),
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
            const result = await client.chat.postMessage(payload);

            return {
                success: true,
                data: {
                    ...context.previousNodeOutput,
                    slackResult: {
                        messageTs: result.ts,
                        channel: result.channel,
                        message: message,
                        permalink: await this.getPermalink(result.channel!, result.ts!, client),
                    }
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
     * @param client - Optional WebClient to use
     * @returns Permalink URL or null
     */
    private async getPermalink(channel: string, messageTs: string, client?: WebClient): Promise<string | null> {
        try {
            const apiClient = client || this.client;
            // Only attempt if we have a token
            if (!apiClient.token) return null;

            const result = await apiClient.chat.getPermalink({
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
