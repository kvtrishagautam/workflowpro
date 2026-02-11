const mongoose = require('mongoose');
const { Workflow } = require('./src/models/Workflow');
const fs = require('fs');
const path = require('path');

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/workflow-automation';

async function importWorkflow() {
    try {
        console.log('📦 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Read the workflow JSON
        const workflowPath = path.join(__dirname, '..', 'nathans_workflow_test.json');
        console.log(`📖 Reading workflow from: ${workflowPath}`);

        const workflowData = JSON.parse(fs.readFileSync(workflowPath, 'utf-8'));

        console.log(`📝 Workflow: ${workflowData.name}`);
        console.log(`📊 Nodes: ${workflowData.nodes.length}`);
        console.log(`🔗 Edges: ${workflowData.edges.length}`);

        // Check if workflow already exists
        const existing = await Workflow.findOne({ id: workflowData.id });
        if (existing) {
            console.log('⚠️  Workflow already exists, deleting...');
            await Workflow.deleteOne({ id: workflowData.id });
        }

        // Create new workflow
        const workflow = new Workflow({
            ...workflowData,
            userId: new mongoose.Types.ObjectId(), // Dummy user ID for testing
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await workflow.save();
        console.log('✅ Workflow imported successfully!');
        console.log(`🔗 Webhook URL: http://localhost:4000${workflowData.webhookUrl}`);
        console.log(`📋 Workflow ID: ${workflow._id}`);

        console.log('\n🧪 Test the workflow with:');
        console.log(`curl -X POST http://localhost:4000${workflowData.webhookUrl} -H "Content-Type: application/json" -d '{}'`);

        await mongoose.disconnect();
        console.log('\n✅ Done!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

importWorkflow();
