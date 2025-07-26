#!/bin/bash

echo "Starting development environment with debug info..."

# Check if backend server is running
echo "Checking if backend server is running..."
curl -s http://localhost:3001/api/health > /dev/null
if [ $? -eq 0 ]; then
  echo "Backend server is already running on port 3001 ✓"
else
  echo "Backend server is not running. Starting backend..."
  echo "Starting backend server in a new terminal window..."
  gnome-terminal -- bash -c "cd apps/backend && npm start" &
  sleep 5  # Give the server some time to start
fi

# Start frontend application with debug info
echo "Starting frontend application with API debugging enabled..."
export NODE_OPTIONS="--trace-warnings" 
export NEXT_PUBLIC_DEBUG=true
cd apps/frontend && npm run dev
