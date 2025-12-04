# FraudShield AI - Troubleshooting Guide

## Dashboard Loading Issues

If you see "Failed to load dashboard data. Please try again." when trying to view the dashboard, follow these steps:

### Common Issues and Solutions

#### 1. Model Not Trained
**Error**: "Model not trained. Please train the model first..."

**Solution**:
1. Go to the Upload page
2. Upload your CSV file
3. Click "Train Model" button first
4. Wait for training to complete (you'll see a success message)
5. Then click "Detect Fraud"
6. Finally, click "View Detailed Dashboard"

#### 2. Backend Server Not Running
**Error**: Connection refused or network error

**Solution**:
```bash
# Start the backend server
cd backend
source venv/bin/activate  # On Mac/Linux
# OR
venv\Scripts\activate  # On Windows

python main.py
```

The backend should start on http://localhost:8000

#### 3. Frontend Not Running
**Solution**:
```bash
# In a separate terminal
cd frontend
npm run dev
```

The frontend should start on http://localhost:3000

#### 4. Invalid CSV File
**Error**: "Missing required columns..."

**Solution**:
Your CSV must have these columns:
- step
- type
- amount
- nameOrig
- oldbalanceOrg
- newbalanceOrig
- nameDest
- oldbalanceDest
- newbalanceDest

Use the sample file at `data/sample_10k.csv` for testing.

#### 5. Browser Console Errors
**Check the browser console** (F12 or Cmd+Option+I):
- Look for detailed error messages
- Check if the API endpoint is correct
- Verify CORS is not blocking requests

### Step-by-Step Testing Process

1. **Start Backend**:
   ```bash
   cd backend
   source venv/bin/activate
   python main.py
   ```

2. **Start Frontend** (in another terminal):
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test the Workflow**:
   - Open http://localhost:3000
   - Go to Upload page
   - Upload `data/sample_10k.csv`
   - Click "Train Model" and wait for success
   - Click "Detect Fraud" and wait for results
   - Click "View Detailed Dashboard"
   - Dashboard should load with charts and statistics

### Debugging Tips

#### Check Backend Logs
The backend now includes detailed logging:
```
============================================================
🎓 Training Request Received
============================================================
📁 File: sample_10k.csv
✅ Loaded 10000 transactions
🤖 Initializing fraud detector...
🔧 Training model (this may take a moment)...
✅ Training Complete!
============================================================
```

#### Check Browser Console
Open Developer Tools (F12) and look for:
- API request/response details
- JavaScript errors
- Network errors

#### Verify API Endpoints
Test the backend directly:
```bash
# Check if backend is running
curl http://localhost:8000/health

# Should return:
{"status":"healthy","timestamp":"...","model_ready":false}
```

### Full Statistics Not Showing

If you trained the model but can't see all statistics:

1. **Verify Training Completed Successfully**
   - Check backend logs for "Training Complete!"
   - Look for the number of training samples and features

2. **Re-run Analysis**
   - Upload the same file again
   - Click "Detect Fraud" (no need to retrain)
   - Click "View Detailed Dashboard"

3. **Clear Browser Cache**
   ```javascript
   // In browser console:
   localStorage.clear()
   ```
   Then retry the process.

### Advanced Debugging

#### Check Model State
```bash
# In Python (backend directory)
python
>>> from ml_engine.models.hybrid_fraud_detector import HybridFraudDetector
>>> detector = HybridFraudDetector()
>>> # Should not throw errors
```

#### Test File Upload
```bash
curl -X POST http://localhost:8000/api/train \
  -F "file=@data/sample_10k.csv"
```

#### Verify Dependencies
```bash
cd backend
pip list | grep -E "(scikit-learn|pandas|fastapi|tensorflow)"
```

### Still Having Issues?

1. Check the [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) for architecture details
2. Review the [SETUP_GUIDE.md](SETUP_GUIDE.md) for installation steps
3. Restart both backend and frontend servers
4. Try with the sample data file first before using your own data

### Error Message Reference

| Error Message | Cause | Solution |
|--------------|-------|----------|
| "Model not trained" | Detector not initialized | Train the model first |
| "Missing required columns" | Invalid CSV format | Use correct CSV format |
| "Connection refused" | Backend not running | Start backend server |
| "Failed to load dashboard" | Multiple possible causes | Check console and backend logs |
| "File not found" | Wrong file path | Use absolute path or check location |

## Performance Tips

- First training takes 30-60 seconds for 10k transactions
- Detection is faster (5-10 seconds)
- Dashboard loads instantly once data is analyzed
- Limit transactions to 1M for best performance

## Contact & Support

For more help, check:
- Backend logs in terminal
- Browser console (F12)
- Network tab in Developer Tools
