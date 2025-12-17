# WorkflowPro - Visual Automation Platform

A modern, open-source visual workflow automation platform built with React and TypeScript. Design, build, and deploy automated workflows with an intuitive drag-and-drop interface.

## Features

- **Visual Workflow Builder**: Drag-and-drop interface for creating complex automation workflows
- **Multiple Node Types**: Webhook, JavaScript, HTTP, Slack, Conditional, and Delay nodes
- **Real-time Canvas**: Interactive canvas with zoom, pan, and connection management
- **Modern UI**: Beautiful, responsive design with glassmorphism effects
- **TypeScript**: Fully typed codebase for better developer experience

## Quick Start

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
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   │   ├── Canvas.tsx          # Workflow canvas
│   │   │   ├── NodePalette.tsx     # Node selection panel
│   │   │   └── WorkflowNode.tsx    # Individual workflow nodes
│   │   ├── pages/          # Page components
│   │   │   ├── Landing.tsx         # Landing page
│   │   │   ├── Login.tsx           # Login page
│   │   │   ├── Signin.tsx          # Sign-up page
│   │   │   └── Editor.tsx          # Workflow editor
│   │   ├── types/          # TypeScript type definitions
│   │   ├── assets/         # Static assets (images, icons)
│   │   └── index.tsx       # Application entry point
│   └── public/             # Public assets
├── backend/                # Backend API (future)
└── README.md
```

## Available Routes

- `/` - Landing page with product overview
- `/login` - User login
- `/signin` - User registration
- `/editor` - Workflow editor (main application)

## Development

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App (irreversible)

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