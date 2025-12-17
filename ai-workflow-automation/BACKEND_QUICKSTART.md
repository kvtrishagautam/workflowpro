# 🚀 Backend Quick Start Guide

## 5-Minute Setup

### Step 1: Install Dependencies

**On Windows:**
```cmd
cd backend
setup.bat
```

**On macOS/Linux:**
```bash
cd backend
chmod +x setup.sh
./setup.sh
```

**Or manually:**
```bash
cd backend
pnpm install
```

### Step 2: Configure Environment

1. Open `backend/.env`
2. Update these essential variables:

```env
# Server
NODE_ENV=development
PORT=5000

# Database (use local or Atlas)
MONGODB_URI=mongodb://localhost:27017/workflow_automation

# JWT (change in production!)
JWT_SECRET=dev-secret-key-change-in-production
CORS_ORIGIN=http://localhost:3000
```

### Step 3: Start MongoDB

**Using Docker (Recommended):**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**Or install locally** from [mongodb.com/try/download](https://www.mongodb.com/try/download/community)

### Step 4: Start Backend

```bash
# Development mode (auto-restart on changes)
pnpm run dev

# Or production mode
pnpm start
```

✅ Server running at: **http://localhost:5000**

---

## 📊 Current Implementation Status

### ✅ Completed Components

1. **Config System** (`src/config.ts`)
   - Environment variable management
   - Database configuration
   - JWT settings
   - Logging configuration

2. **Logging** (`src/utils/logger.ts`)
   - Structured logging with timestamps
   - Multiple log levels (debug, info, warn, error)
   - Development vs production modes

3. **Error Handling** (`src/utils/errors.ts`)
   - Custom error classes
   - Standardized error responses
   - Global error handler

4. **Workflow Executor** (`src/services/workflowExecutor.ts`)
   - Node registration system
   - Topological sorting for execution order
   - Built-in node types:
     - Webhook
     - JavaScript
     - Slack
     - HTTP
     - Conditional
   - Input/output mapping between nodes

5. **Base Service** (`src/services/baseService.ts`)
   - Centralized logging
   - Error handling patterns
   - Reusable service base

6. **Middleware** (`src/middleware/auth.ts`)
   - Authentication handler (JWT ready)
   - Error handler
   - Async wrapper for cleaner code

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
│              http://localhost:3000                           │
└────────────────────────────┬────────────────────────────────┘
                             │ REST API
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend (Express)                           │
│              http://localhost:5000                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────┐   ┌──────────────┐  │
│  │ Controllers  │      │  Middleware  │   │  Services    │  │
│  │              │      │              │   │              │  │
│  │ • Workflows  │─────▶│ • Auth       │──▶│ • Executor   │  │
│  │ • Auth       │      │ • Logger     │   │ • Base       │  │
│  │ • Execution  │      │ • Error      │   │ • Workflow   │  │
│  └──────────────┘      └──────────────┘   └──────────────┘  │
│                                                    │          │
│                                                    ▼          │
│                                            ┌──────────────┐  │
│                                            │   Models     │  │
│                                            │              │  │
│                                            │ • Workflow   │  │
│                                            │ • User       │  │
│                                            │ • Execution  │  │
│                                            └──────────────┘  │
└────────────────────┬──────────────────────────────────────────┘
                     │ Database Driver
                     ▼
        ┌─────────────────────────────┐
        │   MongoDB                   │
        │   Database                  │
        │   Port: 27017               │
        └─────────────────────────────┘
```

---

## 📡 Example API Usage

### Execute a Workflow

```javascript
// Create workflow
const workflow = {
    nodes: [
        { id: 'node1', type: 'webhook', config: { url: 'https://api.example.com' } },
        { id: 'node2', type: 'javascript', config: { code: 'input * 2' } },
        { id: 'node3', type: 'slack', config: { channel: '#notifications' } }
    ],
    edges: [
        { source: 'node1', target: 'node2' },
        { source: 'node2', target: 'node3' }
    ]
};

// POST /api/workflows/execute
// Returns: { status: 'completed', results: {...} }
```

---

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -i :5000
kill -9 <PID>
```

### MongoDB Connection Failed
```bash
# Check MongoDB is running
# Windows: Services app → MongoDB
# macOS/Linux: ps aux | grep mongod

# Or use Docker
docker ps | grep mongodb
```

### Dependencies Won't Install
```bash
# Clear cache and reinstall
pnpm store prune
rm -rf node_modules
pnpm install
```

---

## 📚 Key Files to Know

| File | Purpose |
|------|---------|
| `src/server.ts` | Express app entry point |
| `src/config.ts` | Environment configuration |
| `src/services/workflowExecutor.ts` | Core workflow engine |
| `src/utils/logger.ts` | Logging utility |
| `src/utils/errors.ts` | Error handling |
| `src/middleware/auth.ts` | Authentication |
| `.env` | Local environment variables |
| `package.json` | Dependencies & scripts |

---

## 🎯 Next Development Tasks

1. **Database Models** - Create Mongoose schemas for workflows, users, executions
2. **Authentication** - Implement JWT signup/login endpoints
3. **API Endpoints** - Build RESTful API for workflow CRUD operations
4. **Node Implementations** - Integrate real APIs (Slack, GitHub, etc.)
5. **Error Handling** - Add comprehensive validation and error messages
6. **Testing** - Write unit and integration tests
7. **Deployment** - Dockerize and deploy to cloud

---

## 📖 Useful Commands

```bash
# Development
pnpm run dev              # Start with auto-reload

# Production
pnpm start                # Start server
pnpm build                # Compile TypeScript

# Testing & Quality
pnpm test                 # Run tests
pnpm test:watch           # Watch mode
pnpm run lint             # Run ESLint

# Database
# See: https://docs.mongodb.com/manual/installation/
```

---

## 🤔 Common Questions

**Q: How do I add a new node type?**  
A: Register it in `WorkflowExecutor.initializeNodeRegistry()` or call `workflowExecutor.registerNodeType('name', executor)`

**Q: How do nodes communicate?**  
A: Output from one node becomes input to connected nodes. Handled by `gatherNodeInputs()`

**Q: How is execution order determined?**  
A: Topological sort of the workflow graph ensures dependencies are respected

**Q: Can I run workflows in parallel?**  
A: Currently sequential. Parallel execution would require async node handling (future feature)

---

## 🔗 Resources

- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [JWT.io](https://jwt.io/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

## ✨ Let's Build! 🚀

Your backend is ready for development. Start by implementing database models and API endpoints!

Got questions? Check BACKEND_SETUP.md for detailed documentation.
