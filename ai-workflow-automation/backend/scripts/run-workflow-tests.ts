
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { executeWorkflow } from '../src/services/executionService';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function runTests() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/workflow-automation');
        console.log('✅ Connected to MongoDB');

        const Workflow = mongoose.model('Workflow', new mongoose.Schema({}, { strict: false }));

        const testWorkflows = [
            { id: 'workflow_1771293759994', name: "Nathan's Sales Order Processing", payload: { name: "John Doe", email: "john@example.com", company: "ACME Corp", category: "Enterprise", budget: "50000" } },
            { id: 'workflow_1770264749045', name: "NewLeads", payload: { name: "Jane Smith", email: "jane@test.com", company: "Test Co", category: "Standard", budget: "10000" } }
        ];

        console.log('\n🚀 STARTING WORKFLOW TESTS\n');

        for (const test of testWorkflows) {
            console.log(`\n---------------------------------------------------------`);
            console.log(`📋 Testing Workflow: ${test.name} (${test.id})`);
            console.log(`---------------------------------------------------------`);

            const workflow: any = await Workflow.findOne({ id: test.id });
            if (!workflow) {
                console.log(`❌ Workflow ${test.id} not found in database.`);
                continue;
            }

            try {
                // We use a dummy context since we're running it manually
                const result = await executeWorkflow(workflow.toObject() as any, test.payload);
                console.log(`✅ Execution Successful`);
                console.log(`📊 Resulting Logs:`, JSON.stringify(result.logs, null, 2));
            } catch (err: any) {
                console.error(`❌ Execution Failed:`, err.message);
                // Even on failure, executionService usually returns logs if it went through nodes
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Test script error:', error);
        process.exit(1);
    }
}

runTests();
