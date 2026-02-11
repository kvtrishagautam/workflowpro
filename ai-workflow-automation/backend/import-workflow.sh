#!/bin/bash

# Nathan's Workflow Import Script
# This script imports the workflow directly into MongoDB

echo "📦 Importing Nathan's Workflow Test..."

# Check if MongoDB is running
if ! command -v mongosh &> /dev/null; then
    echo "❌ mongosh not found. Please install MongoDB Shell"
    exit 1
fi

# Path to the workflow JSON
WORKFLOW_FILE="../nathans_workflow_test.json"

if [ ! -f "$WORKFLOW_FILE" ]; then
    echo "❌ Workflow file not found: $WORKFLOW_FILE"
    exit 1
fi

echo "📖 Reading workflow from: $WORKFLOW_FILE"

# Import into MongoDB
mongosh workflow-automation --eval "
    const workflow = $(cat $WORKFLOW_FILE);
    
    // Add required fields
    workflow.userId = ObjectId();
    workflow.createdAt = new Date();
    workflow.updatedAt = new Date();
    
    // Remove existing workflow with same ID
    db.workflows.deleteOne({ id: workflow.id });
    
    // Insert new workflow
    const result = db.workflows.insertOne(workflow);
    
    print('✅ Workflow imported successfully!');
    print('📋 Workflow ID:', result.insertedId);
    print('🔗 Webhook URL: http://localhost:4000' + workflow.webhookUrl);
    print('');
    print('🧪 Test with:');
    print('curl -X POST http://localhost:4000' + workflow.webhookUrl + ' -H \"Content-Type: application/json\" -d \"{}\"');
"

echo ""
echo "✅ Done! Now test the workflow with the curl command above."
