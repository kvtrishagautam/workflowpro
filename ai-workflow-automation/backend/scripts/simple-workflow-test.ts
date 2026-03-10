import { csvReadNode } from '../src/nodes/csvRead.node';
import { dataCleanerNode } from '../src/nodes/dataCleaner.node';
import { analysisEngineNode } from '../src/nodes/analysisEngine.node';
import { connectToMongoDB } from '../src/config/mongoClient';

/**
 * Simplified Data Visualization Workflow Test
 * CSV Read → Data Cleaner → Analysis Engine → MongoDB Storage
 */

const sampleExpenseData = `Report ID,Employee,Department,Category,Amount,Date,Approved,Description
EXP001,Alice Johnson,Engineering,Cloud Infrastructure,42000,2026-01-05,Yes,Monthly AWS hosting
EXP002,Bob Smith,Marketing,Advertising,25000,2026-01-08,Yes,Q1 search ads budget
EXP003,Carol White,Engineering,Software Licenses,12000,2026-01-10,Yes,Annual IDE licenses
EXP004,David Lee,Finance,Office Supplies,3200,2026-01-12,Yes,Monitors and peripherals
EXP005,Eve Martinez,HR,Recruitment,15000,2026-01-15,Yes,Premium recruiter seat`;

async function runWorkflowTest() {
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║        SIMPLIFIED DATA WORKFLOW TEST              ║');
    console.log('║   CSV Read → Data Cleaner → Analysis → MongoDB    ║');
    console.log('╚════════════════════════════════════════════════════╝\n');

    try {
        // Connect to MongoDB
        await connectToMongoDB();
        console.log('✅ Connected to MongoDB\n');

        // STEP 1: CSV Read Node
        console.log('📊 STEP 1: Reading CSV Data...');
        const csvResult = await csvReadNode.execute({
            csvData: sampleExpenseData,
            delimiter: ','
        });

        if (csvResult.status === 'error') {
            console.error('❌ CSV Read failed:', csvResult.error);
            return;
        }

        console.log('✅ CSV Read Complete');
        console.log(`   Loaded ${csvResult.data?.length || 0} rows\n`);

        // STEP 2: Data Cleaner Node
        console.log('🧹 STEP 2: Cleaning Data...');
        const cleanerResult = await dataCleanerNode.execute({
            rows: csvResult.data || [],
            removeEmptyRows: true,
            trimStrings: true,
            convertToNumbers: true
        });

        if (cleanerResult.status === 'error') {
            console.error('❌ Data Cleaning failed:', cleanerResult.error);
            return;
        }

        console.log('✅ Data Cleaning Complete');
        console.log(`   Processed ${cleanerResult.data?.length || 0} clean rows\n`);

        // STEP 3: Analysis Engine Node
        console.log('🔍 STEP 3: Running Analysis Engine...');
        const analysisResult = await analysisEngineNode.execute({
            data: cleanerResult.data || [],
            categories: ['Expenses'],
            datasetId: `workflow_test_${Date.now()}`
        });

        if (analysisResult.status === 'error') {
            console.error('❌ Analysis failed:', analysisResult.error);
            return;
        }

        console.log('✅ Analysis Complete');
        if (analysisResult.data) {
            console.log('📈 Analysis Results:');
            console.log(`   Dataset ID: ${analysisResult.data.datasetId}`);
            console.log(`   Category: ${analysisResult.data.category}`);
            console.log('   Summary Stats:', JSON.stringify(analysisResult.data.summaryStats, null, 2));
        }

        console.log('\n🎉 WORKFLOW TEST COMPLETED SUCCESSFULLY!');
        console.log('\n📋 Next Steps:');
        console.log('   1. Open MongoDB Compass');
        console.log('   2. Connect to: mongodb://localhost:27017/workflow-automation');
        console.log('   3. Navigate to "analysisresults" collection');
        console.log(`   4. Look for document with datasetId: "${analysisResult.data?.datasetId}"`);

        console.log('\n🔗 To test the complete workflow including dashboard:');
        console.log('   Run: npm run dev');
        console.log('   Then visit: http://localhost:5000/dashboard');

        process.exit(0);

    } catch (error) {
        console.error('❌ Workflow test failed:', error);
        process.exit(1);
    }
}

runWorkflowTest();