#!/bin/bash

echo "Starting both backend and frontend services..."

# Terminal 1: Start backend
echo "Starting backend server..."
gnome-terminal -- bash -c "cd /home/omar/iti/Graduation-Project-ITI && npm run dev:backend; exec bash"

# Wait a moment for backend to initialize
sleep 5

# Terminal 2: Start frontend
echo "Starting frontend server..."
gnome-terminal -- bash -c "cd /home/omar/iti/Graduation-Project-ITI && npm run dev:frontend; exec bash"

echo "Both services should be starting now. Check the terminal windows for progress."
echo "Backend will be available at http://localhost:3001"
echo "Frontend will be available at http://localhost:3000"
