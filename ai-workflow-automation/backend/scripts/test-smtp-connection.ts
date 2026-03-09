import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
import * as path from 'path';

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

    } catch (error) {
        console.error('❌ SMTP connection failed:', error);
        process.exit(1);
    }
}

testSMTP();
