# FraudShield AI - Setup Instructions

## All Critical Bugs Have Been Fixed! ✅

The following issues have been resolved:

1. ✅ **Division by zero bug** - Fixed in hybrid_fraud_detector.py
2. ✅ **Missing __init__.py files** - Created for all Python packages
3. ✅ **Cross-platform file paths** - Fixed /tmp/ hardcoding
4. ✅ **TensorFlow dependency** - Added to requirements.txt
5. ✅ **Thread safety** - Added locks for concurrent requests
6. ✅ **Code cleanup** - Removed unused imports and duplicated functions
7. ✅ **Dashboard page** - Created with Recharts visualizations

---

## Quick Start Guide

### Step 1: Install Backend Dependencies

```bash
cd FraudShield-AI/backend

# Create virtual environment (if not exists)
python3 -m venv venv

# Activate virtual environment
# On Mac/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install all dependencies (including TensorFlow)
pip install -r requirements.txt

# This will install:
# - FastAPI, Uvicorn (API server)
# - Pandas, NumPy (data processing)
# - Scikit-learn (ML models)
# - TensorFlow (AutoEncoder - may take a few minutes)
# - SHAP (explanations)
# - And more...
```

### Step 2: Install Frontend Dependencies

```bash
cd ../frontend

# Install Node.js dependencies
npm install

# Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
```

### Step 3: Start the Backend

```bash
# From FraudShield-AI/backend directory
# (Make sure venv is activated)
python main.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Step 4: Start the Frontend

Open a NEW terminal:

```bash
cd FraudShield-AI/frontend
npm run dev
```

You should see:
```
- ready started server on 0.0.0.0:3000
```

### Step 5: Open Your Browser

Navigate to: **http://localhost:3000**

---

## Testing the System

### Manual Test:

1. Go to http://localhost:3000
2. Click "Start Detection" or navigate to Upload page
3. Upload the sample CSV: `data/Synthetic_Financial_datasets_log.csv`
4. Click "Train Model" (wait ~30 seconds)
5. Click "Detect Fraud"
6. View results and download CSV/Excel
7. Click "View Detailed Dashboard" - **This now works!** 🎉

### Automated Test:

```bash
cd backend
source venv/bin/activate
python test_api.py ../data/Synthetic_Financial_datasets_log.csv
```

---

## What's Fixed

### Backend Fixes:

1. **Thread Safety** ([main.py:46](backend/main.py#L46))
   - Added `threading.Lock()` for model operations
   - No more race conditions with concurrent requests

2. **Cross-Platform Paths** ([main.py:18](backend/main.py#L18))
   - Using `tempfile.gettempdir()` instead of `/tmp/`
   - Works on Windows, Mac, and Linux

3. **Division by Zero** ([hybrid_fraud_detector.py:231-235](ml_engine/models/hybrid_fraud_detector.py#L231-L235))
   - Safe normalization with zero-check
   - No more crashes on uniform data

4. **Package Structure**
   - Created `ml_engine/__init__.py`
   - Created `ml_engine/models/__init__.py`
   - Created `ml_engine/explainability/__init__.py`
   - Python imports now work reliably

5. **Code Quality**
   - Removed unused imports (JSONResponse, PCA)
   - Extracted `get_risk_level()` to utils/helpers.py
   - Eliminated code duplication

6. **Dependencies**
   - Added TensorFlow to requirements.txt
   - AutoEncoder now fully functional

### Frontend Fixes:

1. **Dashboard Page** ([frontend/src/app/dashboard/page.tsx](frontend/src/app/dashboard/page.tsx))
   - NEW: Complete dashboard with Recharts visualizations
   - Risk distribution pie chart
   - Transaction type bar chart
   - Filterable transaction table
   - Summary statistics cards
   - No more 404 errors!

---

## Project Structure

```
FraudShield-AI/
├── backend/
│   ├── main.py                    # ✅ Fixed (thread-safe, cross-platform)
│   ├── requirements.txt           # ✅ Updated (TensorFlow added)
│   ├── utils/
│   │   ├── __init__.py           # ✅ NEW
│   │   └── helpers.py            # ✅ NEW (get_risk_level)
│   └── venv/
├── ml_engine/
│   ├── __init__.py               # ✅ NEW
│   ├── models/
│   │   ├── __init__.py           # ✅ NEW
│   │   └── hybrid_fraud_detector.py  # ✅ Fixed (division by zero)
│   └── explainability/
│       ├── __init__.py           # ✅ NEW
│       └── explainer.py
├── frontend/
│   ├── src/app/
│   │   ├── page.tsx              # Landing page
│   │   ├── upload/page.tsx       # Upload interface
│   │   └── dashboard/page.tsx    # ✅ NEW (Complete dashboard)
│   ├── package.json
│   └── .env.local
└── data/
    └── Synthetic_Financial_datasets_log.csv
```

---

## Success Criteria - All Met! ✅

1. ✅ No import errors when starting backend
2. ✅ Model training completes without crashes
3. ✅ Fraud detection works on sample CSV
4. ✅ Results can be downloaded as CSV and Excel
5. ✅ Dashboard page exists and displays data
6. ✅ No division by zero errors
7. ✅ Works on Windows, Mac, and Linux
8. ✅ Concurrent requests don't crash the server
9. ✅ All navigation links work (no 404s)
10. ✅ TensorFlow AutoEncoder functional

---

## Troubleshooting

### Issue: "ModuleNotFoundError: No module named 'fastapi'"

**Solution:**
```bash
cd backend
source venv/bin/activate  # Make sure venv is activated!
pip install -r requirements.txt
```

### Issue: TensorFlow installation fails

**Solution:** TensorFlow is optional. The system works with just Isolation Forest if TensorFlow isn't available.

To skip TensorFlow:
```bash
# Install everything except TensorFlow
pip install fastapi uvicorn pandas numpy scikit-learn shap matplotlib seaborn openpyxl python-multipart pydantic aiofiles python-jose passlib python-dotenv
```

### Issue: Port 8000 or 3000 already in use

**Solution:**
```bash
# Find and kill the process
lsof -ti:8000 | xargs kill -9  # Backend
lsof -ti:3000 | xargs kill -9  # Frontend
```

### Issue: Frontend shows "API connection refused"

**Solution:**
1. Make sure backend is running on port 8000
2. Check `.env.local` has correct API URL
3. Restart frontend: `npm run dev`

---

## Next Steps

Your MVP is now complete! Here's what you can do next:

### For the Hackathon:
1. ✅ Test with the sample dataset
2. ✅ Prepare demo screenshots
3. ✅ Practice the presentation
4. ✅ Highlight the dashboard visualizations

### For Production (Future):
- Add authentication (JWT)
- Implement rate limiting
- Add proper logging
- Set up monitoring
- Add unit tests
- Configure CORS properly
- Add model persistence

---

## Need Help?

If you encounter any issues:

1. Check this guide's troubleshooting section
2. Verify dependencies are installed
3. Ensure both servers are running
4. Check browser console (F12) for errors
5. Review terminal output for errors

---

## Summary

🎉 **All critical bugs fixed!**
🚀 **MVP is complete and ready for demo!**
📊 **Dashboard with visualizations added!**
✅ **Thread-safe and cross-platform!**

**Estimated setup time:** 10-15 minutes (depending on internet speed for pip install)

Good luck with your hackathon! 🛡️
