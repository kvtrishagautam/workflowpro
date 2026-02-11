import { ExecutionContext, ExecutionResult } from '../types';
import axios from 'axios';
import { get } from 'lodash';

/**
 * WhatsApp Node Executor
 * Sends messages via WhatsApp Business API (Meta Cloud API)
 */
export class WhatsAppExecutor {
    /**
     * Execute WhatsApp message sending
     * @param context - Execution context containing node configuration
     * @returns Execution result with success status and message details
     */
    async execute(context: ExecutionContext): Promise<ExecutionResult> {
        try {
            const { phoneNumberId, accessToken, to, message } = context.data.config;

            if (!phoneNumberId) {
                throw new Error('WhatsApp Phone Number ID is required');
            }

            if (!accessToken) {
                throw new Error('WhatsApp Access Token is required');
            }

            if (!to) {
                throw new Error('Recipient phone number is required');
            }

            if (!message) {
                throw new Error('Message text is required');
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

            const recipientPhone = processTemplate(to);
            const messageText = processTemplate(message);

            // WhatsApp Cloud API endpoint
            const apiUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

            // Send message via WhatsApp Cloud API
            const response = await axios.post(
                apiUrl,
                {
                    messaging_product: 'whatsapp',
                    to: recipientPhone,
                    type: 'text',
                    text: {
                        body: messageText
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return {
                success: true,
                data: {
                    ...context.previousNodeOutput,
                    whatsappResult: {
                        messageId: response.data.messages?.[0]?.id,
                        recipientPhone: recipientPhone,
                        status: 'sent'
                    }
                }
            };
        } catch (error: any) {
            const errorMessage = error.response?.data?.error?.message || error.message;
            return {
                success: false,
                error: `WhatsApp error: ${errorMessage}`
            };
        }
    }
}

// Export singleton instance
export const whatsappExecutor = new WhatsAppExecutor();
