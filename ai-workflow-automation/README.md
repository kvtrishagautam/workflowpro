# AI Workflow Automation System

## Overview
This project is an AI workflow automation system that allows users to create, manage, and execute workflows through a user-friendly interface. It consists of a backend service that handles API requests and a frontend application that provides a visual interface for designing workflows.

## Features
- Create, update, and delete workflows
- Visual interface for designing workflows
- Integration with external services through connectors
- Execution of workflows with state management

## Project Structure
```
ai-workflow-automation
├── backend          # Backend application
│   ├── src         # Source code for the backend
│   ├── package.json # Backend dependencies and scripts
│   └── tsconfig.json # TypeScript configuration for the backend
├── frontend         # Frontend application
│   ├── src         # Source code for the frontend
│   ├── package.json # Frontend dependencies and scripts
│   └── tsconfig.json # TypeScript configuration for the frontend
├── packages         # Shared packages
│   ├── shared      # Shared utilities
│   └── node-sdk    # Node SDK for interacting with the system
├── scripts          # Scripts for running the application
├── docker           # Docker configuration
├── tests            # Unit tests for backend and frontend
├── .env.example     # Example environment configuration
├── package.json     # Root configuration for the project
└── pnpm-workspace.yaml # Workspace configuration for pnpm
```

## Getting Started

### Prerequisites
- Node.js (version X.X.X)
- pnpm (version X.X.X)

### Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   cd ai-workflow-automation
   ```

2. Install dependencies:
   ```
   pnpm install
   ```

### Running the Application
To start the application, run the following script:
```
./scripts/start.sh
```

### Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

### License
This project is licensed under the MIT License. See the LICENSE file for more details.