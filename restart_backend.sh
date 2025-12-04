#!/bin/bash

echo "🔄 Restarting FraudShield AI Backend..."

# Kill existing backend process
pkill -f "python.*main.py" 2>/dev/null || true
pkill -f "uvicorn" 2>/dev/null || true

# Wait a moment
sleep 2

# Navigate to backend directory
cd "/Users/vusala/FraudShield AI/FraudShield-AI/backend"

# Activate virtual environment and start backend
source venv/bin/activate

echo "🚀 Starting backend server..."
python main.py
