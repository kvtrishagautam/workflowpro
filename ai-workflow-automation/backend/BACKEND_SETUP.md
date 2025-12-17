# Backend Setup Guide - AI Workflow Automation

## 📋 Overview

This is the backend for the AI Workflow Automation platform. It provides REST APIs for managing workflows, executing them, and handling user authentication.

### Tech Stack
- **Framework**: Express.js with TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Node Version**: 18+

## 🚀 Getting Started

### 1. Installation

```bash
# Navigate to backend directory
cd backend

# Install dependencies using pnpm (or npm)
pnpm install
```

### 2. Environment Configuration

Create a `.env` file in the `backend` directory (or copy from `.env.example`):

```bash
# Copy example to .env
cp .env.example .env

# Edit .env with your configuration
```

**Key environment variables:**

```env
# Server
NODE_ENV=development
PORT=5000
LOG_LEVEL=info

# Database
MONGODB_URI=mongodb://localhost:27017/workflow_automation

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 3. Database Setup

#### Option A: Local MongoDB

```bash
# Install MongoDB locally or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

#### Option B: MongoDB Atlas (Cloud)

1. Create account at [mongodb.com/cloud](https://www.mongodb.com/cloud)
2. Create a cluster and get connection string
3. Update `MONGODB_URI` in `.env`

### 4. Start Development Server

```bash
# Using nodemon (auto-restart on changes)
pnpm run dev

# Or start normally
pnpm start

# Server runs at http://localhost:5000
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── server.ts              # Express app entry point
│   ├── config.ts              # Configuration management
│   ├── controllers/           # Request handlers
│   │   └── workflows.ts
│   ├── services/              # Business logic
│   │   ├── baseService.ts
│   │   ├── workflowExecutor.ts
│   │   └── executor.ts
│   ├── models/                # Data models
│   │   └── workflow.ts
│   ├── middleware/            # Express middleware
│   │   └── auth.ts
│   ├── utils/                 # Helper functions
│   │   ├── logger.ts
│   │   └── errors.ts
│   ├── types/                 # TypeScript types
│   │   ├── index.ts
│   │   └── config.ts
│   └── nodes/                 # Node implementations
│       └── baseNode.ts
├── tests/                     # Test files
├── package.json
├── tsconfig.json
├── .env                       # Environment variables
└── .env.example              # Environment template
```

## 🏗️ Architecture Overview

### Core Components

**1. Workflow Executor** (`services/workflowExecutor.ts`)
- Executes workflow definitions
- Manages node execution order
- Handles node type registration
- Supports custom node types

**2. Node System**
- **Webhook Node**: Receive data
- **JavaScript Node**: Execute custom code
- **Slack Node**: Send Slack messages
- **HTTP Node**: Make HTTP requests
- **Conditional Node**: Branching logic

**3. Service Layer**
- `BaseService`: Base class for all services
- Centralized logging and error handling
- Reusable patterns

**4. API Layer**
- Controllers handle HTTP requests
- Middleware for auth and error handling
- Type-safe responses

## 📡 API Endpoints

### Authentication (TODO)
```
POST   /api/auth/signup         # Register new user
POST   /api/auth/login          # Login user
POST   /api/auth/refresh        # Refresh JWT token
POST   /api/auth/logout         # Logout
```

### Workflows
```
GET    /api/workflows           # Get all workflows
GET    /api/workflows/:id       # Get workflow by ID
POST   /api/workflows           # Create new workflow
PUT    /api/workflows/:id       # Update workflow
DELETE /api/workflows/:id       # Delete workflow
POST   /api/workflows/:id/execute  # Execute workflow
GET    /api/workflows/:id/executions  # Get execution history
```

### Execution Results
```
GET    /api/executions/:id      # Get execution details
GET    /api/executions/:id/logs # Get execution logs
```

## 🔄 Workflow Execution Flow

```
1. User sends workflow definition (nodes + edges)
   ↓
2. WorkflowExecutor validates structure
   ↓
3. Topological sort determines execution order
   ↓
4. Nodes execute sequentially (or parallel if configured)
   ↓
5. Each node output feeds into connected nodes
   ↓
6. Results collected and returned
   ↓
7. Execution logged for history
```

## 📝 Creating Custom Nodes

### Example: Create a Custom Node

```typescript
// In services/workflowExecutor.ts
workflowExecutor.registerNodeType('myCustomNode', async (context) => {
    const { input, config } = context;
    
    // Process data
    const result = {
        processed: true,
        data: input,
        config: config
    };
    
    return result;
});
```

### Node Context Structure

```typescript
interface NodeExecutionContext {
    nodeId: string;           // Unique node identifier
    nodeType: string;         // Type of node (e.g., 'slack', 'http')
    input: Record<string, any>;  // Data from connected nodes
    config: Record<string, any>; // Node configuration
    previousResults: Record<string, any>; // All previous node results
}
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# With coverage
pnpm test -- --coverage
```

## 🔒 Security Considerations

1. **JWT Secret**: Use strong, random secret in production
2. **CORS**: Configure allowed origins
3. **Input Validation**: Use Joi for request validation
4. **Rate Limiting**: Consider adding rate limiting middleware
5. **API Keys**: Validate API keys for service integrations
6. **Code Execution**: Sandbox JavaScript node execution

## 📊 Database Schema (to be implemented)

### Workflows Collection
```json
{
    "_id": "workflow_1",
    "userId": "user_1",
    "name": "My Workflow",
    "description": "Description",
    "nodes": [...],
    "edges": [...],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "isActive": true
}
```

### Executions Collection
```json
{
    "_id": "exec_1",
    "workflowId": "workflow_1",
    "userId": "user_1",
    "status": "completed",
    "results": {...},
    "error": null,
    "startedAt": "2024-01-01T00:00:00Z",
    "completedAt": "2024-01-01T00:01:00Z"
}
```

## 🐛 Debugging

### Enable Debug Logging

```bash
# Set log level in .env
LOG_LEVEL=debug

# Or pass at runtime
LOG_LEVEL=debug pnpm run dev
```

### View Logs

Logs are printed to console. In production, consider:
- Logging to file
- Using centralized logging service (ELK, Datadog)
- Monitoring execution metrics

## 📦 Deployment

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --prod

COPY . .
RUN pnpm build

EXPOSE 5000
CMD ["node", "dist/server.js"]
```

### Environment Variables for Production

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/workflow_automation
JWT_SECRET=<use-strong-random-secret>
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=warn
```

## 🔗 Integration Points

The backend integrates with:

1. **Frontend** (React)
   - REST API for workflow management
   - WebSocket for real-time updates (future)

2. **External Services**
   - Slack API
   - GitHub API
   - OpenAI API
   - Custom webhooks

3. **Database**
   - MongoDB for persistence
   - Redis for caching (optional)

## 📚 Next Steps

1. ✅ Set up development environment
2. ⬜ Implement database models and schemas
3. ⬜ Create authentication endpoints
4. ⬜ Implement workflow API endpoints
5. ⬜ Add external service integrations
6. ⬜ Set up WebSocket for real-time updates
7. ⬜ Add comprehensive error handling
8. ⬜ Write unit and integration tests
9. ⬜ Deploy to production

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/feature-name`
2. Make changes and test
3. Commit: `git commit -am 'Add feature'`
4. Push: `git push origin feature/feature-name`
5. Create Pull Request

## 📞 Support

For questions or issues:
- Check existing issues
- Create new issue with details
- Contact team lead

## 📄 License

MIT License - See LICENSE file
