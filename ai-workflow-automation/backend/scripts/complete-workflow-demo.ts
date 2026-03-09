import { emailDiscoveryNode } from '../src/nodes/emailDiscovery';
import { emailSendingNode } from '../src/nodes/emailSending';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Complete End-to-End Email Workflow Demo
 * This demonstrates:
 * 1. Discovering real emails from websites
 * 2. Sending emails to discovered addresses
 */

const runCompleteWorkflow = async () => {
    const logFile = path.join(__dirname, 'workflow-demo.txt');
    const log = (message: string) => {
        console.log(message);
        fs.appendFileSync(logFile, message + '\n');
    };

    // Clear previous log
    if (fs.existsSync(logFile)) {
        fs.unlinkSync(logFile);
    }

    log('╔════════════════════════════════════════════════════════════╗');
    log('║     COMPLETE EMAIL WORKFLOW DEMONSTRATION                  ║');
    log('╚════════════════════════════════════════════════════════════╝\n');

    // ========== STEP 1: EMAIL DISCOVERY ==========
    log('📧 STEP 1: Discovering Emails from Websites\n');
    log('Target URLs:');
    log('  - https://arstechnica.com/contact-us/');
    log('  - https://www.wired.com/about/contact/\n');

    const discoveryInput = {
        urls: [
            'https://arstechnica.com/contact-us/',
            'https://www.wired.com/about/contact/'
        ],
        keywords: ['technology'],
        industry: 'technology',
        maxEmails: 10
    };

    log('Starting email discovery...');
    const discoveryResult = await emailDiscoveryNode.execute(discoveryInput);

    if (discoveryResult.status === 'error') {
        log(`❌ Email Discovery FAILED: ${discoveryResult.error}`);
        return;
    }

    const discoveredEmails = discoveryResult.data?.emails || [];
    log(`✅ Discovery Complete!\n`);
    log(`Results:`);
    log(`  - Total scraped: ${discoveryResult.data?.totalScraped || 0}`);
    log(`  - Unique emails: ${discoveryResult.data?.uniqueCount || 0}`);
    log(`  - Returned: ${discoveryResult.data?.returnedCount || 0}\n`);

    if (discoveredEmails.length === 0) {
        log('⚠️  No emails found. This might happen if:');
        log('   - The websites don\'t have visible emails in HTML');
        log('   - The sites are blocking automated requests');
        log('   - The emails are rendered via JavaScript\n');
        log('Try different URLs or check the sites manually.');
        return;
    }

    log('Discovered Emails:');
    discoveredEmails.forEach((item: any, index: number) => {
        log(`  ${index + 1}. ${item.email}`);
        log(`     Source: ${item.source_url}`);
        log(`     Confidence: ${(item.confidence_score * 100).toFixed(0)}%`);
        log(`     Keyword: ${item.matched_keyword || 'N/A'}\n`);
    });

    // ========== STEP 2: EMAIL SENDING ==========
    log('\n📨 STEP 2: Sending Emails to Discovered Addresses\n');

    const sendingInput = {
        emails: discoveredEmails,
        subject: 'Hello from Workflow Pro - Automated Email',
        body: `
            <html>
                <body style="font-family: Arial, sans-serif; padding: 20px;">
                    <h1 style="color: #2563eb;">Greetings from Workflow Pro!</h1>
                    <p>This is an automated email sent through our intelligent workflow system.</p>
                    <p>Your email was discovered through our web scraping technology.</p>
                    <hr style="margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">
                        This is a demonstration email. In production, you would customize this content.
                    </p>
                </body>
            </html>
        `
    };

    log(`Preparing to send emails to ${discoveredEmails.length} recipient(s)...`);
    log(`Subject: "${sendingInput.subject}"\n`);

    const sendingResult = await emailSendingNode.execute(sendingInput);

    if (sendingResult.status === 'error') {
        log(`❌ Email Sending FAILED: ${sendingResult.error}`);
        return;
    }

    log(`✅ Sending Complete!\n`);
    log(`Results:`);
    log(`  - Emails sent: ${sendingResult.data?.sentCount || 0}`);
    log(`  - Status: ${sendingResult.data?.status || 'unknown'}\n`);

    if (sendingResult.data?.results) {
        log('Email Details:');
        sendingResult.data.results.forEach((result: any, index: number) => {
            log(`  ${index + 1}. Message ID: ${result.messageId}`);
            if (result.accepted && result.accepted.length > 0) {
                log(`     Accepted: ${result.accepted.join(', ')}`);
            }
            if (result.rejected && result.rejected.length > 0) {
                log(`     Rejected: ${result.rejected.join(', ')}`);
            }
        });
    }

    log('\n╔════════════════════════════════════════════════════════════╗');
    log('║     WORKFLOW COMPLETED SUCCESSFULLY! 🎉                    ║');
    log('╚════════════════════════════════════════════════════════════╝\n');

    log('📝 Summary:');
    log(`   1. Scraped ${discoveryResult.data?.totalScraped || 0} emails from ${discoveryInput.urls.length} websites`);
    log(`   2. Filtered to ${discoveryResult.data?.uniqueCount || 0} unique valid emails`);
    log(`   3. Sent ${sendingResult.data?.sentCount || 0} emails successfully\n`);

    log('💡 Next Steps:');
    log('   - Customize the email template in the sending node');
    log('   - Add more URLs to discover more emails');
    log('   - Configure SMTP settings for real email delivery');
    log('   - Integrate with the frontend for a complete UI\n');

    log(`Log file saved to: ${logFile}`);
};

// Run the workflow
runCompleteWorkflow().catch(err => {
    console.error('❌ Workflow failed with error:', err);
    process.exit(1);
});
