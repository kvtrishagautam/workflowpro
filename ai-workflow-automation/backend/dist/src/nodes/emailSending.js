"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailSendingNode = void 0;
const nodemailer = __importStar(require("nodemailer"));
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
exports.emailSendingNode = {
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
    execute: async (input) => {
        try {
            console.log('[EmailSending] Starting execution...');
            console.log('[EmailSending] Input received:', JSON.stringify(input, null, 2));
            const { recipient, emails, subject, body, attachments } = input;
            if (!subject || !body) {
                throw new Error('Missing required inputs: subject or body.');
            }
            // Determine recipients: direct input OR from discovery node output
            let recipients = [];
            if (recipient) {
                recipients.push(recipient);
            }
            else if (emails && Array.isArray(emails)) {
                recipients = emails.map((item) => item.email).filter(Boolean);
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
        }
        catch (error) {
            console.error('Email sending failed:', error);
            return {
                status: 'error',
                error: error.message
            };
        }
    }
};
