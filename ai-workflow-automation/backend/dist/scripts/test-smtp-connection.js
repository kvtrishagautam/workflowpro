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
const nodemailer = __importStar(require("nodemailer"));
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
// Load env from one level up (backend folder)
dotenv.config({ path: path.join(__dirname, '../.env') });
async function testSMTP() {
    console.log('Testing SMTP Configuration...');
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
    console.log('Config:');
    console.log(`- Host: ${SMTP_HOST}`);
    console.log(`- Port: ${SMTP_PORT}`);
    console.log(`- User: ${SMTP_USER}`);
    console.log(`- From: ${SMTP_FROM}`);
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        console.error('❌ Missing SMTP credentials in .env');
        process.exit(1);
    }
    const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT) || 587,
        secure: SMTP_PORT === '465',
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
    });
    try {
        console.log('Verifying connection...');
        await transporter.verify();
        console.log('✅ SMTP connection successful!');
        // Optional: Send test email
        /*
        const info = await transporter.sendMail({
            from: SMTP_FROM || '"Workflow Pro" <no-reply@workflowpro.com>',
            to: SMTP_USER, // send to self
            subject: 'SMTP Test Email',
            text: 'If you are reading this, your SMTP settings are working correctly!',
        });
        console.log('Test email sent:', info.messageId);
        */
    }
    catch (error) {
        console.error('❌ SMTP connection failed:', error);
        process.exit(1);
    }
}
testSMTP();
