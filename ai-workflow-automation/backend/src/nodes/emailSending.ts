import { WorkflowNode, NodeInput, NodeExecutionResult } from '../types/node';
import * as nodemailer from 'nodemailer';

/**
 * Creates an SMTP transporter.
 * Priority: runtime credentials from node input > .env variables > JSON fallback (simulation)
 */
const createTransporter = (smtpConfig?: {
    host?: string;
    port?: number;
    user?: string;
    pass?: string;
    from?: string;
}) => {
    // 1. Use runtime credentials if provided
    if (smtpConfig?.host && smtpConfig?.user && smtpConfig?.pass) {
        console.log(`[EmailSending] Using runtime SMTP: ${smtpConfig.host} (user: ${smtpConfig.user})`);
        return nodemailer.createTransport({
            host: smtpConfig.host,
            port: smtpConfig.port || 587,
            secure: smtpConfig.port === 465,
            auth: {
                user: smtpConfig.user,
                pass: smtpConfig.pass,
            },
        });
    }

    // 2. Fall back to .env credentials
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
    if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
        console.log(`[EmailSending] Using .env SMTP: ${SMTP_HOST} (user: ${SMTP_USER})`);
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

    // 3. Fallback to JSON transport for testing/demo
    console.log('[EmailSending] No SMTP configured — using simulation mode (emails logged, not sent)');
    return nodemailer.createTransport({
        jsonTransport: true
    });
};

export const emailSendingNode: WorkflowNode = {
    id: 'email-sending',
    type: 'EMAIL_SENDING',
    name: 'Email Sending Node',
    description: 'Sends emails using SMTP. Accepts runtime SMTP credentials or falls back to .env config.',
    inputSchema: {
        type: 'object',
        properties: {
            recipient: { type: 'string', description: 'Single recipient email address' },
            emails: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        email: { type: 'string' }
                    }
                },
                description: 'Array of recipient objects from Email Discovery node'
            },
            subject: { type: 'string', description: 'Email subject line' },
            body: { type: 'string', description: 'Email body (HTML supported)' },
            attachments: { type: 'array', description: 'File attachments' },
            smtpConfig: {
                type: 'object',
                description: 'Runtime SMTP credentials. If provided, overrides .env settings for this execution.',
                properties: {
                    host: { type: 'string', description: 'SMTP host (e.g. smtp.gmail.com)' },
                    port: { type: 'number', description: 'SMTP port (default: 587)' },
                    user: { type: 'string', description: 'SMTP username / email address' },
                    pass: { type: 'string', description: 'SMTP password or app password' },
                    from: { type: 'string', description: 'From address (e.g. "My Name <me@gmail.com>")' },
                }
            }
        },
        required: ['subject', 'body']
    },
    outputSchema: {
        type: 'object',
        properties: {
            sentCount: { type: 'number' },
            status: { type: 'string' },
            messageIds: { type: 'array' },
            smtpSource: { type: 'string', description: 'Where SMTP credentials came from: runtime | env | simulation' },
            results: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        messageId: { type: 'string' },
                        accepted: { type: 'array' },
                        rejected: { type: 'array' }
                    }
                }
            }
        }
    },
    execute: async (input: NodeInput): Promise<NodeExecutionResult> => {
        try {
            console.log('[EmailSending] Starting execution...');
            console.log('[EmailSending] Input received:', JSON.stringify({
                ...input,
                smtpConfig: input.smtpConfig ? { ...input.smtpConfig, pass: '***' } : undefined
            }, null, 2));

            const { recipient, emails, subject, body, attachments, smtpConfig } = input;

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
                console.log('[EmailSending] No recipients found, skipping email send.');
                return {
                    status: 'success',
                    data: {
                        sentCount: 0,
                        status: 'skipped',
                        message: 'No recipients provided. Email sending skipped.'
                    }
                };
            }

            // Create transporter with runtime config (if provided) or fall back to .env
            const transporter = createTransporter(smtpConfig);

            // Determine the "from" address: runtime > .env > default
            const from = smtpConfig?.from
                || process.env.SMTP_FROM
                || (smtpConfig?.user ? `"Workflow Automation" <${smtpConfig.user}>` : '"Workflow Automation" <no-reply@workflowpro.com>');

            // Track which SMTP source was used
            const smtpSource = smtpConfig?.host ? 'runtime' : (process.env.SMTP_HOST ? 'env' : 'simulation');

            console.log(`[EmailSending] From: ${from}`);
            console.log(`[EmailSending] SMTP source: ${smtpSource}`);
            console.log(`[EmailSending] Sending to ${recipients.length} recipient(s)...`);

            const results = [];
            for (const to of recipients) {
                const mailOptions = {
                    from,
                    to,
                    subject,
                    html: body,
                    attachments: attachments || []
                };

                console.log(`[EmailSending] → Sending to ${to}...`);
                const info = await transporter.sendMail(mailOptions);
                results.push(info);
            }

            console.log(`[EmailSending] ✅ Sent ${results.length} email(s) via ${smtpSource}`);

            return {
                status: 'success',
                data: {
                    sentCount: results.length,
                    messageIds: results.map(r => r.messageId),
                    status: 'sent',
                    smtpSource,
                    results: results.map(r => ({
                        messageId: r.messageId,
                        accepted: r.accepted,
                        rejected: r.rejected
                    }))
                }
            };

        } catch (error: any) {
            console.error('[EmailSending] Failed:', error);
            return {
                status: 'error',
                error: error.message
            };
        }
    }
};
