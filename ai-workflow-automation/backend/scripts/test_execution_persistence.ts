
import mongoose from 'mongoose';
import { executeWorkflow } from '../src/services/executionService';
import { WorkflowExecution } from '../src/models/WorkflowExecution';
import { Workflow } from '../src/types/workflow';
import { config } from '../src/config/env';

async function runTest() {
    console.log('🧪 Starting Verification Test...');

    // Connect to DB
    try {
        await mongoose.connect(config.mongodbUri);
        console.log('✅ Connected to MongoDB');
    } catch (err) {
        console.error('❌ DB Connection failed:', err);
        process.exit(1);
    }

    // configure a simple mock workflow
    const mockWorkflow: Workflow = {
        id: 'test_wf_' + Date.now(),
        name: 'Test Workflow',
        nodes: [
            {
                id: '1',
                type: 'webhook',
                data: { label: 'Start', config: {} },
                position: { x: 0, y: 0 }
            },
            {
                id: '2',
                type: 'webhook', // Using webhook type as it's simple pass-through in executionService default
                data: { label: 'End', config: {} },
                position: { x: 200, y: 0 }
            }
        ],
        edges: [
            { id: 'e1-2', source: '1', target: '2' }
        ],
        isActive: true,
        webhookUrl: 'http://test.com',
        _id: new mongoose.Types.ObjectId() // Simulate DB ID
    };

    console.log(`📝 Created mock workflow: ${mockWorkflow.id}`);

    try {
        // Execute workflow
        console.log('▶️ Executing workflow...');
        const result = await executeWorkflow(mockWorkflow, { test: 'data' });
        console.log('✅ Execution completed:', result.status);

        // Verify Persistence
        console.log('🔍 Verifying database persistence...');
        // Wait a small amount of time for async saves if necessary (though we awaited result)

        const execution = await WorkflowExecution.findOne({
            workflowId: mockWorkflow._id
        }).sort({ startedAt: -1 });

        if (!execution) {
            console.error('❌ Validation Failed: No execution record found in MongoDB!');
            process.exit(1);
        }

        console.log(`✅ Found execution record: ${execution._id}`);
        console.log(`   Status: ${execution.status}`);
        console.log(`   Logs count: ${execution.logs.length}`);

        if (execution.status === 'completed' && execution.logs.length > 0) {
            console.log('🎉 SUCCESS: Execution flow and persistence verified!');
        } else {
            console.error('❌ Validation Failed: Status or logs mismatch');
            console.log('Details:', JSON.stringify(execution, null, 2));
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

runTest();
