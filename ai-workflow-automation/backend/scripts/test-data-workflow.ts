import { csvReadNode } from '../src/nodes/csvRead.node';
import { dataCleanerNode } from '../src/nodes/dataCleaner.node';
import { analysisEngineNode } from '../src/nodes/analysisEngine.node';
import { mongoDbStorageNode } from '../src/nodes/mongoDbStorage.node';
import { dashboardPortalNode } from '../src/nodes/dashboardPortal.node';
import { connectToMongoDB } from '../src/config/mongoClient';

/**
 * Complete Data Visualization Workflow Test
 * This demonstrates the exact workflow you want to run:
 * CSV Read → Data Cleaner → Analysis Engine → MongoDB Storage → Dashboard
 */

const sampleExpenseData = `Report ID,Employee,Department,Category,Amount,Date,Approved,Description
EXP001,Alice Johnson,Engineering,Cloud Infrastructure,42000,2026-01-05,Yes,Monthly AWS hosting
EXP002,Bob Smith,Marketing,Advertising,25000,2026-01-08,Yes,Q1 search ads budget
EXP003,Carol White,Engineering,Software Licenses,12000,2026-01-10,Yes,Annual IDE licenses
EXP004,David Lee,Finance,Office Supplies,3200,2026-01-12,Yes,Monitors and peripherals
EXP005,Eve Martinez,HR,Recruitment,15000,2026-01-15,Yes,Premium recruiter seat
EXP006,Frank Chen,Engineering,Travel,18500,2026-01-18,Yes,Bangalore client onsite
EXP007,Grace Kim,Sales,Client Meals,4800,2026-01-20,Yes,Client dinner meeting
EXP008,Henry Patel,Engineering,Cloud Infrastructure,38000,2026-01-22,Yes,Azure ML pipeline costs
EXP009,Alice Johnson,Engineering,Training,8500,2026-01-25,Yes,Engineering upskilling
EXP010,Bob Smith,Marketing,Advertising,18000,2026-02-01,Yes,Instagram & Facebook ads`;

async function runDataVisualizationWorkflow() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║        DATA VISUALIZATION WORKFLOW TEST                   ║');
    console.log('║   CSV Read → Data Cleaner → Analysis → MongoDB → Dashboard ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    try {
        // Connect to MongoDB first
        await connectToMongoDB();
        console.log('✅ Connected to MongoDB\n');

        // STEP 1: CSV Read Node
        console.log('📊 STEP 1: Reading CSV Data...');
        const csvResult = await csvReadNode.execute({
            csvData: sampleExpenseData,
            delimiter: ','
        });

        if (csvResult.status === 'error') {
            throw new Error(`CSV Read failed: ${csvResult.error}`);
        }

        if (!csvResult.data) {
            throw new Error('CSV Read failed: No data returned');
        }

        console.log(`✅ CSV Read Complete - Loaded ${csvResult.data.length} rows\n`);

        // STEP 2: Data Cleaner Node
        console.log('🧹 STEP 2: Cleaning Data...');
        const cleanerResult = await dataCleanerNode.execute({
            data: csvResult.data,
            removeEmptyRows: true,
            trimStrings: true,
            convertToNumbers: true
        });

        if (cleanerResult.status === 'error') {
            throw new Error(`Data Cleaning failed: ${cleanerResult.error}`);
        }

        console.log(`✅ Data Cleaning Complete - ${cleanerResult.data.length} clean rows\n`);

        // STEP 3: Analysis Engine Node
        console.log('🔍 STEP 3: Running Analysis Engine...');
        const analysisResult = await analysisEngineNode.execute({
            data: cleanerResult.data,
            categories: ['Expenses'],
            datasetId: `test_workflow_${Date.now()}`
        });

        if (analysisResult.status === 'error') {
            throw new Error(`Analysis failed: ${analysisResult.error}`);
        }

        console.log('✅ Analysis Complete');
        console.log('📈 Analysis Results:');
        console.log(`   Dataset ID: ${analysisResult.data.datasetId}`);
        console.log(`   Category: ${analysisResult.data.category}`);
        console.log('   Summary Stats:', JSON.stringify(analysisResult.data.summaryStats, null, 2));
        console.log('\n');

        // STEP 4: MongoDB Storage Node
        console.log('💾 STEP 4: Storing to MongoDB...');
        const storageResult = await mongoDbStorageNode.execute({
            analysisResult: analysisResult.data
        });

        if (storageResult.status === 'error') {
            throw new Error(`MongoDB Storage failed: ${storageResult.error}`);
        }

        console.log('✅ Data stored to MongoDB successfully');
        console.log(`📝 Stored document ID: ${storageResult.data.storedId}\n`);

        // STEP 5: Dashboard Portal Node
        console.log('📊 STEP 5: Generating Dashboard...');
        const dashboardResult = await dashboardPortalNode.execute({
            datasetId: analysisResult.data.datasetId,
            category: analysisResult.data.category
        });

        if (dashboardResult.status === 'error') {
            throw new Error(`Dashboard generation failed: ${dashboardResult.error}`);
        }

        console.log('✅ Dashboard generated successfully');
        console.log(`🌐 Dashboard URL: ${dashboardResult.data.dashboardUrl}\n`);

        // Final Summary
        console.log('🎉 WORKFLOW COMPLETED SUCCESSFULLY!');
        console.log('\n📋 Workflow Summary:');
        console.log(`   1. ✅ CSV Data: ${csvResult.data.length} rows processed`);
        console.log(`   2. ✅ Data Cleaned: ${cleanerResult.data.length} rows`);
        console.log(`   3. ✅ Analysis: ${analysisResult.data.category} category`);
        console.log(`   4. ✅ MongoDB: Document ${storageResult.data.storedId} stored`);
        console.log(`   5. ✅ Dashboard: Available at ${dashboardResult.data.dashboardUrl}`);

        console.log('\n🔍 MongoDB Compass Instructions:');
        console.log('   1. Open MongoDB Compass');
        console.log('   2. Connect to: mongodb://localhost:27017/workflow-automation');
        console.log('   3. Navigate to "analysisresults" collection');
        console.log(`   4. Look for document with datasetId: "${analysisResult.data.datasetId}"`);

        process.exit(0);

    } catch (error) {
        console.error('❌ Workflow failed:', error);
        process.exit(1);
    }
}

runDataVisualizationWorkflow();