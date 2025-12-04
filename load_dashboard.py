#!/usr/bin/env python3
"""
Load dashboard analytics data
"""
import requests
import json
import sys

def load_dashboard_data(csv_file):
    """Load dashboard data from API"""

    print(f"📊 Loading dashboard data from {csv_file}...")

    # API endpoint
    url = "http://localhost:8000/api/analyze"

    try:
        # Upload file and get analysis
        with open(csv_file, 'rb') as f:
            files = {'file': f}
            response = requests.post(url, files=files, timeout=120)

        if response.status_code == 200:
            data = response.json()

            # Print summary
            print("\n" + "="*60)
            print("✅ Dashboard Data Loaded Successfully!")
            print("="*60)

            summary = data.get('summary', {})
            print(f"\n📈 Summary Statistics:")
            print(f"  Total Transactions: {summary.get('total_transactions', 0):,}")
            print(f"  Suspicious: {summary.get('suspicious_count', 0):,} ({summary.get('suspicious_percentage', 0):.2f}%)")
            print(f"  High Risk: {summary.get('high_risk_count', 0):,}")
            print(f"  Medium Risk: {summary.get('medium_risk_count', 0):,}")
            print(f"  Avg Fraud Score: {summary.get('average_fraud_score', 0):.4f}")
            print(f"  Total Suspicious Amount: ${summary.get('total_suspicious_amount', 0):,.2f}")

            # Save to JSON file for the dashboard to use
            output_file = "/tmp/fraudshield_dashboard_data.json"
            with open(output_file, 'w') as f:
                json.dump(data, f, indent=2)

            print(f"\n💾 Data saved to: {output_file}")
            print("\nYou can now view this data in the dashboard!")
            print("Dashboard URL: http://localhost:3000/dashboard")

            return data
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            return None

    except requests.exceptions.ConnectionError:
        print("❌ Error: Cannot connect to backend server")
        print("Please make sure the backend is running on http://localhost:8000")
        return None
    except requests.exceptions.Timeout:
        print("❌ Error: Request timeout - the file might be too large")
        return None
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None

if __name__ == "__main__":
    # Use sample data file
    csv_file = "data/sample_10k.csv"

    if len(sys.argv) > 1:
        csv_file = sys.argv[1]

    load_dashboard_data(csv_file)
