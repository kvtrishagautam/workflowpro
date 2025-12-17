# 🎯 Backend: Step-by-Step Getting Started

## ✨ What You Have Now

Your backend has a **complete foundation** ready for development:

```
✅ Express.js Server
✅ TypeScript Setup  
✅ Configuration System
✅ Logging & Error Handling
✅ Workflow Executor Engine
✅ Node Registry System
✅ Type Definitions
✅ Middleware
✅ Documentation
```

---

## 🚀 Getting Started (Choose Your Path)

### Path A: Windows User

```cmd
1. Open PowerShell or Command Prompt
2. cd backend
3. Run: setup.bat
4. Wait for completion
5. Run: pnpm run dev
```

### Path B: macOS/Linux User

```bash
1. Open Terminal
2. cd backend
3. Run: chmod +x setup.sh
4. Run: ./setup.sh
5. Run: pnpm run dev
```

### Path C: Manual Setup

```bash
cd backend
pnpm install                    # Install dependencies
pnpm run dev                    # Start with auto-reload
```

---

## 🔧 First Run Checklist

- [ ] Node.js 18+ installed? Check: `node --version`
- [ ] MongoDB running? Check: `docker ps | grep mongodb`
- [ ] `.env` file exists? Check: `backend/.env`
- [ ] Dependencies installed? Check: `pnpm list | head -20`
- [ ] Server started? Check: `pnpm run dev`
- [ ] No errors in console? ✅

---

## 📍 Current Server Status

Once running:

```
✅ Server: http://localhost:5000
✅ Logs: In terminal console
✅ Health: (endpoint to be created)
✅ Database: (will connect when models added)
```

---

## 🏗️ What Each File Does

### Core Files

| File | Does What |
|------|-----------|
| `src/server.ts` | Starts the Express server |
| `src/config.ts` | Reads environment variables |
| `src/middleware/auth.ts` | Handles requests & errors |
| `src/utils/logger.ts` | Logs everything that happens |
| `src/utils/errors.ts` | Formats error responses |

### Brain of the System

| File | Does What |
|------|-----------|
| `src/services/workflowExecutor.ts` | Executes workflows (nodes in order) |
| `src/services/baseService.ts` | Base class for all services |
| `src/controllers/workflows.ts` | Handles HTTP requests |

### Configuration

| File | Does What |
|------|-----------|
| `.env` | Your secret credentials |
| `package.json` | Dependencies & scripts |
| `tsconfig.json` | TypeScript settings |

---

## 🎮 Testing It Out

### Test 1: Server is Running

```bash
# In another terminal, run:
curl http://localhost:5000

# Expected: Connection refused (ok - no route yet)
# Or: HTML/error page (also ok)
```

### Test 2: Workflow Executor

Create a test file at `backend/test-executor.ts`:

```typescript
import { workflowExecutor } from './src/services/workflowExecutor';

const workflow = {
    nodes: [
        { id: 'node1', type: 'webhook', config: { url: 'test' } },
        { id: 'node2', type: 'javascript', config: { code: 'input' } }
    ],
    edges: [
        { source: 'node1', target: 'node2' }
    ]
};

workflowExecutor.executeWorkflow(workflow, { data: 'hello' })
    .then(result => console.log('Result:', result))
    .catch(err => console.error('Error:', err));
```

Run it:
```bash
npx ts-node test-executor.ts
```

---

## 📚 Documentation Map

### Quick Reference
- **5 minutes**: `BACKEND_QUICKSTART.md` ← START HERE
- **30 minutes**: `BACKEND_SETUP.md` ← Deep dive
- **Overview**: `BACKEND_IMPLEMENTATION_SUMMARY.md` ← What was built

### Planning
- **Development Plan**: `BACKEND_ROADMAP.md` ← Next 8 phases
- **This File**: `GETTING_STARTED.md` ← You are here

---

## 🎯 Next 3 Tasks (Priority Order)

### Task 1: Start the Server ⚡
```bash
pnpm run dev
# You should see: "Server is running on http://localhost:5000"
```

### Task 2: Understand the Architecture 📚
Read: `BACKEND_QUICKSTART.md` (10 min)

### Task 3: Plan Phase 2 🗺️
Pick a task from `BACKEND_ROADMAP.md` → Phase 2

---

## 🔄 Development Workflow

```
1. Make changes to TypeScript files
   ↓
2. nodemon auto-restarts server
   ↓
3. Check console for logs
   ↓
4. Test changes
   ↓
5. Iterate
```

### Useful Commands While Developing

```bash
# View logs with more detail
LOG_LEVEL=debug pnpm run dev

# Check for TypeScript errors
pnpm build

# Run linter
pnpm run lint

# Format code
pnpm run lint --fix
```

---

## 🛑 Common Issues & Fixes

### "Cannot find module 'express'"
```bash
# Fix: Install dependencies
pnpm install
```

### "Port 5000 already in use"
```bash
# Windows: Kill process
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux: Kill process
lsof -i :5000
kill -9 <PID>

# Or change port in .env: PORT=5001
```

### "MongoDB connection failed"
```bash
# Check MongoDB is running
docker ps | grep mongodb

# Start MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or update .env with correct URI
```

### TypeScript Errors
```bash
# Check tsconfig.json is present
# Try clearing cache
rm -rf node_modules/.cache
pnpm install
```

---

## 📊 Architecture at a Glance

```
     Frontend (React)
        :3000
           ↓
    ┌──────────────┐
    │   Backend    │
    │   Express    │
    │   :5000      │
    └──────┬───────┘
           ├─ Routes (to be built)
           ├─ Controllers
           │  └─ Workflows
           ├─ Services
           │  ├─ WorkflowExecutor
           │  └─ BaseService
           ├─ Middleware
           │  └─ Auth
           └─ Utils
              ├─ Logger
              └─ Errors
           ↓
    ┌──────────────┐
    │   MongoDB    │
    │   :27017     │
    └──────────────┘
```

---

## ✅ Success Indicators

Your setup is complete when:

- ✅ `pnpm run dev` starts without errors
- ✅ Console shows "Server is running on http://localhost:5000"
- ✅ No TypeScript errors
- ✅ All files in `src/` are being watched
- ✅ You can read `BACKEND_QUICKSTART.md` and understand it

---

## 🎓 Learning Order

1. **Read**: `BACKEND_QUICKSTART.md` (5 min)
2. **Understand**: Architecture from `BACKEND_SETUP.md` (10 min)
3. **Review**: `BACKEND_IMPLEMENTATION_SUMMARY.md` (10 min)
4. **Explore**: The `src/` directory structure (10 min)
5. **Plan**: Next phase from `BACKEND_ROADMAP.md` (10 min)
6. **Code**: Implement Phase 2 tasks

---

## 🚀 Phase 2 Preview

Once comfortable with Phase 1, move to Phase 2:

```typescript
// Creating a user in MongoDB
const user = new User({
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe',
    passwordHash: await bcrypt.hash('password', 10)
});
await user.save();
```

More details in: `BACKEND_ROADMAP.md`

---

## 💡 Pro Tips

**Tip 1**: Use Postman or Insomnia for API testing
- Create requests to http://localhost:5000
- Save them for later
- Test auth flows

**Tip 2**: Keep console visible while developing
- Watch for errors
- See execution logs
- Understand what's happening

**Tip 3**: Read the code
- Start with `src/server.ts`
- Follow imports to services
- Read the comments

**Tip 4**: Use VS Code debugging
- Set breakpoints
- Step through code
- Inspect variables

---

## 🤝 Getting Help

### If Something's Broken

1. **Check the logs** - Most errors are in console
2. **Read the error message** - Usually tells you what's wrong
3. **Check `.env`** - Make sure variables are set
4. **Verify dependencies** - Run `pnpm install` again
5. **Search documentation** - Check `BACKEND_SETUP.md`

### Still Stuck?

- Check `BACKEND_QUICKSTART.md` troubleshooting
- Review the error in `BACKEND_SETUP.md`
- Look at similar issues online

---

## 📋 Setup Verification

Run this checklist to verify everything works:

```bash
# 1. Node.js version
node --version          # Should be 18+

# 2. pnpm installed
pnpm --version          # Should work

# 3. Dependencies
ls node_modules | head  # Should see express, typescript, etc

# 4. .env exists
ls -la backend/.env     # File should exist

# 5. Start server
pnpm run dev            # Should say "Server is running on :5000"

# 6. Server responds (in another terminal)
curl http://localhost:5000  # Should get some response
```

---

## 🎉 You're Ready!

Everything is set up. Time to build! 🚀

**What to do now:**
1. Start the server: `pnpm run dev`
2. Read: `BACKEND_QUICKSTART.md`
3. Explore the code
4. Plan Phase 2
5. Start building!

---

## 📞 Quick Reference

```bash
# Start development
pnpm run dev

# Build for production  
pnpm build

# Check for errors
pnpm run lint

# Run tests
pnpm test

# View dependencies
pnpm list
```

---

**Happy Coding! 🚀**

Questions? Check the docs!
