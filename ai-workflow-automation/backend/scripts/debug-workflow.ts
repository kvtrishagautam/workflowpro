const API_URL = 'http://localhost:5000/api/workflows/execute';

const debugWorkflow = async () => {
    const payload = {
        nodes: [
            {
                id: '1',
                type: 'EMAIL_DISCOVERY',
                input: {
                    urls: [
                        'https://arstechnica.com/contact-us/',
                        'https://www.wired.com/about/contact/'
                    ],
                    keywords: ['technology'],
                    industry: 'technology',
                    maxEmails: 10
                }
            },
            {
                id: '2',
                type: 'EMAIL_SENDING',
                input: {
                    subject: 'Hello from Workflow Pro',
                    body: '<h1>Greetings!</h1><p>This is a test email from our automated workflow system.</p><p>We discovered your email through our intelligent scraping system.</p>'
                }
            }
        ],
        edges: [
            { source: '1', target: '2', id: 'e1-2' }
        ]
    };

    try {
        console.log('Sending workflow execution request...');
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log('Execution Result:', JSON.stringify(data, null, 2));
    } catch (error: any) {
        console.error('Request Error:', error.message);
    }
};

debugWorkflow();
