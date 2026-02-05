
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/workflow_automation';

// Define minimal schema for insertion
const WorkflowSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String },
    nodes: Array,
    edges: Array,
    isActive: Boolean,
    isTemplate: Boolean,
    webhookUrl: String,
    executionCount: Number
}, {
    strict: false,
    timestamps: true
});

const Workflow = mongoose.models.Workflow || mongoose.model('Workflow', WorkflowSchema);

const workflow = {
    id: "wf-enterprise-demo",
    name: "🚀 Enterprise Lead Qualification",
    description: "Automated scoring and routing for new leads. Filters spam, uses AI to qualify, and routes VIPs to Slack while nurturing others via Email.",
    isActive: true,
    isTemplate: true,
    webhookUrl: "enterprise-lead-webhook",
    nodes: [
        // 1. Webhook Trigger
        {
            id: "n1",
            type: "webhook",
            data: { label: "New Lead (Webhook)", config: { path: "/lead", method: "POST", authentication: "none" } },
            position: { x: 50, y: 150 }
        },
        // 2. Filter (Spam Check)
        {
            id: "n2",
            type: "filter",
            data: {
                label: "Filter Personal Emails",
                config: {
                    conditions: [{ field: "data.email", operator: "notContains", value: "gmail.com" }]
                }
            },
            position: { x: 300, y: 150 }
        },
        // 3. OpenAI (Enrichment/Scoring)
        {
            id: "n3",
            type: "openai",
            data: {
                label: "AI Qualify Lead",
                config: {
                    operation: "chat",
                    model: "gpt-4",
                    systemPrompt: "You are a sales expert. Analyze the lead message and return a JSON object with a 'score' (0-100) and 'summary'.",
                    userPrompt: "Message: ${data.message}\nCompany: ${data.company}"
                }
            },
            position: { x: 550, y: 150 }
        },
        // 4. Conditional (Routing)
        {
            id: "n4",
            type: "conditional",
            data: {
                label: "Is VIP? (>80)",
                config: {
                    conditionType: "simple",
                    field: "data.score", // Assuming AI returns parsed JSON or we access it from result
                    operator: "greaterThan",
                    value: 80
                }
            },
            position: { x: 800, y: 150 }
        },
        // --- TRUE BRANCH (VIP) ---
        // 5. Airtable (CRM)
        {
            id: "n5",
            type: "airtable",
            data: {
                label: "Add to VIP CRM",
                config: { operation: "create", tableName: "VIP_Leads" }
            },
            position: { x: 1050, y: 50 }
        },
        // 6. Slack (Alert)
        {
            id: "n6",
            type: "slack",
            data: {
                label: "🚨 Alert Sales Team",
                config: {
                    operation: "sendMessage",
                    channel: "#social",
                    message: "🚨 *NEW VIP LEAD*\nScore: ${data.score}\nSummary: ${data.summary}"
                }
            },
            position: { x: 1300, y: 50 }
        },
        // --- FALSE BRANCH (Nurture) ---
        // 7. Email (Welcome)
        {
            id: "n7",
            type: "email",
            data: {
                label: "Send Welcome Email",
                config: {
                    to: "${data.email}",
                    subject: "Thanks for contacting us!",
                    text: "Hi there,\n\nThanks for reaching out. We will get back to you shortly."
                }
            },
            position: { x: 1050, y: 250 }
        },
        // 8. Delay (Wait)
        {
            id: "n8",
            type: "delay",
            data: {
                label: "Wait 2 Days",
                config: { delayType: "fixed", delayValue: 2, delayUnit: "days" }
            },
            position: { x: 1300, y: 250 }
        },
        // 9. Email (Follow Up)
        {
            id: "n9",
            type: "email",
            data: {
                label: "Follow Up Email",
                config: {
                    to: "${data.email}",
                    subject: "Just checking in...",
                    text: "Hi again,\n\nDid you have time to review our resources?"
                }
            },
            position: { x: 1550, y: 250 }
        }
    ],
    edges: [
        { id: "e1", source: "n1", target: "n2" }, // Webhook -> Filter
        { id: "e2", source: "n2", target: "n3" }, // Filter -> AI
        { id: "e3", source: "n3", target: "n4" }, // AI -> Conditional
        // True Path
        { id: "e4", source: "n4", target: "n5", sourceHandle: "true" }, // Cond -> Airtable
        { id: "e5", source: "n5", target: "n6" }, // Airtable -> Slack
        // False Path
        { id: "e6", source: "n4", target: "n7", sourceHandle: "false" }, // Cond -> Email 1
        { id: "e7", source: "n7", target: "n8" }, // Email 1 -> Delay
        { id: "e8", source: "n8", target: "n9" }  // Delay -> Email 2
    ]
};

async function seed() {
    try {
        console.log('Connecting to:', MONGODB_URI);
        await mongoose.connect(MONGODB_URI);
        console.log('📦 Connected to MongoDB');

        // Check if there are any users to assign ownership to (optional, or use system ID)
        // For template, we can create a dummy system user or just use a random ID
        const systemUserId = new mongoose.Types.ObjectId();

        const result = await Workflow.findOneAndUpdate(
            { id: workflow.id },
            {
                ...workflow,
                userId: systemUserId, // Assign to system
                updatedAt: new Date()
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        console.log('✅ Template workflow seeded successfully!');
        console.log('ID:', result.id);
        console.log('Is Template:', result.isTemplate);

        // Verify insertion
        const verify = await Workflow.findOne({ id: workflow.id });
        console.log('🔍 Verification Check:', !!verify ? 'Found in DB' : 'NOT FOUND IN DB');

        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seed();
