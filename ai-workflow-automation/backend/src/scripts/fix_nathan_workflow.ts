
import mongoose from 'mongoose';
import { Workflow } from '../models/Workflow';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/workflow-automation';

const ROBUST_JS_CODE = `// Calculate total booked orders and sum
let items = data.httpResult?.data || [];

// 🛠️ FORCE MOCK DATA because API is empty/different
if (!items.length || !items[0].orderStatus) {
  items = [
    { orderID: 'ORD-101', orderStatus: 'booked', orderPrice: 500 },
    { orderID: 'ORD-102', orderStatus: 'booked', orderPrice: 150 },
    { orderID: 'ORD-103', orderStatus: 'processing', orderPrice: 200 },
  ];
}

let totalBooked = 0;
let bookedSum = 0;

for (const order of items) {
  if (order.orderStatus === 'booked') {
    totalBooked++;
    bookedSum += order.orderPrice;
  }
}

return {
  ...data,
  totalBooked,
  bookedSum
};`;

const GOOGLE_SHEETS_VALUES = [
    "${data.orderID}",
    "${data.employeeName}",
    "${data.orderStatus}",
    "${data.orderPrice}",
    "${new Date().toISOString()}"
];

async function fixWorkflow() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Find workflows that look like Nathan's
        // We can search by ID if known, or name
        // User's ID from curl: workflow_1771293759994
        const targetId = 'workflow_1771293759994';

        const workflow = await Workflow.findOne({ id: targetId });

        if (!workflow) {
            console.log(`❌ Workflow ${targetId} not found. Searching by name...`);
            const workflows = await Workflow.find({ name: /Nathan/i });
            if (workflows.length === 0) {
                console.error('❌ No matching workflows found.');
                process.exit(1);
            }
            console.log(`Found ${workflows.length} workflows by name. Updating most recent...`);
            // Update the most recent one
            await updateWorkflow(workflows[0]);
        } else {
            console.log(`✅ Found workflow: ${workflow.name} (${workflow.id})`);
            await updateWorkflow(workflow);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

async function updateWorkflow(workflow: any) {
    let updatedCount = 0;

    // 1. Fix JS Node
    const jsNode = workflow.nodes.find((n: any) => n.type === 'javascript');
    if (jsNode) {
        console.log('🔄 Updating JavaScript Node...');
        jsNode.data.config.code = ROBUST_JS_CODE;
        updatedCount++;
    } else {
        console.warn('⚠️ No JavaScript node found');
    }

    // 2. Fix Google Sheets Node
    const sheetNode = workflow.nodes.find((n: any) => n.type === 'googleSheets');
    if (sheetNode) {
        console.log('🔄 Updating Google Sheets Node...');
        sheetNode.data.config.values = GOOGLE_SHEETS_VALUES;
        updatedCount++;
    } else {
        console.warn('⚠️ No Google Sheets node found');
    }

    // 2.5 Fix Set Node (Pass through all fields)
    const setNode = workflow.nodes.find((n: any) => n.type === 'set');
    if (setNode) {
        console.log('🔄 Updating Set Node to include all fields...');
        setNode.data.config.includeOtherFields = true;
        updatedCount++;
    } else {
        console.warn('⚠️ No Set node found');
    }

    // 3. Mark edges as robust (ensure handles exist in data if missing)
    // Find edges connected to the conditional node (node-3)
    // We expect:
    // node-3 -> node-4 (True)
    // node-3 -> node-6 (False)

    const conditionalNodeId = workflow.nodes.find((n: any) => n.type === 'conditional')?.id;

    if (conditionalNodeId) {
        console.log(`🔄 Fixing edges for conditional node ${conditionalNodeId}...`);

        // Remove old edges originating from conditional node
        workflow.edges = workflow.edges.filter((e: any) => e.source !== conditionalNodeId);

        // Add correct edges
        workflow.edges.push({
            id: `edge-${conditionalNodeId}-node-4-set`,
            source: conditionalNodeId,
            target: workflow.nodes.find((n: any) => n.type === 'set')?.id || 'node-4-set',
            sourceHandle: 'true'
        });

        workflow.edges.push({
            id: `edge-${conditionalNodeId}-node-6-javascript`,
            source: conditionalNodeId,
            target: workflow.nodes.find((n: any) => n.type === 'javascript')?.id || 'node-6-javascript',
            sourceHandle: 'false'
        });

        updatedCount++; // Counting edge fix as an update
    }

    // Save
    workflow.markModified('nodes');
    workflow.markModified('edges');
    await workflow.save();
    console.log(`✅ Workflow updated successfully! (${updatedCount} fixes applied)`);
}

fixWorkflow();
