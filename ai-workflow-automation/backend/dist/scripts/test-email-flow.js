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
const emailDiscovery_1 = require("../src/nodes/emailDiscovery");
const emailSending_1 = require("../src/nodes/emailSending");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const testEmailFlow = async () => {
    const logFile = path.join(__dirname, 'test-results.txt');
    const log = (message) => {
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
    const discoveryResult = await emailDiscovery_1.emailDiscoveryNode.execute(discoveryInput);
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
    const sendingResult = await emailSending_1.emailSendingNode.execute(sendingInput);
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
