import mongoose from 'mongoose';
import { AnalysisResult } from '../src/models/AnalysisResult.model';
import { RecipientGroup } from '../src/models/RecipientGroup.model';
import { DeliveryLog } from '../src/models/DeliveryLog.model';
import { DiscoveredEmail } from '../src/models/DiscoveredEmail.model';
import { ScheduledJob } from '../src/models/ScheduledJob.model';
import { connectToMongoDB } from '../src/config/mongoClient';

/**
 * MongoDB Database Initialization Script
 * This script sets up the MongoDB collections and indexes for the workflow system
 */

async function initializeDatabase() {
    try {
        console.log('🚀 Initializing MongoDB Database...\n');

        // Connect to MongoDB
        await connectToMongoDB();
        console.log('✅ Connected to MongoDB\n');

        // Create collections with indexes
        console.log('📊 Setting up collections and indexes...');

        // Analysis Results Collection
        await AnalysisResult.createIndexes();
        console.log('✅ Created indexes for analysisresults collection');

        // Recipient Groups Collection  
        await RecipientGroup.createIndexes();
        console.log('✅ Created indexes for recipientgroups collection');

        // Delivery Logs Collection
        await DeliveryLog.createIndexes();
        console.log('✅ Created indexes for deliverylogs collection');

        // Discovered Emails Collection
        await DiscoveredEmail.createIndexes();
        console.log('✅ Created indexes for discoveredemails collection');

        // Scheduled Jobs Collection
        await ScheduledJob.createIndexes();
        console.log('✅ Created indexes for scheduledjobs collection');

        // Insert sample data for testing
        console.log('\n📝 Inserting sample data...');

        // Sample Analysis Result
        await AnalysisResult.findOneAndUpdate(
            { datasetId: 'sample_expenses_2026' },
            {
                datasetId: 'sample_expenses_2026',
                category: 'Expenses',
                summaryStats: {
                    totalAmount: 125000,
                    avgAmount: 5000,
                    count: 25,
                    topCategories: ['Cloud Infrastructure', 'Software Licenses', 'Travel']
                },
                chartData: {
                    labels: ['Engineering', 'Marketing', 'Sales', 'Finance', 'HR'],
                    datasets: [{
                        label: 'Expenses by Department',
                        data: [65000, 25000, 20000, 8000, 7000],
                        backgroundColor: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6']
                    }]
                },
                rawRows: []
            },
            { upsert: true, new: true }
        );
        console.log('✅ Created sample analysis result');

        // Sample Recipient Group
        await RecipientGroup.findOneAndUpdate(
            { name: 'Demo Recipients' },
            {
                name: 'Demo Recipients',
                emails: ['demo@workflowpro.com', 'test@example.com']
            },
            { upsert: true, new: true }
        );
        console.log('✅ Created sample recipient group');

        console.log('\n🎉 Database initialization complete!');
        console.log('\n📋 Summary:');
        console.log('   - Database: workflow-automation');
        console.log('   - Collections: 5 created with proper indexes');
        console.log('   - Sample data: Inserted for testing');
        console.log('\n🔍 You can now view these collections in MongoDB Compass:');
        console.log('   Connection URI: mongodb://localhost:27017/workflow-automation');

        process.exit(0);
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        process.exit(1);
    }
}

// Show database stats
async function showDatabaseStats() {
    try {
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();

        console.log('\n📊 Current Database Status:');
        console.log(`Database: ${db.databaseName}`);
        console.log(`Collections: ${collections.length}`);

        for (const collection of collections) {
            const stats = await db.collection(collection.name).countDocuments();
            console.log(`  - ${collection.name}: ${stats} documents`);
        }
    } catch (error) {
        console.error('Error getting database stats:', error);
    }
}

// Main execution
async function main() {
    await initializeDatabase();
    await showDatabaseStats();
}

main();