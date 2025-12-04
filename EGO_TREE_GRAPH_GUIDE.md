# Ego-Tree Risk Graph Feature - Implementation Guide

## Overview

The Ego-Tree Risk Graph is a directed relationship visualization feature that shows transaction networks centered on a specific client/account ID. It uses BFS (Breadth-First Search) traversal to build a graph of connected accounts up to depth 3, with risk-based styling and interactive exploration.

## Architecture

### Backend Components

#### 1. API Endpoint
**Location:** `backend/main.py:719`
```
POST /api/graph/ego-tree
```

**Request Body:**
```json
{
  "client_id": "C1231006815",
  "depth": 2,
  "min_fraud_score": 0.0,
  "limit": 100
}
```

**Response:**
```json
{
  "nodes": [
    {
      "id": "C1231006815",
      "label": "C123100681...",
      "risk_score": 0.75,
      "risk_level": "HIGH",
      "transaction_count": 25,
      "total_amount_sent": 150000.50,
      "total_amount_received": 75000.25,
      "is_ego": true,
      "depth": 0
    }
  ],
  "edges": [
    {
      "source": "C1231006815",
      "target": "C553264065",
      "amount": 181.0,
      "fraud_score": 0.92,
      "edge_score": 0.85,
      "transaction_type": "TRANSFER",
      "step": 1,
      "is_fraud": 1,
      "reasons": ["Confirmed fraud", "Account drained to zero"],
      "is_outgoing_from_ego": true
    }
  ],
  "summary": {
    "total_nodes": 25,
    "total_edges": 43,
    "high_risk_edges": 8,
    "medium_risk_edges": 12,
    "low_risk_edges": 23,
    "avg_edge_score": 0.65,
    "avg_node_risk": 0.58,
    "max_depth_reached": 2,
    "ego_node_id": "C1231006815"
  }
}
```

#### 2. Graph Building Algorithm
**Location:** `backend/main.py:521-716`

**Function:** `build_ego_tree(client_id, df, depth, min_fraud_score, limit)`

**Algorithm:**
- Uses BFS to traverse transaction network
- Tracks both outgoing (nameOrig) and incoming (nameDest) transactions
- Calculates node risk scores as aggregate of edge scores
- Limits nodes to prevent performance issues

**Key Features:**
- Directional edges (source → target)
- Risk-based filtering
- Depth control (1-3 levels)
- Node limit (default: 100)

#### 3. Edge Scoring System
**Location:** `backend/main.py:455-518`

**Function:** `calculate_edge_score(row)`

**Scoring Components (each 0-1):**
1. **Amount-based risk:**
   - > $100k: 0.8
   - > $50k: 0.6
   - > $10k: 0.4
   - Otherwise: 0.1

2. **Transaction type risk:**
   - TRANSFER/CASH_OUT: 0.7
   - PAYMENT: 0.4
   - Others: 0.2

3. **Balance anomalies:**
   - Account drained to zero: 0.9
   - Large portion of balance (>90%): 0.7
   - Normal: 0.2

4. **ML fraud score:**
   - Uses trained model if available
   - Otherwise uses heuristics

**Final Score:** Average of all components, normalized to [0, 1]

**Reasons:** Human-readable explanations for each score component

### Frontend Components

#### 1. Graph Page
**Location:** `frontend/src/app/graph/page.tsx`

**Features:**
- Force-directed graph visualization
- Interactive controls (depth, min score, client ID search)
- Real-time updates
- CSV export
- Node details panel
- Summary statistics

#### 2. Visualization Library
**Library:** `react-force-graph-2d`

**Graph Layout:**
- Force-directed algorithm
- Node repulsion
- Edge attraction
- Center gravity

**Visual Encoding:**
- **Node Color:** Risk level (Green → Yellow → Orange → Red)
- **Node Size:** Risk score + transaction count
- **Edge Color:** Edge score gradient (Green → Yellow → Orange → Red)
- **Edge Thickness:** Risk score (thicker = higher risk)
- **Edge Direction:** Arrows showing transaction flow
- **Ego Node:** White border + larger size

#### 3. Controls Panel

**Client ID Input:**
- Text search with autocomplete suggestion
- Enter key to build graph

**Depth Slider:**
- Range: 1-3
- Visual gradient indicator

**Min Risk Score Slider:**
- Range: 0.0-1.0
- Filters out low-risk edges

**Build Graph Button:**
- Triggers API call
- Loading state with spinner

**Export Button:**
- Downloads 2 CSV files:
  - `ego_tree_nodes_{client_id}.csv`
  - `ego_tree_edges_{client_id}.csv`

## Risk Level Colors

```javascript
const RISK_COLORS = {
  CRITICAL: '#ff3366',  // Red (score > 0.8)
  HIGH: '#ff9933',      // Orange (0.6 < score ≤ 0.8)
  MEDIUM: '#ffcc00',    // Yellow (0.4 < score ≤ 0.6)
  LOW: '#00ff88',       // Green (score ≤ 0.4)
};
```

## Usage Instructions

### 1. Train the Model (First Time Only)

1. Navigate to `/upload`
2. Upload training data CSV (e.g., `sample_10k.csv`)
3. Click "Train Model"
4. Wait for confirmation

### 2. Build Ego-Tree Graph

1. Navigate to `/graph`
2. Enter a client ID (e.g., `C1231006815` or `M1108211033`)
3. Adjust depth (1-3) using slider
4. Set minimum risk score threshold (optional)
5. Click "Build Graph"

### 3. Explore the Graph

**Interactive Features:**
- **Click Node:** View detailed information in right panel
- **Hover Node:** See tooltip with risk score and transactions
- **Hover Edge:** See transaction details, amount, and reasons
- **Zoom:** Mouse wheel or pinch
- **Pan:** Click and drag background
- **Center:** Click node to center and zoom

### 4. Export Data

Click "Export CSV" to download:
- Nodes CSV with all node attributes
- Edges CSV with transaction details and reasons

## API Requirements

### Data Requirements

The training data CSV must include:
- `step` - Time step
- `type` - Transaction type
- `amount` - Transaction amount
- `nameOrig` - Origin account ID
- `oldbalanceOrg` - Origin balance before
- `newbalanceOrig` - Origin balance after
- `nameDest` - Destination account ID
- `oldbalanceDest` - Destination balance before
- `newbalanceDest` - Destination balance after
- `isFraud` (optional) - Ground truth label

### Model Training

Before using the graph, train the model by uploading a CSV via:
```
POST /api/train
```

The system will:
1. Store training data
2. Train Isolation Forest + AutoEncoder
3. Initialize fraud explainer
4. Enable graph generation

## Performance Considerations

### Backend Optimizations

1. **Node Limit:** Default 100 nodes to prevent memory issues
2. **BFS Traversal:** Efficient graph exploration
3. **Early Stopping:** Stops at depth limit
4. **Visited Set:** Prevents duplicate traversal

### Frontend Optimizations

1. **Dynamic Import:** `react-force-graph-2d` loaded only on client
2. **Canvas Rendering:** Hardware-accelerated graphics
3. **Link Curvature:** Reduces visual overlap (0.2)
4. **Responsive Container:** Adapts to screen size

### Recommended Limits

- **Depth:** 1-2 for large datasets, 3 for focused analysis
- **Nodes:** 50-100 for smooth interaction
- **Min Score:** 0.5+ for high-risk networks only

## Troubleshooting

### Error: "Client ID not found"
- Verify client ID exists in training data
- Check spelling and exact match (case-sensitive)
- Use client IDs from `nameOrig` or `nameDest` columns

### Error: "Model not trained"
- Upload and train model first via `/upload` page
- Ensure training completed successfully

### Graph Not Loading
- Check browser console for errors
- Verify backend is running on port 8000
- Check CORS settings in `backend/main.py`

### Performance Issues
- Reduce depth to 1 or 2
- Increase min_fraud_score to 0.5+
- Reduce node limit in API request

### Empty Graph
- Lower min_fraud_score threshold
- Try different client ID with more transactions
- Check if client has any connections in dataset

## Example Client IDs

From `sample_10k.csv`:
- `C1231006815` - Has PAYMENT transactions
- `C1305486145` - Has fraudulent TRANSFER (row 4)
- `C840083671` - Has fraudulent CASH_OUT (row 5)
- `M1108211033` - Merchant account (user's selection)

## Testing

### Test Case 1: Fraudulent Account
```bash
# Build graph for known fraud
curl -X POST http://localhost:8000/api/graph/ego-tree \
  -H "Content-Type: application/json" \
  -d '{"client_id": "C1305486145", "depth": 2, "min_fraud_score": 0.0}'
```

Expected: High-risk edges, TRANSFER type, account drained to zero

### Test Case 2: Normal Account
```bash
# Build graph for normal transactions
curl -X POST http://localhost:8000/api/graph/ego-tree \
  -H "Content-Type: application/json" \
  -d '{"client_id": "C1231006815", "depth": 1, "min_fraud_score": 0.0}'
```

Expected: Low-risk edges, PAYMENT types, normal balances

### Test Case 3: Merchant Account
```bash
# Build graph for merchant
curl -X POST http://localhost:8000/api/graph/ego-tree \
  -H "Content-Type: application/json" \
  -d '{"client_id": "M1108211033", "depth": 2, "min_fraud_score": 0.0}'
```

Expected: Many incoming transactions (customers → merchant)

## File Structure

```
FraudShield-AI/
├── backend/
│   └── main.py                    # API endpoints + graph logic
├── frontend/
│   └── src/app/
│       ├── graph/
│       │   └── page.tsx           # Graph visualization page
│       ├── dashboard/page.tsx     # Updated with graph link
│       └── page.tsx               # Updated with graph link
└── data/
    └── sample_10k.csv             # Sample data with test clients
```

## Next Steps / Future Enhancements

1. **Temporal Analysis:** Show how graph evolves over time steps
2. **Community Detection:** Identify fraud rings automatically
3. **Anomaly Highlighting:** Auto-focus on suspicious clusters
4. **Path Analysis:** Find shortest path between two accounts
5. **Graph Metrics:** Centrality, clustering coefficient, etc.
6. **Export Options:** PNG/SVG image export, JSON format
7. **Search Improvements:** Autocomplete client IDs from data
8. **Filter Panel:** Filter by transaction type, amount range, date
9. **Graph Comparison:** Side-by-side comparison of two accounts
10. **Risk Propagation:** Show how risk spreads through network

## Acceptance Criteria Status

- ✅ Directed graph with arrow directions
- ✅ Nodes: accounts/merchants
- ✅ Edges: transactions with normalized edge_score [0,1]
- ✅ Edge reasons/explanations
- ✅ Hierarchical tree layout (force-directed)
- ✅ Color gradient (green → yellow → orange → red)
- ✅ Edge thickness proportional to score
- ✅ Outgoing edges highlighted (thicker + more saturated)
- ✅ Node size based on risk score
- ✅ Tooltips with transaction details
- ✅ Client ID search input
- ✅ Depth slider (1-3)
- ✅ Build graph button
- ✅ Export to CSV functionality
- ✅ API endpoint returning nodes + edges
- ✅ Heuristic scoring system
- ✅ Node aggregation scoring

## MVP Checklist

- ✅ Depth 1 support
- ✅ CSV export
- ✅ Arrow directions
- ✅ Color coding
- ✅ Depth 2-3 support
- ✅ Interactive tooltips
- ✅ Risk-based filtering
- ✅ Navigation integration

## Support

For issues or questions:
1. Check browser console for errors
2. Verify backend logs for API errors
3. Review this guide for usage patterns
4. Test with provided example client IDs
