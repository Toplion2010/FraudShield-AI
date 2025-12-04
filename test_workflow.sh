#!/bin/bash

# FraudShield AI - Quick Test Script
# This script helps test the complete workflow

echo "============================================================"
echo "🔬 FraudShield AI - Workflow Test"
echo "============================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend is running
echo -n "Checking backend server... "
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not running${NC}"
    echo ""
    echo "Please start the backend server:"
    echo "  cd backend"
    echo "  source venv/bin/activate  # or venv\\Scripts\\activate on Windows"
    echo "  python main.py"
    exit 1
fi

# Check if frontend is running
echo -n "Checking frontend server... "
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${YELLOW}⚠ Not detected${NC}"
    echo ""
    echo "Please start the frontend server:"
    echo "  cd frontend"
    echo "  npm run dev"
fi

echo ""
echo "============================================================"
echo "📊 Testing API Endpoints"
echo "============================================================"

# Test health endpoint
echo -n "Testing /health endpoint... "
HEALTH_RESPONSE=$(curl -s http://localhost:8000/health)
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo -e "${GREEN}✓ Passed${NC}"
else
    echo -e "${RED}✗ Failed${NC}"
    echo "Response: $HEALTH_RESPONSE"
fi

# Test root endpoint
echo -n "Testing / endpoint... "
ROOT_RESPONSE=$(curl -s http://localhost:8000/)
if echo "$ROOT_RESPONSE" | grep -q "FraudShield"; then
    echo -e "${GREEN}✓ Passed${NC}"
else
    echo -e "${RED}✗ Failed${NC}"
fi

echo ""
echo "============================================================"
echo "📝 Test Instructions"
echo "============================================================"
echo ""
echo "To test the complete workflow:"
echo ""
echo "1. Open browser: ${GREEN}http://localhost:3000${NC}"
echo ""
echo "2. Go to Upload page"
echo ""
echo "3. Upload the sample file: ${YELLOW}data/sample_10k.csv${NC}"
echo ""
echo "4. Click '${GREEN}Train Model${NC}' and wait for success message"
echo "   (Should take 30-60 seconds)"
echo ""
echo "5. Click '${GREEN}Detect Fraud${NC}' and wait for results"
echo "   (Should take 5-10 seconds)"
echo ""
echo "6. Click '${GREEN}View Detailed Dashboard${NC}'"
echo "   Dashboard should load with:"
echo "   - Summary statistics"
echo "   - Risk distribution chart"
echo "   - Transaction type chart"
echo "   - Transaction table with filters"
echo ""
echo "============================================================"
echo "🐛 Debugging"
echo "============================================================"
echo ""
echo "If dashboard doesn't load, check:"
echo ""
echo "1. Backend logs (in terminal running main.py)"
echo "   Look for: '📊 Analysis Request Received'"
echo ""
echo "2. Browser console (F12 or Cmd+Option+I)"
echo "   Look for error messages"
echo ""
echo "3. Network tab (F12 → Network)"
echo "   Check /api/analyze request status"
echo ""
echo "See ${YELLOW}TROUBLESHOOTING.md${NC} for more help"
echo ""
echo "============================================================"
