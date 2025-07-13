#!/bin/bash

echo "🚀 Starting Nurse Platform Development Environment"
echo "================================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo ""
echo "🔧 Building backend..."
npx nx build backend

echo ""
echo "🚀 Starting development servers..."
echo "   - Frontend: http://localhost:3000"
echo "   - Backend: http://localhost:3001"
echo "   - API Docs: http://localhost:3001/api/docs"
echo ""
echo "📋 Quick Access URLs:"
echo "   - Dashboard: http://localhost:3000/dashboard"
echo "   - Admin Panel: http://localhost:3000/admin/nurses"
echo "   - Dev Auth Helper: http://localhost:3000/dev-auth"
echo ""
echo "🔑 Test Credentials:"
echo "   Admin: admin@test.com / AdminPassword123"
echo "   Patient: patient.dashboard@test.com / TestPassword123"
echo ""
echo "Press Ctrl+C to stop the servers"
echo "================================================"

# Start both frontend and backend
npm run dev
