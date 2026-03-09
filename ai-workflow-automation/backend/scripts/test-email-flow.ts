import { emailDiscoveryNode } from '../src/nodes/emailDiscovery';
import { emailSendingNode } from '../src/nodes/emailSending';
import * as fs from 'fs';
import * as path from 'path';

const testEmailFlow = async () => {
    const logFile = path.join(__dirname, 'test-results.txt');
    const log = (message: string) => {
        console.log(message);
        fs.appendFileSync(logFile, message + '\n');
    };

    // Clear previous log
    if (fs.existsSync(logFile)) {
        fs.unlinkSync(logFile);
    }

    log('=== Testing Email Discovery ===');

    // Test Email Discovery
    const discoveryInput = {
        keywords: ['technology', 'startup'],
        industry: 'technology'
    };

    log('Discovery Input: ' + JSON.stringify(discoveryInput, null, 2));
    const discoveryResult = await emailDiscoveryNode.execute(discoveryInput);
    log('Discovery Result: ' + JSON.stringify(discoveryResult, null, 2));

    if (discoveryResult.status === 'error') {
        log('❌ Email Discovery failed: ' + discoveryResult.error);
        return;
    }

    log('\n=== Testing Email Sending ===');

    // Extract emails from discovery result
    const discoveredEmails = discoveryResult.data?.emails || [];
    log('Discovered Emails: ' + JSON.stringify(discoveredEmails, null, 2));
    log('Number of emails discovered: ' + discoveredEmails.length);

    // Test Email Sending with discovered emails
    const sendingInput = {
        emails: discoveredEmails,
        subject: 'Test Email from Workflow',
        body: '<h1>Hello!</h1><p>This is a test email from the workflow automation system.</p>'
    };

    log('Sending Input: ' + JSON.stringify(sendingInput, null, 2));
    const sendingResult = await emailSendingNode.execute(sendingInput);
    log('Sending Result: ' + JSON.stringify(sendingResult, null, 2));

    if (sendingResult.status === 'error') {
        log('❌ Email Sending failed: ' + sendingResult.error);
        return;
    }

    log('\n✅ Email flow test completed successfully!');
    log('\nLog file saved to: ' + logFile);
};

testEmailFlow().catch(err => {
    console.error('Test failed with error:', err);
    process.exit(1);
});
