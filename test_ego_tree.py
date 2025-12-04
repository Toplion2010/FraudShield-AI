#!/usr/bin/env python3
"""
Test script for Ego-Tree Graph API
Tests the /api/graph/ego-tree endpoint with sample data
"""

import requests
import json
import sys

API_BASE = "http://localhost:8000"

def test_health():
    """Test if API is running"""
    try:
        response = requests.get(f"{API_BASE}/health")
        print(f"✓ API Health: {response.json()}")
        return True
    except Exception as e:
        print(f"✗ API not running: {e}")
        return False

def test_train_model():
    """Train the model with sample data"""
    print("\n📚 Training model with sample_10k.csv...")
    try:
        with open('data/sample_10k.csv', 'rb') as f:
            files = {'file': ('sample_10k.csv', f, 'text/csv')}
            response = requests.post(f"{API_BASE}/api/train", files=files)

        if response.status_code == 200:
            print(f"✓ Model trained: {response.json()}")
            return True
        else:
            print(f"✗ Training failed: {response.text}")
            return False
    except Exception as e:
        print(f"✗ Training error: {e}")
        return False

def test_ego_tree(client_id, depth=2, min_score=0.0):
    """Test ego-tree graph generation"""
    print(f"\n🌳 Building ego-tree for client: {client_id}")
    print(f"   Depth: {depth}, Min Score: {min_score}")

    try:
        payload = {
            "client_id": client_id,
            "depth": depth,
            "min_fraud_score": min_score,
            "limit": 100
        }

        response = requests.post(
            f"{API_BASE}/api/graph/ego-tree",
            json=payload,
            headers={"Content-Type": "application/json"}
        )

        if response.status_code == 200:
            data = response.json()
            print(f"\n✓ Graph built successfully!")
            print(f"   Nodes: {data['summary']['total_nodes']}")
            print(f"   Edges: {data['summary']['total_edges']}")
            print(f"   High Risk Edges: {data['summary']['high_risk_edges']}")
            print(f"   Medium Risk Edges: {data['summary']['medium_risk_edges']}")
            print(f"   Low Risk Edges: {data['summary']['low_risk_edges']}")
            print(f"   Avg Edge Score: {data['summary']['avg_edge_score']:.2f}")
            print(f"   Avg Node Risk: {data['summary']['avg_node_risk']:.2f}")
            print(f"   Max Depth: {data['summary']['max_depth_reached']}")

            # Show first few nodes
            print(f"\n   Sample Nodes:")
            for node in data['nodes'][:3]:
                print(f"     - {node['id']}: Risk={node['risk_score']:.2f} ({node['risk_level']}), "
                      f"TXs={node['transaction_count']}, Ego={node['is_ego']}")

            # Show first few edges
            print(f"\n   Sample Edges:")
            for edge in data['edges'][:3]:
                print(f"     - {edge['source']} → {edge['target']}: "
                      f"${edge['amount']:.2f}, Score={edge['edge_score']:.2f}, "
                      f"Type={edge['transaction_type']}")
                print(f"       Reasons: {', '.join(edge['reasons'])}")

            return True
        else:
            print(f"✗ Graph build failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return False

    except Exception as e:
        print(f"✗ Graph build error: {e}")
        return False

def main():
    """Run all tests"""
    print("="*60)
    print("Ego-Tree Graph API Test Suite")
    print("="*60)

    # Test 1: Health check
    if not test_health():
        print("\n❌ API is not running. Start it with:")
        print("   cd backend && python main.py")
        sys.exit(1)

    # Test 2: Train model
    if not test_train_model():
        print("\n❌ Model training failed")
        sys.exit(1)

    # Test 3: Test with known client IDs
    test_cases = [
        ("C1231006815", 2, 0.0, "Normal payment transactions"),
        ("C1305486145", 2, 0.0, "Fraudulent TRANSFER"),
        ("C840083671", 1, 0.0, "Fraudulent CASH_OUT"),
        ("M1108211033", 2, 0.0, "Merchant account (user selection)"),
    ]

    results = []
    for client_id, depth, min_score, description in test_cases:
        print(f"\n{'='*60}")
        print(f"Test Case: {description}")
        success = test_ego_tree(client_id, depth, min_score)
        results.append((description, success))

    # Summary
    print(f"\n{'='*60}")
    print("Test Summary")
    print("="*60)
    for description, success in results:
        status = "✓ PASS" if success else "✗ FAIL"
        print(f"{status}: {description}")

    all_passed = all(success for _, success in results)
    if all_passed:
        print("\n✅ All tests passed!")
        print("\n🎉 Ego-Tree Graph feature is ready to use!")
        print("\nNext steps:")
        print("1. Start the frontend: cd frontend && npm run dev")
        print("2. Navigate to: http://localhost:3000/graph")
        print("3. Enter a client ID and build your first graph!")
    else:
        print("\n❌ Some tests failed")
        sys.exit(1)

if __name__ == "__main__":
    main()
