"""
FraudShield AI - Main API Server
FastAPI backend for fraud detection system
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Dict, Optional, Set, Tuple
import pandas as pd
import numpy as np
import io
import os
import sys
from datetime import datetime
import json
import tempfile
import threading
from collections import deque
from dotenv import load_dotenv

load_dotenv()

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml_engine.models.hybrid_fraud_detector import HybridFraudDetector
from ml_engine.explainability.explainer import FraudExplainer
from utils.helpers import get_risk_level

app = FastAPI(
    title="FraudShield AI API",
    description="Advanced Fraud Detection System for Financial Transactions",
    version="2.0.0"
)

# CORS configuration - Must be added before any routes
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS + ["https://fraud-shield-ai.vercel.app"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Global model instances with thread safety
fraud_detector: Optional[HybridFraudDetector] = None
fraud_explainer: Optional[FraudExplainer] = None
training_data: Optional[pd.DataFrame] = None
model_lock = threading.Lock()


class TransactionAnalysis(BaseModel):
    """Response model for transaction analysis"""
    transaction_id: int
    fraud_score: float
    is_suspicious: bool
    risk_level: str
    explanation: str
    ml_score: float
    rule_score: float


class DetectionSummary(BaseModel):
    """Summary statistics for fraud detection"""
    total_transactions: int
    suspicious_count: int
    suspicious_percentage: float
    average_fraud_score: float
    high_risk_count: int
    medium_risk_count: int
    total_suspicious_amount: float


class PersonDetails(BaseModel):
    """Detailed information about a person/account"""
    name: str
    account_type: str  # "Customer" or "Merchant"
    location: Optional[str] = None
    age: Optional[int] = None
    occupation: Optional[str] = None
    photo_url: Optional[str] = None
    registration_date: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    kyc_verified: bool = False


class GraphNode(BaseModel):
    """Node in the ego-tree graph"""
    id: str
    label: str
    risk_score: float
    risk_level: str
    transaction_count: int
    total_amount_sent: float
    total_amount_received: float
    is_ego: bool
    depth: int
    person_details: Optional[PersonDetails] = None


class GraphEdge(BaseModel):
    """Edge in the ego-tree graph"""
    source: str
    target: str
    amount: float
    fraud_score: float
    edge_score: float
    transaction_type: str
    step: int
    is_fraud: int
    reasons: List[str]
    is_outgoing_from_ego: bool


class EgoTreeRequest(BaseModel):
    """Request model for ego-tree graph"""
    client_id: str
    depth: int = 2
    min_fraud_score: float = 0.0
    limit: int = 100


class EgoTreeResponse(BaseModel):
    """Response model for ego-tree graph"""
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    summary: Dict


@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "service": "FraudShield AI",
        "version": "2.0.0",
        "status": "operational",
        "model_trained": fraud_detector is not None,
        "description": "Advanced hybrid fraud detection system combining ML and rule-based approaches"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "model_ready": fraud_detector is not None
    }


@app.post("/api/train")
async def train_model(file: UploadFile = File(...)):
    """
    Train the fraud detection model on uploaded data
    """
    global fraud_detector, fraud_explainer, training_data

    with model_lock:
        try:
            print(f"\n{'='*60}")
            print(f"🎓 Training Request Received")
            print(f"{'='*60}")
            print(f"📁 File: {file.filename}")

            # Read uploaded CSV
            contents = await file.read()
            df = pd.read_csv(io.BytesIO(contents))
            print(f"✅ Loaded {len(df)} transactions")

            # Validate required columns
            required_columns = ['step', 'type', 'amount', 'nameOrig', 'oldbalanceOrg',
                               'newbalanceOrig', 'nameDest', 'oldbalanceDest',
                               'newbalanceDest']

            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                print(f"❌ Missing columns: {missing_columns}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Missing required columns: {missing_columns}"
                )

            # Store training data
            training_data = df.copy()

            # Initialize and train model
            print("🤖 Initializing fraud detector...")
            fraud_detector = HybridFraudDetector()
            print("🔧 Training model (this may take a moment)...")
            fraud_detector.train(df)

            # Initialize explainer
            _, X = fraud_detector.prepare_features(df)
            print("🔍 Initializing explainer...")
            fraud_explainer = FraudExplainer(
                fraud_detector.isolation_forest,
                fraud_detector.feature_columns
            )

            print(f"\n✅ Training Complete!")
            print(f"  Training Samples: {len(df)}")
            print(f"  Features Used: {len(fraud_detector.feature_columns)}")
            print(f"{'='*60}\n")

            return {
                "status": "success",
                "message": "Model trained successfully",
                "training_samples": len(df),
                "features_used": len(fraud_detector.feature_columns)
            }

        except HTTPException:
            raise
        except Exception as e:
            print(f"❌ Training failed: {str(e)}")
            import traceback
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")


@app.post("/api/detect")
async def detect_fraud(file: UploadFile = File(...)):
    """
    Detect fraud in uploaded transaction data
    """
    global fraud_detector, fraud_explainer

    if fraud_detector is None:
        raise HTTPException(
            status_code=400,
            detail="Model not trained. Please train the model first using /api/train endpoint"
        )

    with model_lock:
        try:
            # Read uploaded CSV
            contents = await file.read()
            df = pd.read_csv(io.BytesIO(contents))

            # Validate columns
            required_columns = ['step', 'type', 'amount', 'nameOrig', 'oldbalanceOrg',
                               'newbalanceOrig', 'nameDest', 'oldbalanceDest',
                               'newbalanceDest']

            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                raise HTTPException(
                    status_code=400,
                    detail=f"Missing required columns: {missing_columns}"
                )

            # Run fraud detection
            results_df = fraud_detector.predict(df)

            # Add transaction IDs if not present
            if 'transaction_id' not in results_df.columns:
                results_df['transaction_id'] = range(1, len(results_df) + 1)

            # Generate explanations for suspicious transactions
            suspicious_mask = results_df['is_suspicious'] == 1
            results_df['explanation'] = ''

            for idx in results_df[suspicious_mask].index:
                row = results_df.loc[idx]
                explanation = fraud_detector.explain_transaction(row)
                results_df.at[idx, 'explanation'] = explanation

            # Add risk levels
            results_df['risk_level'] = results_df['fraud_score'].apply(get_risk_level)

            # Save results (cross-platform compatible)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_dir = os.path.join(tempfile.gettempdir(), "fraudshield_results")
            os.makedirs(output_dir, exist_ok=True)

            # Save CSV
            csv_path = f"{output_dir}/fraud_results_{timestamp}.csv"
            results_df.to_csv(csv_path, index=False)

            # Save Excel
            xlsx_path = f"{output_dir}/fraud_results_{timestamp}.xlsx"
            results_df.to_excel(xlsx_path, index=False, engine='openpyxl')

            # Generate summary statistics
            summary = {
                "total_transactions": len(results_df),
                "suspicious_count": int(results_df['is_suspicious'].sum()),
                "suspicious_percentage": float(results_df['is_suspicious'].mean() * 100),
                "average_fraud_score": float(results_df['fraud_score'].mean()),
                "high_risk_count": int((results_df['fraud_score'] > 0.8).sum()),
                "medium_risk_count": int(((results_df['fraud_score'] > 0.6) &
                                         (results_df['fraud_score'] <= 0.8)).sum()),
                "total_suspicious_amount": float(results_df[results_df['is_suspicious']==1]['amount'].sum()),
                "csv_file": csv_path,
                "xlsx_file": xlsx_path
            }

            return {
                "status": "success",
                "summary": summary,
                "download_links": {
                    "csv": f"/api/download/{os.path.basename(csv_path)}",
                    "xlsx": f"/api/download/{os.path.basename(xlsx_path)}"
                }
            }

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")


@app.post("/api/analyze")
async def analyze_transactions(file: UploadFile = File(...)):
    """
    Comprehensive analysis with detailed results for frontend display
    """
    global fraud_detector

    print(f"\n{'='*60}")
    print(f"📊 Analysis Request Received")
    print(f"{'='*60}")

    if fraud_detector is None:
        print("❌ ERROR: Model not trained!")
        raise HTTPException(
            status_code=400,
            detail="Model not trained. Please train the model first using the /api/train endpoint."
        )

    try:
        print(f"📁 Reading file: {file.filename}")
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        print(f"✅ File loaded: {len(df)} transactions")

        # Validate required columns
        required_columns = ['step', 'type', 'amount', 'nameOrig', 'oldbalanceOrg',
                           'newbalanceOrig', 'nameDest', 'oldbalanceDest',
                           'newbalanceDest']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            print(f"❌ Missing columns: {missing_columns}")
            raise HTTPException(
                status_code=400,
                detail=f"Missing required columns: {missing_columns}"
            )

        # Run detection
        print("🔍 Running fraud detection...")
        results_df = fraud_detector.predict(df)
        print(f"✅ Detection complete")

        # Add transaction IDs
        if 'transaction_id' not in results_df.columns:
            results_df['transaction_id'] = range(1, len(results_df) + 1)

        # Risk levels (for all transactions - needed for summary stats)
        results_df['risk_level'] = results_df['fraud_score'].apply(get_risk_level)

        # Limit to first 1000 transactions for performance
        results_df_limited = results_df.head(1000).copy()

        # Generate explanations (only for limited set)
        print("📝 Generating explanations for suspicious transactions...")
        results_df_limited['explanation'] = results_df_limited.apply(
            lambda row: fraud_detector.explain_transaction(row) if row['is_suspicious'] == 1 else "",
            axis=1
        )

        # Prepare response data
        print("📦 Preparing response data...")
        transactions = []
        for _, row in results_df_limited.iterrows():
            transactions.append({
                "transaction_id": int(row['transaction_id']),
                "step": int(row['step']),
                "type": row['type'],
                "amount": float(row['amount']),
                "nameOrig": row['nameOrig'],
                "nameDest": row['nameDest'],
                "fraud_score": float(row['fraud_score']),
                "ml_score": float(row['ml_score']),
                "rule_score": float(row['rule_score']),
                "is_suspicious": bool(row['is_suspicious']),
                "risk_level": row['risk_level'],
                "explanation": row['explanation']
            })

        # Summary statistics
        summary = {
            "total_transactions": len(results_df),
            "suspicious_count": int(results_df['is_suspicious'].sum()),
            "suspicious_percentage": float(results_df['is_suspicious'].mean() * 100),
            "average_fraud_score": float(results_df['fraud_score'].mean()),
            "high_risk_count": int((results_df['fraud_score'] > 0.8).sum()),
            "medium_risk_count": int(((results_df['fraud_score'] > 0.6) &
                                     (results_df['fraud_score'] <= 0.8)).sum()),
            "total_suspicious_amount": float(results_df[results_df['is_suspicious']==1]['amount'].sum())
        }

        # Distribution data for charts
        # Convert fraud_score to bins and make them JSON-serializable
        fraud_score_bins = pd.cut(results_df['fraud_score'], bins=10)
        fraud_score_counts = fraud_score_bins.value_counts().sort_index()
        fraud_score_distribution = {
            f"{interval.left:.2f}-{interval.right:.2f}": int(count)
            for interval, count in fraud_score_counts.items()
        }

        type_distribution = {str(k): int(v) for k, v in results_df['type'].value_counts().to_dict().items()}
        risk_distribution = {str(k): int(v) for k, v in results_df['risk_level'].value_counts().to_dict().items()}

        print(f"\n📊 Analysis Summary:")
        print(f"  Total Transactions: {summary['total_transactions']}")
        print(f"  Suspicious: {summary['suspicious_count']} ({summary['suspicious_percentage']:.2f}%)")
        print(f"  High Risk: {summary['high_risk_count']}")
        print(f"  Avg Fraud Score: {summary['average_fraud_score']:.4f}")
        print(f"{'='*60}\n")

        return {
            "status": "success",
            "summary": summary,
            "transactions": transactions,
            "distributions": {
                "fraud_scores": fraud_score_distribution,
                "transaction_types": type_distribution,
                "risk_levels": risk_distribution
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ ERROR during analysis: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.get("/api/download/{filename}")
async def download_file(filename: str):
    """Download generated result files"""
    output_dir = os.path.join(tempfile.gettempdir(), "fraudshield_results")
    file_path = os.path.join(output_dir, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        path=file_path,
        filename=filename,
        media_type='application/octet-stream'
    )


@app.get("/api/stats")
async def get_statistics():
    """Get current detection statistics"""
    if training_data is None:
        raise HTTPException(status_code=400, detail="No data available")

    return {
        "training_samples": len(training_data),
        "model_features": len(fraud_detector.feature_columns) if fraud_detector else 0,
        "model_status": "trained" if fraud_detector else "not_trained"
    }


def generate_person_details(account_id: str, df: pd.DataFrame) -> Dict:
    """
    Generate mock person details for an account ID
    In a real system, this would query a customer database
    """
    # Determine account type (C = Customer, M = Merchant)
    is_merchant = account_id.startswith('M')
    account_type = "Merchant" if is_merchant else "Customer"

    # Generate deterministic data based on account ID hash
    import hashlib
    hash_val = int(hashlib.md5(account_id.encode()).hexdigest(), 16)

    # Sample data pools
    first_names = ["John", "Sarah", "Michael", "Emma", "David", "Lisa", "James", "Maria",
                   "Robert", "Jennifer", "William", "Linda", "Richard", "Patricia", "Cristiano"]
    last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
                  "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Ronaldo"]
    cities = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia",
              "San Antonio", "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville",
              "London", "Paris", "Tokyo", "Sydney", "Dubai", "Singapore", "Mumbai", "Lisbon"]
    occupations_customer = ["Software Engineer", "Teacher", "Doctor", "Lawyer", "Accountant",
                           "Entrepreneur", "Manager", "Consultant", "Analyst", "Designer",
                           "Professional Athlete", "Business Owner", "Investor"]
    occupations_merchant = ["Retail Store", "Restaurant", "Online Shop", "Service Provider",
                           "Wholesale Supplier", "Technology Company", "Consulting Firm"]

    # Generate consistent data
    first_name = first_names[hash_val % len(first_names)]
    last_name = last_names[(hash_val // 100) % len(last_names)]

    # Special case for Cristiano Ronaldo-like IDs
    if "Ronaldo" in last_name or hash_val % 100 == 7:  # 7 is Ronaldo's number
        first_name = "Cristiano"
        last_name = "Ronaldo"

    name = f"{first_name} {last_name}" if not is_merchant else f"{first_name} {last_name} {account_type}"
    location = cities[hash_val % len(cities)]
    age = 25 + (hash_val % 40) if not is_merchant else None
    occupation = (occupations_customer[hash_val % len(occupations_customer)] if not is_merchant
                  else occupations_merchant[hash_val % len(occupations_merchant)])

    # Generate photo URL (using placeholder service)
    photo_seed = hash_val % 1000
    if first_name == "Cristiano" and last_name == "Ronaldo":
        photo_url = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Cristiano_Ronaldo_playing_for_Al_Nassr_FC_against_Persepolis%2C_September_2023_%28cropped%29.jpg/220px-Cristiano_Ronaldo_playing_for_Al_Nassr_FC_against_Persepolis%2C_September_2023_%28cropped%29.jpg"
    else:
        photo_url = f"https://i.pravatar.cc/300?img={photo_seed % 70}"

    # KYC verified based on transaction volume
    account_txs = df[(df['nameOrig'] == account_id) | (df['nameDest'] == account_id)]
    total_volume = account_txs['amount'].sum() if len(account_txs) > 0 else 0
    kyc_verified = total_volume > 50000

    # Registration date (mock)
    from datetime import datetime, timedelta
    days_ago = hash_val % 1000
    reg_date = (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d")

    return {
        "name": name,
        "account_type": account_type,
        "location": location,
        "age": age,
        "occupation": occupation,
        "photo_url": photo_url,
        "registration_date": reg_date,
        "email": f"{first_name.lower()}.{last_name.lower()}@{'merchant' if is_merchant else 'example'}.com",
        "phone": f"+1 ({(hash_val % 900) + 100:03d}) {(hash_val % 900) + 100:03d}-{hash_val % 9000 + 1000:04d}",
        "kyc_verified": kyc_verified
    }


def calculate_edge_score(row: pd.Series) -> Tuple[float, List[str]]:
    """
    Calculate normalized edge score [0,1] and reasons for an edge
    Uses heuristic scoring when ML is not available
    """
    reasons = []
    score_components = []

    # Component 1: Amount-based risk (0-1)
    amount = row['amount']
    if amount > 100000:
        score_components.append(0.8)
        reasons.append(f"Very high amount: ${amount:,.2f}")
    elif amount > 50000:
        score_components.append(0.6)
        reasons.append(f"High amount: ${amount:,.2f}")
    elif amount > 10000:
        score_components.append(0.4)
        reasons.append(f"Elevated amount: ${amount:,.2f}")
    else:
        score_components.append(0.1)

    # Component 2: Transaction type risk
    tx_type = row['type']
    if tx_type in ['TRANSFER', 'CASH_OUT']:
        score_components.append(0.7)
        reasons.append(f"Risky transaction type: {tx_type}")
    elif tx_type == 'PAYMENT':
        score_components.append(0.4)
    else:
        score_components.append(0.2)

    # Component 3: Balance anomalies
    if row.get('newbalanceOrig', 0) == 0 and amount > 10000:
        score_components.append(0.9)
        reasons.append("Account drained to zero")
    elif row.get('oldbalanceOrg', 0) > 0:
        balance_ratio = amount / row['oldbalanceOrg']
        if balance_ratio > 0.9:
            score_components.append(0.7)
            reasons.append(f"Large portion of balance: {balance_ratio*100:.1f}%")
        else:
            score_components.append(0.2)
    else:
        score_components.append(0.3)

    # Component 4: Use fraud_score if available
    if 'fraud_score' in row and pd.notna(row['fraud_score']):
        score_components.append(float(row['fraud_score']))
        if row['fraud_score'] > 0.8:
            reasons.append(f"ML fraud score: {row['fraud_score']:.2f}")

    # Calculate average score
    edge_score = np.mean(score_components)

    # Add isFraud info if available
    if 'isFraud' in row and row['isFraud'] == 1:
        edge_score = max(edge_score, 0.85)
        reasons.append("Confirmed fraud")

    if not reasons:
        reasons.append("Normal transaction")

    return float(edge_score), reasons


def build_ego_tree(client_id: str, df: pd.DataFrame, depth: int = 2,
                   min_fraud_score: float = 0.0, limit: int = 100) -> Dict:
    """
    Build ego-centric directed transaction graph using BFS

    Args:
        client_id: The account ID to center the graph on
        df: DataFrame with transaction data (must have fraud scores)
        depth: Maximum depth to traverse (1-3)
        min_fraud_score: Minimum fraud score to include edge
        limit: Maximum number of nodes to include

    Returns:
        Dictionary with nodes, edges, and summary statistics
    """
    # Validate client exists
    if client_id not in df['nameOrig'].values and client_id not in df['nameDest'].values:
        raise ValueError(f"Client ID '{client_id}' not found in transaction data")

    # Data structures
    nodes_dict: Dict[str, Dict] = {}
    edges_list: List[Dict] = []
    visited: Set[str] = set()

    # BFS queue: (account_id, current_depth)
    queue: deque = deque([(client_id, 0)])
    visited.add(client_id)

    # Initialize ego node
    nodes_dict[client_id] = {
        'id': client_id,
        'label': client_id[:10] + '...' if len(client_id) > 10 else client_id,
        'depth': 0,
        'is_ego': True,
        'transaction_count': 0,
        'total_amount_sent': 0.0,
        'total_amount_received': 0.0,
        'outgoing_scores': [],
        'incoming_scores': []
    }

    while queue and len(nodes_dict) < limit:
        current_id, current_depth = queue.popleft()

        if current_depth >= depth:
            continue

        # Find all outgoing transactions (current_id as origin)
        outgoing = df[df['nameOrig'] == current_id].copy()

        for _, tx in outgoing.iterrows():
            # Calculate edge score
            edge_score, reasons = calculate_edge_score(tx)

            # Apply fraud score filter
            if edge_score < min_fraud_score:
                continue

            target_id = tx['nameDest']

            # Update source node stats
            nodes_dict[current_id]['transaction_count'] += 1
            nodes_dict[current_id]['total_amount_sent'] += float(tx['amount'])
            nodes_dict[current_id]['outgoing_scores'].append(edge_score)

            # Initialize target node if new
            if target_id not in nodes_dict:
                nodes_dict[target_id] = {
                    'id': target_id,
                    'label': target_id[:10] + '...' if len(target_id) > 10 else target_id,
                    'depth': current_depth + 1,
                    'is_ego': False,
                    'transaction_count': 0,
                    'total_amount_sent': 0.0,
                    'total_amount_received': 0.0,
                    'outgoing_scores': [],
                    'incoming_scores': []
                }

            # Update target node stats
            nodes_dict[target_id]['transaction_count'] += 1
            nodes_dict[target_id]['total_amount_received'] += float(tx['amount'])
            nodes_dict[target_id]['incoming_scores'].append(edge_score)

            # Add edge
            edges_list.append({
                'source': current_id,
                'target': target_id,
                'amount': float(tx['amount']),
                'fraud_score': float(tx.get('fraud_score', edge_score)),
                'edge_score': edge_score,
                'transaction_type': tx['type'],
                'step': int(tx['step']),
                'is_fraud': int(tx.get('isFraud', 0)),
                'reasons': reasons,
                'is_outgoing_from_ego': (current_id == client_id)
            })

            # Add to queue for BFS
            if target_id not in visited and len(nodes_dict) < limit:
                visited.add(target_id)
                queue.append((target_id, current_depth + 1))

        # Also find incoming transactions (current_id as destination)
        incoming = df[df['nameDest'] == current_id].copy()

        for _, tx in incoming.iterrows():
            edge_score, reasons = calculate_edge_score(tx)

            if edge_score < min_fraud_score:
                continue

            source_id = tx['nameOrig']

            # Update destination node stats
            nodes_dict[current_id]['transaction_count'] += 1
            nodes_dict[current_id]['total_amount_received'] += float(tx['amount'])
            nodes_dict[current_id]['incoming_scores'].append(edge_score)

            # Initialize source node if new
            if source_id not in nodes_dict:
                nodes_dict[source_id] = {
                    'id': source_id,
                    'label': source_id[:10] + '...' if len(source_id) > 10 else source_id,
                    'depth': current_depth + 1,
                    'is_ego': False,
                    'transaction_count': 0,
                    'total_amount_sent': 0.0,
                    'total_amount_received': 0.0,
                    'outgoing_scores': [],
                    'incoming_scores': []
                }

            # Update source node stats
            nodes_dict[source_id]['transaction_count'] += 1
            nodes_dict[source_id]['total_amount_sent'] += float(tx['amount'])
            nodes_dict[source_id]['outgoing_scores'].append(edge_score)

            # Add edge
            edges_list.append({
                'source': source_id,
                'target': current_id,
                'amount': float(tx['amount']),
                'fraud_score': float(tx.get('fraud_score', edge_score)),
                'edge_score': edge_score,
                'transaction_type': tx['type'],
                'step': int(tx['step']),
                'is_fraud': int(tx.get('isFraud', 0)),
                'reasons': reasons,
                'is_outgoing_from_ego': False
            })

            # Add to queue
            if source_id not in visited and len(nodes_dict) < limit:
                visited.add(source_id)
                queue.append((source_id, current_depth + 1))

    # Calculate node risk scores (aggregate of edge scores)
    nodes_list = []
    for node_data in nodes_dict.values():
        all_scores = node_data['outgoing_scores'] + node_data['incoming_scores']
        node_risk_score = np.mean(all_scores) if all_scores else 0.0

        # Generate person details for each node
        person_details = generate_person_details(node_data['id'], df)

        nodes_list.append({
            'id': node_data['id'],
            'label': node_data['label'],
            'risk_score': float(node_risk_score),
            'risk_level': get_risk_level(node_risk_score),
            'transaction_count': node_data['transaction_count'],
            'total_amount_sent': node_data['total_amount_sent'],
            'total_amount_received': node_data['total_amount_received'],
            'is_ego': node_data['is_ego'],
            'depth': node_data['depth'],
            'person_details': person_details
        })

    # Calculate summary statistics
    edge_scores = [e['edge_score'] for e in edges_list]
    node_risk_scores = [n['risk_score'] for n in nodes_list]

    summary = {
        'total_nodes': len(nodes_list),
        'total_edges': len(edges_list),
        'high_risk_edges': sum(1 for s in edge_scores if s > 0.8),
        'medium_risk_edges': sum(1 for s in edge_scores if 0.6 < s <= 0.8),
        'low_risk_edges': sum(1 for s in edge_scores if s <= 0.6),
        'avg_edge_score': float(np.mean(edge_scores)) if edge_scores else 0.0,
        'avg_node_risk': float(np.mean(node_risk_scores)) if node_risk_scores else 0.0,
        'max_depth_reached': max([n['depth'] for n in nodes_list]),
        'ego_node_id': client_id
    }

    return {
        'nodes': nodes_list,
        'edges': edges_list,
        'summary': summary
    }


@app.post("/api/graph/ego-tree", response_model=EgoTreeResponse)
async def get_ego_tree(request: EgoTreeRequest):
    """
    Build and return ego-centric transaction graph for a client

    Query Parameters:
        client_id: Account ID to center the graph on
        depth: Maximum traversal depth (1-3, default: 2)
        min_fraud_score: Minimum edge score to include (0-1, default: 0.0)
        limit: Maximum number of nodes (default: 100)
    """
    global training_data, fraud_detector

    print(f"\n{'='*60}")
    print(f"📊 Ego-Tree Graph Request")
    print(f"{'='*60}")
    print(f"Client ID: {request.client_id}")
    print(f"Depth: {request.depth}")
    print(f"Min Fraud Score: {request.min_fraud_score}")
    print(f"Limit: {request.limit}")

    # Validate model and data - auto-load from default CSV if not available
    if training_data is None:
        # Try to load from default sample data
        default_csv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "sample_10k.csv")
        if os.path.exists(default_csv_path):
            print(f"📁 Loading data from {default_csv_path}...")
            try:
                training_data = pd.read_csv(default_csv_path)
                print(f"✅ Loaded {len(training_data)} transactions from default dataset")
            except Exception as e:
                print(f"❌ Failed to load default data: {str(e)}")
                raise HTTPException(
                    status_code=400,
                    detail="No training data available. Please train the model first on the upload page."
                )
        else:
            raise HTTPException(
                status_code=400,
                detail="No training data available. Please train the model first on the upload page."
            )

    # Validate depth
    if not 1 <= request.depth <= 3:
        raise HTTPException(
            status_code=400,
            detail="Depth must be between 1 and 3"
        )

    try:
        # Run fraud detection if not already done
        df = training_data.copy()

        if fraud_detector and 'fraud_score' not in df.columns:
            print("🔍 Running fraud detection on training data...")
            df = fraud_detector.predict(df)
        elif 'fraud_score' not in df.columns:
            # If no model trained, use isFraud as fraud_score if available
            if 'isFraud' in df.columns:
                df['fraud_score'] = df['isFraud'].astype(float)
            else:
                # Create basic heuristic scores
                df['fraud_score'] = 0.5

        print(f"🌳 Building ego-tree graph...")
        graph_data = build_ego_tree(
            client_id=request.client_id,
            df=df,
            depth=request.depth,
            min_fraud_score=request.min_fraud_score,
            limit=request.limit
        )

        print(f"✅ Graph built successfully")
        print(f"  Nodes: {graph_data['summary']['total_nodes']}")
        print(f"  Edges: {graph_data['summary']['total_edges']}")
        print(f"  High Risk Edges: {graph_data['summary']['high_risk_edges']}")
        print(f"{'='*60}\n")

        return graph_data

    except ValueError as e:
        print(f"❌ ERROR: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to build graph: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
