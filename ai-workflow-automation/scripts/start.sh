#!/bin/bash

# Navigate to the backend directory and start the server
cd backend
npm install
npm run start &

# Navigate to the frontend directory and start the development server
cd ../frontend
npm install
npm run start &

# Wait for both servers to start
wait