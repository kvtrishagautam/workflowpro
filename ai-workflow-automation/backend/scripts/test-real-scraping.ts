import { emailDiscoveryNode } from '../src/nodes/emailDiscovery';
import * as fs from 'fs';
import * as path from 'path';

const testRealEmailScraping = async () => {
    const logFile = path.join(__dirname, 'real-email-test.txt');
    const log = (message: string) => {
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
    const test1Result = await emailDiscoveryNode.execute(test1Input);
    log('Result: ' + JSON.stringify(test1Result, null, 2));

    if (test1Result.status === 'success') {
        const emails = test1Result.data?.emails || [];
        log(`✅ Found ${emails.length} emails from direct URLs`);
        emails.forEach((item: any, index: number) => {
            log(`  ${index + 1}. ${item.email} (from ${item.source_url})`);
        });
    } else {
        log('❌ Test 1 failed: ' + test1Result.error);
    }

    log('\n--- Test 2: Scraping with keywords ---');
    const test2Input = {
        keywords: ['technology', 'startup'],
        industry: 'technology',
        maxEmails: 20
    };

    log('Input: ' + JSON.stringify(test2Input, null, 2));
    const test2Result = await emailDiscoveryNode.execute(test2Input);
    log('Result: ' + JSON.stringify(test2Result, null, 2));

    if (test2Result.status === 'success') {
        const emails = test2Result.data?.emails || [];
        log(`✅ Found ${emails.length} emails using keywords`);
        emails.forEach((item: any, index: number) => {
            log(`  ${index + 1}. ${item.email} (keyword: ${item.matched_keyword})`);
        });
    } else {
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
    const test3Result = await emailDiscoveryNode.execute(test3Input);
    log('Result: ' + JSON.stringify(test3Result, null, 2));

    if (test3Result.status === 'success') {
        const emails = test3Result.data?.emails || [];
        log(`✅ Found ${emails.length} emails matching domain filter`);
        emails.forEach((item: any, index: number) => {
            log(`  ${index + 1}. ${item.email}`);
        });
    } else {
        log('❌ Test 3 failed: ' + test3Result.error);
    }

    log('\n=== All tests completed ===');
    log('Log file saved to: ' + logFile);
};

testRealEmailScraping().catch(err => {
    console.error('Test failed with error:', err);
    process.exit(1);
});
