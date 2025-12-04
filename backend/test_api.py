"""
Quick test script for FraudShield AI API
Run after starting the backend server
"""

import requests
import pandas as pd
import sys
import os

API_URL = "http://localhost:8000"

def test_health():
    """Test health check endpoint"""
    print("🔍 Testing health check...")
    response = requests.get(f"{API_URL}/health")
    if response.status_code == 200:
        print("✅ Health check passed")
        print(f"   Response: {response.json()}")
        return True
    else:
        print(f"❌ Health check failed: {response.status_code}")
        return False

def test_train(csv_file):
    """Test model training endpoint"""
    print(f"\n🔧 Training model with {csv_file}...")

    if not os.path.exists(csv_file):
        print(f"❌ File not found: {csv_file}")
        return False

    with open(csv_file, 'rb') as f:
        files = {'file': (os.path.basename(csv_file), f, 'text/csv')}
        response = requests.post(f"{API_URL}/api/train", files=files)

    if response.status_code == 200:
        print("✅ Model trained successfully")
        data = response.json()
        print(f"   Training samples: {data.get('training_samples', 'N/A')}")
        print(f"   Features used: {data.get('features_used', 'N/A')}")
        return True
    else:
        print(f"❌ Training failed: {response.status_code}")
        print(f"   Error: {response.text}")
        return False

def test_detect(csv_file):
    """Test fraud detection endpoint"""
    print(f"\n🔍 Detecting fraud in {csv_file}...")

    if not os.path.exists(csv_file):
        print(f"❌ File not found: {csv_file}")
        return False

    with open(csv_file, 'rb') as f:
        files = {'file': (os.path.basename(csv_file), f, 'text/csv')}
        response = requests.post(f"{API_URL}/api/detect", files=files)

    if response.status_code == 200:
        print("✅ Fraud detection completed")
        data = response.json()
        summary = data.get('summary', {})

        print(f"\n📊 Detection Summary:")
        print(f"   Total Transactions: {summary.get('total_transactions', 0):,}")
        print(f"   Suspicious Count: {summary.get('suspicious_count', 0):,}")
        print(f"   Suspicious %: {summary.get('suspicious_percentage', 0):.2f}%")
        print(f"   Average Fraud Score: {summary.get('average_fraud_score', 0):.2%}")
        print(f"   High Risk Count: {summary.get('high_risk_count', 0):,}")
        print(f"   Total Suspicious Amount: ${summary.get('total_suspicious_amount', 0):,.2f}")

        print(f"\n💾 Download links:")
        print(f"   CSV: {API_URL}{data['download_links']['csv']}")
        print(f"   Excel: {API_URL}{data['download_links']['xlsx']}")

        return True
    else:
        print(f"❌ Detection failed: {response.status_code}")
        print(f"   Error: {response.text}")
        return False

def main():
    """Run all tests"""
    print("=" * 60)
    print("FraudShield AI - API Test Suite")
    print("=" * 60)

    # Check if CSV file is provided
    if len(sys.argv) < 2:
        print("\n⚠️  Please provide a CSV file path")
        print("Usage: python test_api.py <path_to_csv>")
        print("\nExample:")
        print("  python test_api.py ../data/Synthetic_Financial_datasets_log.csv")
        sys.exit(1)

    csv_file = sys.argv[1]

    # Run tests
    if not test_health():
        print("\n❌ API server is not running. Please start the backend first:")
        print("   cd backend && python main.py")
        sys.exit(1)

    if not test_train(csv_file):
        sys.exit(1)

    if not test_detect(csv_file):
        sys.exit(1)

    print("\n" + "=" * 60)
    print("✅ All tests passed!")
    print("=" * 60)
    print("\n🌐 You can now access:")
    print(f"   • API Documentation: {API_URL}/docs")
    print(f"   • Frontend: http://localhost:3000")

if __name__ == "__main__":
    main()
