# Workflow Automation Backend

Backend API server for the workflow automation platform.

## Features

- RESTful API with Express.js
- MongoDB database with Mongoose
- JWT authentication
- TypeScript for type safety
- Workflow CRUD operations
- User management

## Setup

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your MongoDB URI and JWT secret
```

### Running

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Workflows

- `POST /api/workflows` - Create workflow (protected)
- `GET /api/workflows` - List workflows (protected)
- `GET /api/workflows/:id` - Get workflow (protected)
- `PUT /api/workflows/:id` - Update workflow (protected)
- `DELETE /api/workflows/:id` - Delete workflow (protected)
- `PATCH /api/workflows/:id/toggle` - Toggle workflow active status (protected)

### Health

- `GET /health` - Health check endpoint

## Environment Variables

See `.env.example` for required environment variables.

## Project Structure

```
src/
├── config/          # Configuration files
├── models/          # Mongoose models
├── routes/          # API routes
├── controllers/     # Route controllers
├── middleware/      # Express middleware
├── services/        # Business logic
├── executors/       # Node execution handlers
├── types/           # TypeScript types
├── utils/           # Utility functions
└── server.ts        # Express app setup
```

## Development

The server runs on port 5000 by default. Make sure MongoDB is running before starting the server.

## License

MIT
