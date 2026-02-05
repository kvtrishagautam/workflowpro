import { ExecutionContext, ExecutionResult } from '../types';
import nodemailer, { Transporter } from 'nodemailer';
import { get } from 'lodash';

export class EmailExecutor {
    async execute(context: ExecutionContext): Promise<ExecutionResult> {
        try {
            const { data, previousNodeOutput } = context;
            const config = data.config;
            const operation = config.operation || 'send';

            // Debug logging
            console.log('📧 Email Executor Input:', JSON.stringify(previousNodeOutput, null, 2));
            console.log('📧 Config To:', config.to);

            // Variable replacement helper
            const processTemplate = (template: string) => {
                if (!template) return '';
                return template.replace(/\${([^}]+)}/g, (_, path) => {
                    const cleanPath = path.replace('data.', '');
                    const value = get(previousNodeOutput, cleanPath);
                    return value !== undefined ? value : '';
                });
            };

            if (operation === 'send') {
                // Determine transport config
                let transporter: Transporter;

                // If using a pre-defined service like Gmail/SendGrid via simplistic credentials or SMTP
                const host = config.host || config.smtpHost;
                const user = config.user || config.smtpUser?.trim(); // trim to remove accidental whitespace
                const pass = config.pass || config.smtpPassword;
                const port = Number(config.port || config.smtpPort) || 587;

                if (host && user && pass) {
                    transporter = nodemailer.createTransport({
                        host: host,
                        port: port,
                        secure: port === 465, // true for 465, false for other ports
                        auth: {
                            user: user,
                            pass: pass,
                        },
                    });
                } else if (config.service === 'gmail') {
                    // Legacy helper, though host/user/pass is preferred
                    transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            user: config.user,
                            pass: config.pass,
                        },
                    });
                } else {
                    // Fallback check - if we have partial credentials but matched no block above, throw
                    throw new Error(`Invalid email configuration. Please provide Host, User, and Password. Found keys: ${Object.keys(config).join(', ')}`);
                }

                const mailOptions = {
                    from: config.from || process.env.DEFAULT_FROM_EMAIL || 'noreply@workflowpro.com',
                    to: processTemplate(config.to),
                    cc: processTemplate(config.cc),
                    subject: processTemplate(config.subject),
                    text: config.bodyType === 'text' ? processTemplate(config.body) : undefined,
                    html: config.bodyType === 'html' ? processTemplate(config.body) : undefined,
                };

                console.log('📧 Resolved Mail Options:', JSON.stringify(mailOptions, null, 2));

                const info = await transporter.sendMail(mailOptions);

                return {
                    success: true,
                    data: {
                        messageId: info.messageId,
                        response: info.response,
                        preview: nodemailer.getTestMessageUrl(info)
                    }
                };
            }

            return { success: true, data: previousNodeOutput };

        } catch (error: any) {
            return {
                success: false,
                data: null,
                error: error.message
            };
        }
    }
}

export const emailExecutor = new EmailExecutor();
