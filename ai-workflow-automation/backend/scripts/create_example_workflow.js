// Script to create an example workflow via API

const workflow = {
    id: "wf-lead-gen-demo",
    name: "🚀 High Priority Lead Processor",
    description: "Automatically routes high-value leads ($500+) to the sales channel and logs others.",
    isActive: true,
    webhookUrl: "lead-gen-webhook",
    nodes: [
        {
            id: "node-webhook",
            type: "webhook",
            data: {
                label: "Receive Lead",
                config: {
                    path: "/lead",
                    method: "POST",
                    authentication: "none",
                    responseMode: "immediately"
                }
            },
            position: { x: 100, y: 200 }
        },
        {
            id: "node-condition",
            type: "conditional",
            data: {
                label: "High Value?",
                config: {
                    conditionType: "simple",
                    field: "data.amount",
                    operator: "greaterThan",
                    value: 500
                }
            },
            position: { x: 400, y: 200 }
        },
        {
            id: "node-slack-alert",
            type: "slack",
            data: {
                label: "🚨 Alert Sales",
                config: {
                    operation: "sendMessage",
                    channel: "#sales",
                    message: "🚨 *HIGH PRIORITY LEAD*\n\n*Amount:* $${data.amount}\n*Email:* ${data.email}\n*Company:* ${data.company}",
                    username: "Sales Bot",
                    iconEmoji: ":moneybag:"
                }
            },
            position: { x: 700, y: 100 }
        },
        {
            id: "node-slack-log",
            type: "slack",
            data: {
                label: "ℹ️ Log Lead",
                config: {
                    operation: "sendMessage",
                    channel: "#leads-log",
                    message: "ℹ️ New Lead Received\nAmount: $${data.amount}\nEmail: ${data.email}",
                    username: "Log Bot",
                    iconEmoji: ":memo:"
                }
            },
            position: { x: 700, y: 300 }
        }
    ],
    edges: [
        {
            id: "edge-1",
            source: "node-webhook",
            target: "node-condition"
        },
        {
            id: "edge-2",
            source: "node-condition",
            target: "node-slack-alert",
            sourceHandle: "true"
        },
        {
            id: "edge-3",
            source: "node-condition",
            target: "node-slack-log",
            sourceHandle: "false"
        }
    ]
};

const http = require('http');

async function createWorkflow() {
    const data = JSON.stringify(workflow);

    const options = {
        hostname: 'localhost',
        port: 4000,
        path: '/workflows',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    console.log("Creating workflow...");

    const req = http.request(options, (res) => {
        let body = '';

        res.on('data', (chunk) => {
            body += chunk;
        });

        res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const responseData = JSON.parse(body);
                console.log("✅ Workflow created successfully!");
                console.log(`🆔 ID: ${responseData.workflowId}`);
                console.log(`🔗 Webhook URL: POST http://localhost:4000/webhook/lead`);
                console.log("\n🧪 Test with CURL:");
                console.log(`curl -X POST http://localhost:4000/webhook/lead \\
  -H "Content-Type: application/json" \\
  -d '{"email": "vip@client.com", "amount": 1000, "company": "Big Corp"}'`);
            } else {
                console.error(`❌ API Error: ${res.statusCode} ${res.statusMessage}`);
                console.error(body);
            }
        });
    });

    req.on('error', (error) => {
        console.error("❌ Failed to create workflow:", error.message);
        console.error("Make sure the backend server is running on port 4000!");
    });

    req.write(data);
    req.end();
}

createWorkflow();
