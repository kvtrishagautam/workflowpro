const fetch = require('node-fetch');

async function testEmailSending() {
    const workflow = {
        nodes: [{
            id: 'test1',
            type: 'EMAIL_SENDING',
            input: {
                to: 'ayshhha234@gmail.com',
                subject: 'Backend Test Email',
                body: 'If you receive this, the backend email sending is working!'
            }
        }],
        edges: []
    };

    try {
        const response = await fetch('http://localhost:5000/api/workflows/execute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(workflow)
        });

        const result = await response.json();
        console.log('Response:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testEmailSending();
