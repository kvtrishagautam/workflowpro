import { ExecutionContext, ExecutionResult } from '../types';
import axios from 'axios';
import { get } from 'lodash';

/**
 * Discord Node Executor
 * Sends messages to Discord channels via webhooks
 */
export class DiscordExecutor {
    /**
     * Execute Discord message send
     * @param context - Execution context containing Discord configuration
     * @returns Execution result
     */
    async execute(context: ExecutionContext): Promise<ExecutionResult> {
        try {
            const { webhookUrl, message, username, avatarUrl } = context.data.config;
            const previousOutput = context.previousNodeOutput || {};

            if (!message) {
                throw new Error('Message is required');
            }

            // Helper to process variable substitution in messages
            const processTemplate = (template: string) => {
                if (!template) return '';

                // Replace ${data.field} or {{data.field}} syntax
                return template.replace(/\${([^}]+)}|\{\{([^}]+)\}\}/g, (_, path1, path2) => {
                    const path = path1 || path2;
                    const cleanPath = path.replace('data.', '').trim();
                    const value = get(previousOutput, cleanPath);
                    return value !== undefined ? value : '';
                });
            };

            const processedMessage = processTemplate(message);

            console.log('🎮 Discord: Preparing message...');
            console.log('Message:', processedMessage);

            // If no webhook URL, run in simulated mode
            if (!webhookUrl) {
                console.log('📝 Discord: Running in SIMULATED mode (no webhook URL provided)');
                console.log('Would send to Discord:', processedMessage);

                return {
                    success: true,
                    data: {
                        ...previousOutput,
                        discordResult: {
                            simulated: true,
                            message: processedMessage
                        }
                    }
                };
            }

            // Send actual Discord webhook
            const payload: any = {
                content: processedMessage
            };

            if (username) {
                payload.username = processTemplate(username);
            }

            if (avatarUrl) {
                payload.avatar_url = processTemplate(avatarUrl);
            }

            console.log('🎮 Sending Discord webhook...');

            const response = await axios.post(webhookUrl, payload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('✅ Discord message sent successfully');

            return {
                success: true,
                data: {
                    ...previousOutput,
                    discordResult: {
                        success: true,
                        status: response.status,
                        message: processedMessage
                    }
                }
            };
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message;
            console.error('❌ Discord error:', errorMessage);

            return {
                success: false,
                error: `Discord error: ${errorMessage}`
            };
        }
    }
}

// Export singleton instance
export const discordExecutor = new DiscordExecutor();
