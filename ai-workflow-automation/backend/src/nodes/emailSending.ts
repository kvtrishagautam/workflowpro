import { WorkflowNode, NodeInput, NodeExecutionResult } from '../types/node';
import * as nodemailer from 'nodemailer';

/**
 * Infer SMTP host from email domain when the user doesn't explicitly provide one.
 */
function inferSmtpHost(email: string): string {
    const domain = email.split('@')[1];
    if (!domain) return '';
    if (domain === 'gmail.com') return 'smtp.gmail.com';
    if (domain === 'outlook.com' || domain === 'hotmail.com' || domain === 'live.com') return 'smtp-mail.outlook.com';
    if (domain === 'yahoo.com' || domain === 'ymail.com') return 'smtp.mail.yahoo.com';
    return `smtp.${domain}`;
}

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
    // 1. Use runtime credentials if provided (user + pass is enough; host can be inferred)
    if (smtpConfig?.user && smtpConfig?.pass) {
        const host = smtpConfig.host || inferSmtpHost(smtpConfig.user);
        if (host) {
            console.log(`[EmailSending] Using runtime SMTP: ${host} (user: ${smtpConfig.user})`);
            return nodemailer.createTransport({
                host,
                port: smtpConfig.port || 587,
                secure: smtpConfig.port === 465,
                auth: {
                    user: smtpConfig.user,
                    pass: smtpConfig.pass,
                },
            });
        }
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
            console.log('[EmailSending] ━━━ Starting execution ━━━');
            console.log('[EmailSending] Input keys:', Object.keys(input));
            // ── Normalise SMTP credentials ──────────────────────────────────
            // Accept EITHER a nested smtpConfig object OR flat keys
            // (smtpHost / smtpPort / smtpUser / smtpPassword / smtpFrom)
            // that the frontend Credentials tab saves into node.data.config.
            let smtpConfig: {
                host?: string; port?: number; user?: string; pass?: string; from?: string;
            } | undefined = input.smtpConfig;

            if (!smtpConfig && (input.smtpHost || input.smtpUser)) {
                const userEmail = input.smtpUser || '';
                smtpConfig = {
                    host: input.smtpHost || inferSmtpHost(userEmail),
                    port: Number(input.smtpPort) || 587,
                    user: userEmail,
                    pass: input.smtpPassword,
                    from: input.smtpFrom || undefined,
                };
                console.log('[EmailSending] Built smtpConfig from flat credential keys');
            }

            // Auto-infer host if smtpConfig exists but host is missing
            if (smtpConfig && !smtpConfig.host && smtpConfig.user) {
                smtpConfig.host = inferSmtpHost(smtpConfig.user);
                console.log(`[EmailSending] Auto-inferred host from email: ${smtpConfig.host}`);
            }
            console.log('[EmailSending] Input details:', JSON.stringify({
                recipient: input.recipient || '(none)',
                emailsCount: Array.isArray(input.emails) ? input.emails.length : '(no emails array)',
                subject: input.subject || '(MISSING)',
                bodyLength: input.body ? input.body.length : '(MISSING)',
                hasSmtpConfig: !!smtpConfig,
                smtpConfigHost: smtpConfig?.host || '(none)',
                smtpConfigUser: smtpConfig?.user || '(none)',
            }, null, 2));

            const { recipient, emails, subject, body, attachments } = input;

            if (!subject || !body) {
                console.error('[EmailSending] ❌ Missing subject or body!');
                console.error('[EmailSending]   subject:', subject ? `"${subject}"` : 'UNDEFINED');
                console.error('[EmailSending]   body:', body ? `(${body.length} chars)` : 'UNDEFINED');
                throw new Error('Missing required inputs: subject or body. Make sure these are configured in the Email Sending node.');
            }

            // Determine recipients: direct input AND/OR from discovery node output
            let recipients: string[] = [];
            // Add directly-configured recipient (if any)
            if (recipient) {
                recipients.push(recipient);
            }
            // Also add all emails from the Email Discovery node output (bulk)
            if (emails && Array.isArray(emails)) {
                const discoveredRecipients = emails.map((item: any) => item.email).filter(Boolean);
                recipients.push(...discoveredRecipients);
            }
            // Deduplicate
            recipients = Array.from(new Set(recipients));

            if (recipients.length === 0) {
                const hint = !recipient && (!emails || emails.length === 0)
                    ? 'Set a "Recipient Email" in the Email Sending node config, or connect an Email Discovery node that returns results.'
                    : 'The Email Discovery node returned 0 emails and no direct recipient was configured.';
                console.error(`[EmailSending] ❌ No recipients found. ${hint}`);
                return {
                    status: 'error',
                    error: `No recipients — cannot send email. ${hint}`,
                    data: {
                        sentCount: 0,
                        status: 'failed',
                        message: `No recipients provided. ${hint}`
                    }
                };
            }

            // Create transporter with runtime config (if provided) or fall back to .env
            const transporter = createTransporter(smtpConfig);

            // Determine the "from" address
            // Priority: explicit from → user's SMTP username → .env SMTP_FROM → hardcoded default
            const from = smtpConfig?.from
                || (smtpConfig?.user ? `"Workflow Automation" <${smtpConfig.user}>` : null)
                || process.env.SMTP_FROM
                || '"Workflow Automation" <no-reply@workflowpro.com>';

            // Track which SMTP source was used
            const smtpSource = smtpConfig?.host ? 'runtime' : (process.env.SMTP_HOST ? 'env' : 'simulation');

            console.log(`[EmailSending] From: ${from}`);
            console.log(`[EmailSending] SMTP source: ${smtpSource}`);
            console.log(`[EmailSending] Sending to ${recipients.length} recipient(s)...`);

            const results = [];
            const failures: Array<{ to: string; error: string }> = [];
            const SEND_DELAY_MS = 1500; // 1.5s between sends to avoid rate-limiting

            for (let i = 0; i < recipients.length; i++) {
                const to = recipients[i];
                // Rate limit between sends (skip delay for the first one)
                if (i > 0) {
                    await new Promise(resolve => setTimeout(resolve, SEND_DELAY_MS));
                }

                const mailOptions = {
                    from,
                    to,
                    subject,
                    html: body,
                    attachments: attachments || []
                };

                try {
                    console.log(`[EmailSending] → [${i + 1}/${recipients.length}] Sending to ${to}...`);
                    const info = await transporter.sendMail(mailOptions);
                    results.push(info);
                    console.log(`[EmailSending]   ✓ Sent to ${to} (messageId: ${info.messageId})`);
                } catch (sendErr: any) {
                    console.error(`[EmailSending]   ✗ Failed to send to ${to}: ${sendErr.message}`);
                    failures.push({ to, error: sendErr.message });
                    // Continue with remaining recipients — don't abort the batch
                }
            }

            console.log(`[EmailSending] ✅ Sent ${results.length}/${recipients.length} email(s) via ${smtpSource}${failures.length > 0 ? ` (${failures.length} failed)` : ''}`);

            return {
                status: failures.length < recipients.length ? 'success' : 'error',
                error: failures.length === recipients.length ? `All ${failures.length} emails failed to send` : undefined,
                data: {
                    sentCount: results.length,
                    failedCount: failures.length,
                    totalRecipients: recipients.length,
                    messageIds: results.map(r => r.messageId),
                    status: results.length > 0 ? 'sent' : 'failed',
                    smtpSource,
                    results: results.map(r => ({
                        messageId: r.messageId,
                        accepted: r.accepted,
                        rejected: r.rejected
                    })),
                    failures: failures.length > 0 ? failures : undefined,
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
