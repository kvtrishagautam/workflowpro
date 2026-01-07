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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const testRealEmailScraping = async () => {
    const logFile = path.join(__dirname, 'real-email-test.txt');
    const log = (message) => {
        console.log(message);
        fs.appendFileSync(logFile, message + '\n');
    };
    // Clear previous log
    if (fs.existsSync(logFile)) {
        fs.unlinkSync(logFile);
    }
    log('=== Testing Real Email Scraping ===\n');
    // Test 1: Scrape from specific URLs
    log('--- Test 1: Scraping specific URLs ---');
    const test1Input = {
        urls: [
            'https://www.ycombinator.com/contact',
            'https://techcrunch.com/contact/'
        ]
    };
    log('Input: ' + JSON.stringify(test1Input, null, 2));
    const test1Result = await emailDiscovery_1.emailDiscoveryNode.execute(test1Input);
    log('Result: ' + JSON.stringify(test1Result, null, 2));
    if (test1Result.status === 'success') {
        const emails = test1Result.data?.emails || [];
        log(`✅ Found ${emails.length} emails from direct URLs`);
        emails.forEach((item, index) => {
            log(`  ${index + 1}. ${item.email} (from ${item.source_url})`);
        });
    }
    else {
        log('❌ Test 1 failed: ' + test1Result.error);
    }
    log('\n--- Test 2: Scraping with keywords ---');
    const test2Input = {
        keywords: ['technology', 'startup'],
        industry: 'technology',
        maxEmails: 20
    };
    log('Input: ' + JSON.stringify(test2Input, null, 2));
    const test2Result = await emailDiscovery_1.emailDiscoveryNode.execute(test2Input);
    log('Result: ' + JSON.stringify(test2Result, null, 2));
    if (test2Result.status === 'success') {
        const emails = test2Result.data?.emails || [];
        log(`✅ Found ${emails.length} emails using keywords`);
        emails.forEach((item, index) => {
            log(`  ${index + 1}. ${item.email} (keyword: ${item.matched_keyword})`);
        });
    }
    else {
        log('❌ Test 2 failed: ' + test2Result.error);
    }
    log('\n--- Test 3: Scraping with domain filter ---');
    const test3Input = {
        urls: [
            'https://www.ycombinator.com/contact',
            'https://techcrunch.com/contact/'
        ],
        targetDomains: ['ycombinator.com']
    };
    log('Input: ' + JSON.stringify(test3Input, null, 2));
    const test3Result = await emailDiscovery_1.emailDiscoveryNode.execute(test3Input);
    log('Result: ' + JSON.stringify(test3Result, null, 2));
    if (test3Result.status === 'success') {
        const emails = test3Result.data?.emails || [];
        log(`✅ Found ${emails.length} emails matching domain filter`);
        emails.forEach((item, index) => {
            log(`  ${index + 1}. ${item.email}`);
        });
    }
    else {
        log('❌ Test 3 failed: ' + test3Result.error);
    }
    log('\n=== All tests completed ===');
    log('Log file saved to: ' + logFile);
};
testRealEmailScraping().catch(err => {
    console.error('Test failed with error:', err);
    process.exit(1);
});
