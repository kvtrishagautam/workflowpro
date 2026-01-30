# WorkflowPro - Visual Automation Platform

A modern, open-source visual workflow automation platform built with React and TypeScript. Design, build, and deploy automated workflows with an intuitive drag-and-drop interface.

## ✨ Features

- **Visual Workflow Builder**: Drag-and-drop interface for creating complex automation workflows
- **16+ Node Types**: HTTP, JavaScript, Slack, Discord, Email, Telegram, OpenAI, and more
- **Real-time Canvas**: Interactive canvas with zoom, pan, and connection management
- **Modern UI**: Beautiful, responsive design with glassmorphism effects
- **TypeScript**: Fully typed codebase for better developer experience
- **Production Ready**: All core nodes fully implemented with real functionality

## 🎉 Latest Updates

### Full Node Implementation (January 2026)
- ✅ **16 nodes fully implemented** with working functionality
- ✅ **HTTP Request** node with full REST API support
- ✅ **JavaScript** node for custom code execution
- ✅ **Set, Filter, Merge** nodes for data transformation
- ✅ **Communication nodes** (Slack, Discord, Email, Telegram, WhatsApp)
- ✅ **AI integration** (OpenAI support)
- ✅ **3 test workflows** ready to use
- ✅ **Complete documentation** and quick start guide

**📖 See [QUICKSTART.md](./QUICKSTART.md) for testing guide**
**📚 See [NODE_IMPLEMENTATIONS.md](./NODE_IMPLEMENTATIONS.md) for detailed docs**

## 🚀 Quick Start

### Prerequisites

- Node.js 14+ and npm

### Installation

```bash
# Install dependencies
cd ai-workflow-automation/frontend
npm install

# Start development server
npm start
```

The application will open at `http://localhost:3000`

## Project Structure

```
ai-workflow-automation/
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── engine/          # Workflow execution engine ⭐
│   │   ├── pages/           # Page components
│   │   ├── types/           # TypeScript definitions
│   │   └── services/        # API services
│   └── public/
├── backend/                 # Node.js backend
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   └── store/           # Data storage
│   ├── test-workflow-*.json # Test workflows ⭐
│   └── test-workflow-execution.js # Test script ⭐
├── NODE_IMPLEMENTATIONS.md  # Detailed node docs ⭐
├── QUICKSTART.md           # Quick start guide ⭐
├── IMPLEMENTATION_SUMMARY.md # Implementation details ⭐
└── README.md
```

⭐ = **New/Updated in latest release**

## 📦 Implemented Nodes

### Triggers
- 🔗 **Webhook** - HTTP request triggers

### Logic & Flow
- 📝 **JavaScript** - Custom code execution
- 🔀 **Conditional (IF)** - Branch on conditions
- ✏️ **Set** - Transform data fields
- 🔍 **Filter** - Filter arrays/data
- 🔗 **Merge** - Combine data sources
- 📦 **Split Batches** - Process in batches
- ⏱️ **Delay** - Add wait times

### HTTP & API
- 🌐 **HTTP Request** - REST API calls

### Communication
- 💬 **Slack** - Send Slack messages
- 📧 **Email** - Send emails
- 🎮 **Discord** - Discord notifications
- ✈️ **Telegram** - Telegram messages
- 📱 **WhatsApp** - WhatsApp messages

### AI & Data
- 🤖 **OpenAI** - GPT, DALL-E integration
- 📊 **Google Sheets** - Spreadsheet operations

## 🧪 Test Workflows

Three ready-to-use test workflows are included:

1. **test-workflow-simple.json** - Basic API processing
2. **test-workflow-comprehensive.json** - Multi-node with branching
3. **test-workflow-api-pipeline.json** - Complete data pipeline

Test them:
```bash
cd backend
node test-workflow-execution.js
```

## Available Routes

- `/` - Landing page with product overview
- `/login` - User login
- `/signin` - User registration
- `/editor` - Workflow editor (main application)

## Development

### Available Scripts

**Frontend:**
- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests

**Backend:**
- `npm run dev` - Start backend server
- `node test-workflow-execution.js` - Test node implementations

### Technologies

- **React 17** - UI framework
- **TypeScript 4** - Type safety
- **React Router 5** - Client-side routing
- **CSS3** - Styling with modern features

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

Open-source project. See LICENSE file for details.

## Support

For issues and questions, please open an issue on GitHub.