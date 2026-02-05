
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/workflow-automation';

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
    id: "wf-simple-demo",
    name: "📋 Simple Lead Notification",
    description: "5-node workflow: New lead webhook → Filter corporate emails → Set welcome flag → Notify on Slack",
    isActive: true,
    isTemplate: true,
    webhookUrl: "simple-lead-webhook",
    nodes: [
        // 1. Webhook Trigger
        {
            id: "n1",
            type: "webhook",
            data: {
                label: "New Lead",
                config: {
                    path: "/simple-lead",
                    method: "POST",
                    authentication: "none"
                }
            },
            position: { x: 100, y: 150 }
        },
        // 2. Filter Node (Check if corporate email)
        {
            id: "n2",
            type: "filter",
            data: {
                label: "Corporate Email Only",
                config: {
                    mode: "keep",
                    conditions: [
                        { field: "email", operator: "notContains", value: "gmail.com" },
                        { field: "email", operator: "notContains", value: "yahoo.com" }
                    ]
                }
            },
            position: { x: 400, y: 150 }
        },
        // 3. Set Node (Add metadata)
        {
            id: "n3",
            type: "set",
            data: {
                label: "Tag as Qualified",
                config: {
                    fields: [
                        { name: "status", value: "qualified" },
                        { name: "priority", value: "high" }
                    ]
                }
            },
            position: { x: 700, y: 150 }
        },
        // 4. Conditional Node (Check priority)
        {
            id: "n4",
            type: "conditional",
            data: {
                label: "Is High Priority?",
                config: {
                    conditionType: "simple",
                    field: "priority",
                    operator: "equals",
                    value: "high"
                }
            },
            position: { x: 1000, y: 150 }
        },
        // 5. Slack Notification (TRUE branch)
        {
            id: "n5",
            type: "slack",
            data: {
                label: "Notify Team",
                config: {
                    channel: "#social",
                    message: "🔔 New high-priority lead: ${email}"
                }
            },
            position: { x: 1300, y: 50 }
        }
    ],
    edges: [
        { id: "e1", source: "n1", target: "n2" },
        { id: "e2", source: "n2", target: "n3" },
        { id: "e3", source: "n3", target: "n4" },
        { id: "e4", source: "n4", target: "n5", sourceHandle: "true" }
    ]
};

async function seed() {
    try {
        console.log('Connecting to:', MONGODB_URI);
        await mongoose.connect(MONGODB_URI);
        console.log('📦 Connected to MongoDB');

        const systemUserId = new mongoose.Types.ObjectId();

        const result = await Workflow.findOneAndUpdate(
            { id: workflow.id },
            {
                ...workflow,
                userId: systemUserId,
                updatedAt: new Date()
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        console.log('✅ Simple workflow seeded successfully!');
        console.log('ID:', result.id);
        console.log('Name:', result.name);
        console.log('Nodes:', result.nodes.length);

        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seed();
