const API_URL = 'http://localhost:5000/api/workflows/execute';

const debugWorkflow = async () => {
    const payload = {
        nodes: [
            {
                id: '1',
                type: 'EMAIL_DISCOVERY',
                input: { keywords: ['tech', 'startup'], industry: 'technology' }
            },
            {
                id: '2',
                type: 'EMAIL_SENDING',
                input: { subject: 'Hello', body: 'This is a test run.' }
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
