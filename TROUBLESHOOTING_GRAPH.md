# Troubleshooting Guide - Ego-Tree Graph

## Common Errors and Solutions

### Error: "Client ID not found in transaction data"

**What it means:** The account ID you entered doesn't exist in the training dataset.

**Solutions:**

1. **Check the client ID spelling**
   - IDs are case-sensitive
   - Example: `C1021138110` (correct) vs `c1021138110` (wrong)

2. **Use IDs from the transaction table**
   - Scroll down to the "Recent Transactions" table
   - Click on any green (Origin) or blue (Dest) ID
   - These IDs are guaranteed to exist in your data

3. **Verify your data was uploaded correctly**
   - Go to Upload page
   - Re-upload your CSV file
   - Click "Train Model"
   - Return to dashboard and try again

4. **Try known test IDs** (if using sample_10k.csv):
   ```
   C1021138110
   C1231006815
   C1305486145
   M1108211033
   ```

### Error: "No training data available. Please train the model first."

**What it means:** The backend doesn't have any data loaded yet.

**Solution - Proper Workflow:**

**Step 1: Train the Model** (Required first!)
1. Go to [http://localhost:3000/upload](http://localhost:3000/upload)
2. Upload your CSV file (e.g., `sample_10k.csv`)
3. Click **"Train Model"** button
4. Wait for success message
5. ✅ Now backend has training_data loaded

**Step 2: Analyze Data** (Optional for dashboard)
1. On same upload page
2. Click **"Detect Fraud"** button (uses same file)
3. Wait for analysis to complete
4. Click "View Dashboard"
5. ✅ Now you have analysis data in dashboard

**Step 3: Build Graph**
1. In dashboard, scroll to "Relationship Graph Explorer"
2. Click any client ID from transaction table
3. Or type a client ID manually
4. Click "Build Graph"
5. ✅ Graph appears!

**Why this happens:**
- The dashboard shows analyzed data from localStorage
- The graph needs trained model data from backend
- These are two separate data stores
- Solution: Train model first, then use dashboard

### Error: "AxiosError: Network Error"

**What it means:** Frontend can't reach the backend API.

**Solutions:**

1. **Check backend is running**
   ```bash
   cd backend
   python main.py
   # Should see: Uvicorn running on http://0.0.0.0:8000
   ```

2. **Check frontend is using correct URL**
   - Default: `http://localhost:8000`
   - Check console for API call URLs

3. **Check CORS settings**
   - Backend `main.py` should allow `localhost:3000`
   - Already configured in the code

4. **Restart both services**
   ```bash
   # Terminal 1: Backend
   cd backend
   python main.py

   # Terminal 2: Frontend
   cd frontend
   npm run dev
   ```

### Error: "Graph is empty" or "No nodes shown"

**What it means:** Graph built successfully but has no visible nodes/edges.

**Solutions:**

1. **Lower the min risk filter**
   - Current: 0.5 or higher
   - Change to: 0.0 (show all)
   - Reason: Client might only have low-risk transactions

2. **Increase depth**
   - Current: 1
   - Change to: 2 or 3
   - Reason: Client might have indirect connections only

3. **Try a different client ID**
   - Some accounts have no connections
   - Merchant IDs (M...) usually have many connections
   - Try: `M1108211033`

4. **Check the account type**
   - Single transactions = No graph
   - Isolated accounts = No connections
   - Merchants/Active accounts = Rich graphs

### Error: "Graph is slow" or "Browser freezes"

**What it means:** Too many nodes for smooth rendering.

**Solutions:**

1. **Reduce depth**
   - From: 3
   - To: 1 or 2
   - Impact: Fewer nodes to render

2. **Increase min risk threshold**
   - From: 0.0
   - To: 0.5 or 0.7
   - Impact: Only high-risk edges shown

3. **Use dedicated graph page**
   - Go to [/graph](http://localhost:3000/graph)
   - Full-screen with better performance
   - Same features, more space

4. **Close other browser tabs**
   - Graph uses Canvas rendering
   - Needs GPU resources

5. **Try Chrome browser**
   - Best Canvas performance
   - Hardware acceleration enabled

### Error: "Export CSV downloads empty files"

**What it means:** Graph data not properly loaded.

**Solutions:**

1. **Rebuild the graph first**
   - Close current graph
   - Click client ID again
   - Wait for graph to fully render
   - Then click Export

2. **Check download location**
   - Files: `ego_tree_nodes_CLIENTID.csv` and `ego_tree_edges_CLIENTID.csv`
   - Default: ~/Downloads/
   - Both files should download (500ms apart)

3. **Try different client**
   - Some clients have minimal data
   - Choose high-risk transactions from table
   - More data = larger CSV files

## Complete Setup Checklist

Use this checklist if you're setting up for the first time:

### Backend Setup
- [ ] Python 3.8+ installed
- [ ] Navigate to `backend/` directory
- [ ] Install dependencies: `pip install -r requirements.txt`
- [ ] Run backend: `python main.py`
- [ ] Verify: See "Uvicorn running on http://0.0.0.0:8000"
- [ ] Test: Visit http://localhost:8000 (should see JSON status)

### Frontend Setup
- [ ] Node.js 18+ installed
- [ ] Navigate to `frontend/` directory
- [ ] Install dependencies: `npm install`
- [ ] Run frontend: `npm run dev`
- [ ] Verify: See "ready - started server on 0.0.0.0:3000"
- [ ] Test: Visit http://localhost:3000 (should see homepage)

### Data Setup
- [ ] Have CSV file ready (e.g., `sample_10k.csv` in `data/` folder)
- [ ] CSV has required columns: step, type, amount, nameOrig, nameDest, etc.
- [ ] File size reasonable (< 100MB for smooth operation)

### First-Time Workflow
1. [ ] Open http://localhost:3000/upload
2. [ ] Upload CSV file
3. [ ] Click "Train Model" → Wait for success
4. [ ] Click "Detect Fraud" → Wait for completion
5. [ ] Click "View Dashboard" → See analytics
6. [ ] Scroll to "Relationship Graph Explorer"
7. [ ] Click any green/blue client ID in transaction table
8. [ ] Graph appears! ✅

## FAQ

**Q: Do I need to train every time I restart?**
A: Yes. Backend stores data in memory. When you restart the server, train again.

**Q: Can I use different CSV files?**
A: Yes. Train with new file, old data is replaced.

**Q: How many client IDs can I explore?**
A: Unlimited. Each graph builds independently.

**Q: Can I save graphs for later?**
A: Currently: Export CSV. Future: Save graph states.

**Q: What's the difference between /graph and dashboard graph?**
A: Same functionality. Dashboard = embedded, /graph = full-screen.

**Q: Why do some client IDs work and others don't?**
A: Only IDs from your trained dataset work. Use IDs from the transaction table.

**Q: Can I build graphs without training?**
A: No. Graph needs trained model data in backend.

**Q: What if I close the browser?**
A: Dashboard data (localStorage) persists. Backend data (training) is lost on restart.

**Q: Can multiple users use the same backend?**
A: Yes, but they share the same training data. Last user to train wins.

## Still Having Issues?

1. **Check browser console (F12)**
   - Look for red errors
   - Note the error message
   - Check network tab for failed requests

2. **Check backend terminal**
   - Look for Python errors
   - Check if API endpoint is hit
   - Note any stack traces

3. **Try the test script**
   ```bash
   cd FraudShield-AI
   python test_ego_tree.py
   ```
   - Automated test of backend
   - Shows if backend works correctly
   - Provides detailed error messages

4. **Verify file structure**
   ```
   FraudShield-AI/
   ├── backend/
   │   ├── main.py (✓ Has ego-tree endpoint)
   │   └── (other files)
   ├── frontend/
   │   └── src/app/
   │       ├── dashboard/page.tsx (✓ Has graph section)
   │       └── graph/page.tsx
   └── data/
       └── sample_10k.csv
   ```

5. **Check versions**
   - Python: 3.8+
   - Node.js: 18+
   - npm packages: Run `npm install` again
   - Python packages: Run `pip install -r requirements.txt` again

## Quick Reset

If all else fails, complete reset:

```bash
# Stop all services (Ctrl+C in both terminals)

# Backend reset
cd backend
rm -rf __pycache__
pip install -r requirements.txt
python main.py

# Frontend reset (new terminal)
cd frontend
rm -rf .next node_modules
npm install
npm run dev

# Then: Train model again from scratch
```

## Contact & Support

- Check documentation: `EGO_TREE_GRAPH_GUIDE.md`
- Check integration guide: `DASHBOARD_GRAPH_INTEGRATION.md`
- Run tests: `python test_ego_tree.py`
- Review sample IDs: `data/sample_10k.csv` (lines 2-11)

## Success Indicators

You'll know everything is working when:

✅ Backend shows: "Uvicorn running on http://0.0.0.0:8000"
✅ Frontend shows: "ready - started server on 0.0.0.0:3000"
✅ Upload page: "Model trained successfully"
✅ Dashboard: Shows transaction table with data
✅ Click client ID: Graph builds in 2-3 seconds
✅ Graph shows: Colored nodes, arrows, tooltips working
✅ Export: Downloads 2 CSV files
✅ No errors in browser console or backend terminal

Happy fraud hunting! 🔍✨
