import { emailDiscoveryNode } from '../src/nodes/emailDiscovery';

async function quickTest() {
    console.log('Testing Email Discovery with opensource keywords...\n');

    const result = await emailDiscoveryNode.execute({
        keywords: ['opensource'],
        industry: 'opensource',
        maxEmails: 10
    });

    console.log('\n=== RESULT ===');
    console.log('Status:', result.status);

    if (result.status === 'success') {
        const data = result.data as any;
        console.log('Emails found:', data.emails?.length || 0);
        console.log('Total scraped:', data.totalScraped);
        console.log('Unique count:', data.uniqueCount);

        if (data.emails && data.emails.length > 0) {
            console.log('\nDiscovered emails:');
            data.emails.forEach((item: any, index: number) => {
                console.log(`${index + 1}. ${item.email} (from: ${item.source_url})`);
            });
        }
    } else {
        console.log('Error:', result.error);
    }
}

quickTest().catch(console.error);
