"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nodeRegistry_1 = require("../src/services/nodeRegistry");
const emailDiscovery_1 = require("../src/nodes/emailDiscovery");
const emailSending_1 = require("../src/nodes/emailSending");
async function testEmailWorkflow() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  EMAIL AUTOMATION WORKFLOW TEST');
    console.log('═══════════════════════════════════════════════════════════\n');
    // Register nodes
    console.log('[1/3] Registering nodes...');
    nodeRegistry_1.nodeRegistry.register(emailDiscovery_1.emailDiscoveryNode);
    nodeRegistry_1.nodeRegistry.register(emailSending_1.emailSendingNode);
    console.log('✅ Nodes registered\n');
    // Step 1: Execute Email Discovery Node
    console.log('[2/3] Executing Email Discovery Node...');
    console.log('─────────────────────────────────────────────────────────────');
    const discoveryInput = {
        keywords: ['technology', 'startup'],
        targetDomains: [],
        industry: 'technology'
    };
    console.log('Input:', JSON.stringify(discoveryInput, null, 2));
    const discoveryNode = nodeRegistry_1.nodeRegistry.get('EMAIL_DISCOVERY');
    if (!discoveryNode) {
        throw new Error('Email Discovery Node not found in registry');
    }
    const discoveryResult = await discoveryNode.execute(discoveryInput);
    if (discoveryResult.status === 'error') {
        console.error('❌ Discovery failed:', discoveryResult.error);
        process.exit(1);
    }
    console.log('\n✅ Discovery completed successfully!');
    console.log('Discovered emails:', JSON.stringify(discoveryResult.data, null, 2));
    console.log('');
    // Step 2: Execute Email Sending Node
    console.log('[3/3] Executing Email Sending Node...');
    console.log('─────────────────────────────────────────────────────────────');
    const emails = discoveryResult.data?.emails || [];
    if (emails.length === 0) {
        console.warn('⚠️  No emails discovered, skipping send step');
    }
    else {
        const firstEmail = emails[0].email;
        const sendingInput = {
            recipient: firstEmail,
            subject: 'Automated Outreach from WorkflowPro',
            body: `
        <html>
          <body>
            <h2>Hello!</h2>
            <p>This is an automated email sent via our WorkflowPro Email Automation Module.</p>
            <p>We discovered your email through our intelligent discovery node based on keywords: <strong>${discoveryInput.keywords.join(', ')}</strong></p>
            <p>Best regards,<br/>WorkflowPro Team</p>
          </body>
        </html>
      `
        };
        console.log('Input:', JSON.stringify({ ...sendingInput, body: '<HTML content>' }, null, 2));
        const sendingNode = nodeRegistry_1.nodeRegistry.get('EMAIL_SENDING');
        if (!sendingNode) {
            throw new Error('Email Sending Node not found in registry');
        }
        const sendingResult = await sendingNode.execute(sendingInput);
        if (sendingResult.status === 'error') {
            console.error('❌ Sending failed:', sendingResult.error);
            process.exit(1);
        }
        console.log('\n✅ Email sent successfully!');
        console.log('Send result:', JSON.stringify(sendingResult.data, null, 2));
    }
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  ✅ WORKFLOW TEST COMPLETED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('📊 Summary:');
    console.log(`  • Emails discovered: ${emails.length}`);
    console.log(`  • Emails sent: ${emails.length > 0 ? 1 : 0}`);
    console.log(`  • Success rate: 100%\n`);
    console.log('🎯 Next Steps:');
    console.log('  1. Start the backend server: npm run dev');
    console.log('  2. Test API endpoints with Postman/curl');
    console.log('  3. Integrate with frontend workflow builder');
    console.log('  4. Add real SMTP credentials for production\n');
}
// Run the test
testEmailWorkflow().catch(error => {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
});
