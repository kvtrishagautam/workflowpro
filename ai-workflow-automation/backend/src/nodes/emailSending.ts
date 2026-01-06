import { WorkflowNode, NodeInput, NodeExecutionResult } from '../types/node';
import * as nodemailer from 'nodemailer';

// Configure a transporter based on environment variables
const createTransporter = () => {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

    if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
        console.log('Using SMTP transporter:', SMTP_HOST);
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

    // Fallback to JSON transport for testing/demo if no SMTP provided
    console.log('Using fallback JSON transport (simulation)');
    return nodemailer.createTransport({
        jsonTransport: true
    });
};

export const emailSendingNode: WorkflowNode = {
    id: 'email-sending',
    type: 'EMAIL_SENDING',
    name: 'Email Sending Node',
    description: 'Sends emails using SMTP. Can process lists of discovered emails.',
    inputSchema: {
        type: 'object',
        properties: {
            recipient: { type: 'string' },
            emails: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        email: { type: 'string' }
                    }
                }
            },
            subject: { type: 'string' },
            body: { type: 'string' },
            attachments: { type: 'array' }
        },
        required: ['subject', 'body']
    },
    outputSchema: {
        type: 'object',
        properties: {
            messageId: { type: 'string' },
            status: { type: 'string' },
            accepted: { type: 'array' },
            rejected: { type: 'array' }
        }
    },
    execute: async (input: NodeInput): Promise<NodeExecutionResult> => {
        try {
            console.log('[EmailSending] Starting execution...');
            console.log('[EmailSending] Input received:', JSON.stringify(input, null, 2));
            const { recipient, emails, subject, body, attachments } = input;

            if (!subject || !body) {
                throw new Error('Missing required inputs: subject or body.');
            }

            // Determine recipients: direct input OR from discovery node output
            let recipients: string[] = [];
            if (recipient) {
                recipients.push(recipient);
            } else if (emails && Array.isArray(emails)) {
                recipients = emails.map((item: any) => item.email).filter(Boolean);
            }

            if (recipients.length === 0) {
                throw new Error('No recipients provided. Either "recipient" or "emails" array must be present.');
            }

            const transporter = createTransporter();
            const from = process.env.SMTP_FROM || '"Workflow Automation" <no-reply@workflowpro.com>';

            const results = [];
            for (const to of recipients) {
                const mailOptions = {
                    from,
                    to,
                    subject,
                    html: body,
                    attachments: attachments || []
                };

                console.log(`Attempting to send email to ${to}...`);
                const info = await transporter.sendMail(mailOptions);
                results.push(info);
            }

            return {
                status: 'success',
                data: {
                    sentCount: results.length,
                    messageIds: results.map(r => r.messageId),
                    status: 'sent',
                    results: results.map(r => ({
                        messageId: r.messageId,
                        accepted: r.accepted,
                        rejected: r.rejected
                    }))
                }
            };

        } catch (error: any) {
            console.error('Email sending failed:', error);
            return {
                status: 'error',
                error: error.message
            };
        }
    }
};
