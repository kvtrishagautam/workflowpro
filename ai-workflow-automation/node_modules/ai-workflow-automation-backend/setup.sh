#!/bin/bash

# Backend Setup Script for AI Workflow Automation

echo "🚀 Backend Setup - AI Workflow Automation"
echo "==========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm globally..."
    npm install -g pnpm
fi

echo "✅ pnpm version: $(pnpm --version)"
echo ""

# Navigate to backend directory
cd "$(dirname "$0")" || exit

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ .env file created. Please update it with your configuration."
    else
        echo "❌ .env.example not found. Please create .env manually."
    fi
fi

echo ""
echo "📥 Installing dependencies..."
pnpm install

echo ""
echo "✅ Backend setup complete!"
echo ""
echo "🎯 Next steps:"
echo "  1. Update .env with your configuration (especially MongoDB URI)"
echo "  2. Start MongoDB: docker run -d -p 27017:27017 --name mongodb mongo:latest"
echo "  3. Run: pnpm run dev"
echo ""
echo "The server will be available at http://localhost:5000"
