#!/bin/bash

# FraudShield AI - Quick System Test
# This script tests the basic functionality

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🛡️  FraudShield AI - System Test"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if backend is running
echo "1️⃣  Testing Backend Health..."
HEALTH=$(curl -s http://localhost:8000/health)
if [ $? -eq 0 ]; then
    echo "✅ Backend is running on port 8000"
    echo "   $HEALTH"
else
    echo "❌ Backend not responding"
    exit 1
fi
echo ""

# Check if frontend is running
echo "2️⃣  Testing Frontend..."
FRONTEND=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$FRONTEND" = "200" ]; then
    echo "✅ Frontend is running on port 3000"
else
    echo "❌ Frontend not responding (HTTP $FRONTEND)"
    exit 1
fi
echo ""

# Check sample data
echo "3️⃣  Checking Sample Data..."
if [ -f "data/Synthetic_Financial_datasets_log.csv" ]; then
    SIZE=$(du -h data/Synthetic_Financial_datasets_log.csv | cut -f1)
    LINES=$(wc -l < data/Synthetic_Financial_datasets_log.csv)
    echo "✅ Sample data found: $SIZE ($LINES lines)"
else
    echo "❌ Sample data not found"
    exit 1
fi
echo ""

# Test API endpoints
echo "4️⃣  Testing API Endpoints..."
curl -s http://localhost:8000/ | python3 -c "import sys, json; data=json.load(sys.stdin); print('✅ Root endpoint:', data['service'], 'v'+data['version'])" 2>/dev/null || echo "❌ Root endpoint failed"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All Systems Operational!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "📝 Next Steps:"
echo "   1. Open http://localhost:3000 in your browser"
echo "   2. Go to Upload page"
echo "   3. Upload: data/Synthetic_Financial_datasets_log.csv"
echo "   4. Click 'Train Model' (wait ~30 seconds)"
echo "   5. Click 'Detect Fraud'"
echo "   6. View results and dashboard!"
echo ""
