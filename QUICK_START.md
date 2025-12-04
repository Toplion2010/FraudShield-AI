# Ego-Tree Risk Graph - Quick Start Guide

## What is This?

The Ego-Tree Risk Graph is a visual tool that shows you **who is connected to whom** in your transaction data. It helps you:

- Find suspicious transaction patterns
- Trace money flows between accounts
- Identify fraud networks
- Analyze account relationships

## Visual Example

```
                    ┌─────────────┐
                    │  Account A  │ (High Risk - RED)
                    └──────┬──────┘
                           │
                ┌──────────┼──────────┐
                │          │          │
                ▼          ▼          ▼
        ┌───────────┐  ┌──────────┐  ┌───────────┐
        │ Account B │  │   EGO    │  │ Account C │
        │  (Green)  │  │ (CENTER) │  │ (Orange)  │
        └───────────┘  └─────┬────┘  └───────────┘
                             │
                             ▼
                      ┌───────────┐
                      │ Account D │ (Yellow)
                      └───────────┘
```

**Colors:**
- 🔴 Red = CRITICAL risk (fraud likely)
- 🟠 Orange = HIGH risk (suspicious)
- 🟡 Yellow = MEDIUM risk (watch)
- 🟢 Green = LOW risk (normal)

**Arrow thickness** = Risk level (thicker = riskier)

## 5-Minute Setup

### Step 1: Start the Backend (Terminal 1)

```bash
cd backend
python main.py
```

Wait for: `INFO:     Uvicorn running on http://0.0.0.0:8000`

### Step 2: Start the Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

Wait for: `ready - started server on 0.0.0.0:3000`

### Step 3: Train the Model

1. Open browser: http://localhost:3000/upload
2. Upload `data/sample_10k.csv`
3. Click "Train Model"
4. Wait for success message

### Step 4: Build Your First Graph

1. Navigate to: http://localhost:3000/graph
2. Enter client ID: `M1108211033` (or try others below)
3. Set depth: `2`
4. Click "Build Graph"
5. Explore!

## Try These Client IDs

Copy-paste these into the search box:

### Normal Accounts
```
C1231006815
```
- Regular payment transactions
- Low risk (green nodes)
- Good for testing basic features

### Fraudulent Accounts
```
C1305486145
```
- Known fraud case (TRANSFER)
- High risk (red edges)
- Account drained to zero

```
C840083671
```
- Known fraud case (CASH_OUT)
- High risk (red edges)
- Suspicious patterns

### Merchant Account (Your Selection!)
```
M1108211033
```
- Many incoming transactions
- Mix of risk levels
- Good for exploring depth

## How to Use the Graph

### Controls

**Client ID Box:**
- Type or paste account ID
- Press Enter to build

**Depth Slider:**
- `1` = Direct connections only
- `2` = Friends of friends (recommended)
- `3` = Extended network (may be slow)

**Min Score Slider:**
- `0.0` = Show all transactions
- `0.5` = Only suspicious ones
- `0.8` = Only high-risk fraud

**Build Graph Button:**
- Click to generate visualization
- Wait for loading spinner

**Export CSV Button:**
- Downloads 2 files:
  - Nodes (accounts with risk scores)
  - Edges (transactions with details)

### Interactions

**🖱️ Click a Node:**
- See detailed information
- Transaction counts
- Money sent/received
- Risk level

**👆 Hover Over Node:**
- Quick tooltip appears
- Shows key stats

**👆 Hover Over Arrow:**
- See transaction details
- Amount, type, risk score
- Reasons for risk rating

**🔍 Zoom:**
- Mouse wheel to zoom in/out
- Or pinch on trackpad

**✋ Pan:**
- Click and drag background
- Move graph around

**🎯 Center:**
- Click a node
- Graph centers on it

## Understanding the Graph

### Node Info

When you click a node, you see:

```
ID: C1234567890
Risk Level: HIGH
Risk Score: 0.75
Transactions: 25
Sent: $150,000
Received: $75,000
Depth: 1
```

**What it means:**
- This account is 1 hop away from your selected account
- It has a 75% fraud probability
- Sent more money than received (outflow)
- Involved in 25 transactions

### Edge Info

When you hover over an arrow, you see:

```
C123... → C456...
Amount: $50,000
Risk Score: 0.85
Type: TRANSFER
Step: 1
Reasons:
- High amount: $50,000
- Risky transaction type: TRANSFER
- Account drained to zero
```

**What it means:**
- Money flowed from C123 to C456
- $50k transfer (large amount)
- 85% fraud probability
- Multiple red flags

### Risk Reasons

The system tells you **why** something is risky:

- 💰 "Very high amount: $X" - Large transaction
- 🚨 "Risky transaction type" - TRANSFER or CASH_OUT
- 🔻 "Account drained to zero" - Balance went to $0
- 📊 "Large portion of balance: X%" - Moved most of money
- 🤖 "ML fraud score: 0.XX" - AI detected anomaly
- ⚠️ "Confirmed fraud" - Known fraudulent transaction

## Exporting Data

Click "Export CSV" to get 2 files:

### nodes.csv
```csv
id,label,risk_score,risk_level,transaction_count,total_amount_sent,total_amount_received,is_ego,depth
C123...,C123...,0.75,HIGH,25,150000,75000,false,1
```

### edges.csv
```csv
source,target,amount,fraud_score,edge_score,transaction_type,step,is_fraud,reasons,is_outgoing_from_ego
C123...,C456...,50000,0.85,0.85,TRANSFER,1,1,"Confirmed fraud; Account drained",true
```

Use these in:
- Excel/Google Sheets
- Tableau/Power BI
- Python/R analysis
- Reports

## Tips & Tricks

### For Best Results

1. **Start with depth 1** - See immediate connections
2. **Increase depth gradually** - Avoid overwhelming yourself
3. **Use min score filter** - Focus on high-risk only
4. **Click nodes** - Get full details
5. **Export before changing** - Save your findings

### Finding Fraud Networks

1. Look for **red/orange clusters** - Groups of high-risk accounts
2. Follow **thick arrows** - High-risk transactions
3. Check **ego node connections** - Who is your subject connected to?
4. Compare **sent vs received** - Money laundering patterns
5. Look for **circular flows** - Money moving in loops

### Performance Tips

If the graph is slow:

1. **Reduce depth** to 1 or 2
2. **Increase min score** to 0.5+
3. **Choose different client** with fewer connections
4. **Close other browser tabs**
5. **Use Chrome** (fastest Canvas rendering)

## Common Issues

### "Client ID not found"
- ✅ Check spelling (case-sensitive!)
- ✅ Use IDs from your CSV data
- ✅ Try examples above first

### "Model not trained"
- ✅ Go to /upload page
- ✅ Upload CSV file
- ✅ Click "Train Model"
- ✅ Wait for success

### Graph looks messy
- ✅ Reduce depth to 1
- ✅ Increase min score to filter
- ✅ Click nodes to focus
- ✅ Zoom in on clusters

### Graph is empty
- ✅ Lower min score to 0.0
- ✅ Try different client ID
- ✅ Check if client has transactions

### Slow performance
- ✅ Use smaller depth (1-2)
- ✅ Filter high-risk only (0.5+)
- ✅ Close other apps
- ✅ Restart browser

## Real-World Use Cases

### Case 1: Investigating Suspicious Account
1. Enter account ID
2. Set depth = 2, min score = 0.6
3. Look for red connections
4. Export CSV for report

### Case 2: Tracing Money Flow
1. Start with sender account
2. Follow arrows (transaction direction)
3. Click each node to see amounts
4. Export path for evidence

### Case 3: Finding Fraud Rings
1. Enter known fraudster ID
2. Set depth = 3, min score = 0.7
3. Look for clusters of red nodes
4. Investigate each member

### Case 4: Monitoring Merchant
1. Enter merchant ID (M...)
2. Set depth = 1, min score = 0.0
3. See all customers
4. Filter for high-risk customers

## Testing Your Installation

Run the automated test:

```bash
cd FraudShield-AI
python test_ego_tree.py
```

Should see:
```
✅ All tests passed!
🎉 Ego-Tree Graph feature is ready to use!
```

If errors, check:
- Backend is running (port 8000)
- sample_10k.csv exists in data/
- Python dependencies installed
- No firewall blocking

## Next Steps

Now that you know the basics:

1. 📖 Read full guide: [EGO_TREE_GRAPH_GUIDE.md](EGO_TREE_GRAPH_GUIDE.md)
2. 🧪 Run tests: `python test_ego_tree.py`
3. 🔍 Explore your own data
4. 📊 Export findings to CSV
5. 📝 Generate reports

## Support

Need help?

1. Check browser console (F12) for errors
2. Check backend terminal for logs
3. Read [EGO_TREE_GRAPH_GUIDE.md](EGO_TREE_GRAPH_GUIDE.md)
4. Run [test_ego_tree.py](test_ego_tree.py)

## Summary

You now know how to:
- ✅ Start the system
- ✅ Build an ego-tree graph
- ✅ Explore nodes and edges
- ✅ Understand risk scores
- ✅ Export data
- ✅ Find fraud patterns

**Happy fraud hunting!** 🕵️‍♂️🔍
