// Test Email Discovery and Sending Workflow
const testWorkflow = async () => {
    const workflow = {
        nodes: [
            {
                id: 'discovery1',
                type: 'EMAIL_DISCOVERY',
                input: {
                    keywords: ['technology'],
                    industry: 'technology',
                    maxEmails: 5
                }
            },
            {
                id: 'sending1',
                type: 'EMAIL_SENDING',
                input: {
                    subject: 'Test Email from WorkflowPro',
                    body: '<h1>Hello!</h1><p>This is a test email.</p>'
                }
            }
        ],
        edges: [
            {
                source: 'discovery1',
                target: 'sending1'
            }
        ]
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
        console.log('Workflow Result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
};

testWorkflow();
