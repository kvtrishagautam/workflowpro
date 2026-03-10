# MongoDB Compass Setup Guide for Data Visualization Workflow

## MongoDB Collections Setup

Your workflow requires these collections. Create them in MongoDB Compass under the `workflow-automation` database:

### 1. analysisresults Collection
- **Purpose**: Stores results from the Analysis Engine node
- **Schema**: 
  ```json
  {
    "datasetId": "string",
    "category": "Sales|Tasks|Attendance|Expenses|Generic",
    "workflowId": "string (optional)",
    "summaryStats": "object",
    "chartData": "object", 
    "rawRows": "array (optional)",
    "createdAt": "date",
    "updatedAt": "date"
  }
  ```

### 2. recipientgroups Collection
- **Purpose**: Stores email recipient groups
- **Schema**:
  ```json
  {
    "name": "string (unique)",
    "emails": "array of strings",
    "createdAt": "date",
    "updatedAt": "date"
  }
  ```

### 3. deliverylogs Collection
- **Purpose**: Tracks email delivery status
- **Schema**:
  ```json
  {
    "jobId": "string",
    "recipient": "string",
    "status": "sent|failed",
    "messageId": "string (optional)",
    "error": "string (optional)",
    "timestamp": "date"
  }
  ```

### 4. scheduledjobs Collection
- **Purpose**: Manages scheduled workflow jobs
- **Schema**: 
  ```json
  {
    "name": "string",
    "workflowId": "string", 
    "schedule": "string (cron format)",
    "isActive": "boolean",
    "lastRun": "date (optional)",
    "nextRun": "date (optional)",
    "createdAt": "date",
    "updatedAt": "date"
  }
  ```

### 5. discoveredemails Collection
- **Purpose**: Stores emails discovered by email discovery node
- **Schema**:
  ```json
  {
    "email": "string",
    "source": "string",
    "discoveredAt": "date"
  }
  ```

## Indexes for Performance

Create these indexes in MongoDB Compass for optimal performance:

### analysisresults Collection:
- `{ "datasetId": 1 }`
- `{ "category": 1 }`
- `{ "createdAt": -1 }`

### deliverylogs Collection:
- `{ "jobId": 1 }`

## Sample Data for Testing

You can insert sample data to test your workflow:

### Sample Analysis Result:
```json
{
  "datasetId": "test_expenses_2026",
  "category": "Expenses",
  "summaryStats": {
    "totalAmount": 125000,
    "avgAmount": 5000,
    "count": 25
  },
  "chartData": {
    "labels": ["Engineering", "Marketing", "Sales"],
    "datasets": [{
      "label": "Expenses by Department",
      "data": [45000, 35000, 45000]
    }]
  },
  "rawRows": []
}
```
