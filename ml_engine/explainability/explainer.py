"""
FraudShield AI - Explainability Module
SHAP-based explanations for fraud predictions
"""

import numpy as np
import pandas as pd
import shap
from typing import Dict, List
import warnings
warnings.filterwarnings('ignore')


class FraudExplainer:
    """Generate explanations for fraud predictions"""

    def __init__(self, model, feature_columns: List[str]):
        self.model = model
        self.feature_columns = feature_columns
        self.explainer = None

    def initialize_explainer(self, X_background: np.ndarray, max_samples: int = 100):
        """Initialize SHAP explainer with background data"""
        # Use a subset for efficiency
        background_sample = X_background[:max_samples] if len(X_background) > max_samples else X_background

        # Use KernelExplainer for compatibility with sklearn models
        self.explainer = shap.KernelExplainer(
            lambda x: self.model.predict_proba(x)[:, 1] if hasattr(self.model, 'predict_proba')
            else self.model.decision_function(x),
            background_sample
        )

    def explain_prediction(self, X: np.ndarray, max_display: int = 5) -> Dict:
        """
        Generate SHAP-based explanation for a single prediction

        Returns:
            Dictionary with feature contributions
        """
        if self.explainer is None:
            return {"error": "Explainer not initialized"}

        try:
            shap_values = self.explainer.shap_values(X, nsamples=100)

            # Get top contributing features
            if isinstance(shap_values, list):
                shap_values = shap_values[0]

            abs_shap = np.abs(shap_values[0])
            top_indices = np.argsort(abs_shap)[-max_display:][::-1]

            contributions = {}
            for idx in top_indices:
                feature_name = self.feature_columns[idx]
                contribution = float(shap_values[0][idx])
                feature_value = float(X[0][idx])

                contributions[feature_name] = {
                    'value': feature_value,
                    'contribution': contribution,
                    'impact': 'increases' if contribution > 0 else 'decreases'
                }

            return contributions

        except Exception as e:
            return {"error": f"SHAP explanation failed: {str(e)}"}

    def generate_text_explanation(self, row: pd.Series, shap_contributions: Dict = None) -> str:
        """
        Generate comprehensive text explanation for a transaction

        Args:
            row: Transaction data
            shap_contributions: SHAP feature contributions (optional)

        Returns:
            Human-readable explanation string
        """

        explanation_parts = []

        # Header
        explanation_parts.append(f"🔍 FRAUD ANALYSIS - Transaction {row.get('step', 'N/A')}")
        explanation_parts.append("=" * 60)

        # Transaction details
        explanation_parts.append(f"\n📊 TRANSACTION DETAILS:")
        explanation_parts.append(f"  • Type: {row.get('type', 'N/A')}")
        explanation_parts.append(f"  • Amount: ${row.get('amount', 0):,.2f}")
        explanation_parts.append(f"  • From: {row.get('nameOrig', 'N/A')[:15]}...")
        explanation_parts.append(f"  • To: {row.get('nameDest', 'N/A')[:15]}...")

        # Fraud scores
        explanation_parts.append(f"\n⚠️  FRAUD SCORES:")
        explanation_parts.append(f"  • Overall Fraud Score: {row.get('fraud_score', 0):.2%}")
        explanation_parts.append(f"  • ML Model Score: {row.get('ml_score', 0):.2%}")
        explanation_parts.append(f"  • Rule Engine Score: {row.get('rule_score', 0):.2%}")

        # Risk assessment
        fraud_score = row.get('fraud_score', 0)
        if fraud_score > 0.8:
            risk_level = "🔴 CRITICAL"
        elif fraud_score > 0.6:
            risk_level = "🟠 HIGH"
        elif fraud_score > 0.4:
            risk_level = "🟡 MEDIUM"
        else:
            risk_level = "🟢 LOW"

        explanation_parts.append(f"  • Risk Level: {risk_level}")

        # Key risk indicators
        explanation_parts.append(f"\n🚨 KEY RISK INDICATORS:")

        risk_indicators = []

        # Rule-based flags
        if row.get('rule_amount_anomaly', 0) == 1:
            risk_indicators.append("  ✗ Unusual transaction amount detected")

        if row.get('rule_balance_error', 0) == 1:
            risk_indicators.append("  ✗ Balance calculation mismatch")

        if row.get('rule_zero_balance', 0) == 1:
            risk_indicators.append("  ✗ Account emptied after large transaction")

        if row.get('rule_high_frequency', 0) == 1:
            risk_indicators.append(f"  ✗ High-frequency activity ({row.get('freq', 0)} transactions)")

        if row.get('rule_risky_type', 0) == 1 and fraud_score > 0.5:
            risk_indicators.append(f"  ✗ High-risk transaction type: {row.get('type', 'N/A')}")

        # ML-based flags
        if row.get('ml_isolation_forest_score', 0) > 0.7:
            risk_indicators.append("  ✗ Behavioral pattern anomaly detected")

        if row.get('ml_autoencoder_score', 0) > 0.7:
            risk_indicators.append("  ✗ Neural network flagged unusual characteristics")

        # Additional context
        if row.get('amount', 0) > 100000:
            risk_indicators.append(f"  ✗ Very large amount: ${row['amount']:,.2f}")

        if row.get('newbalanceOrig', 0) == 0 and row.get('oldbalanceOrg', 0) > 0:
            risk_indicators.append("  ✗ Complete account drainage")

        if row.get('isFraud', 0) == 1:
            risk_indicators.append("  ✗ CONFIRMED FRAUD (ground truth)")

        if len(risk_indicators) == 0:
            risk_indicators.append("  • Moderate anomaly score without specific rule violations")

        explanation_parts.extend(risk_indicators)

        # SHAP contributions (if available)
        if shap_contributions and 'error' not in shap_contributions:
            explanation_parts.append(f"\n🧠 ML MODEL INSIGHTS:")
            for feature, info in list(shap_contributions.items())[:5]:
                impact = info['impact']
                contribution = abs(info['contribution'])
                explanation_parts.append(
                    f"  • {feature}: {impact} fraud probability (contribution: {contribution:.3f})"
                )

        # Recommendation
        explanation_parts.append(f"\n💡 RECOMMENDATION:")
        if fraud_score > 0.8:
            explanation_parts.append("  ⛔ BLOCK transaction immediately and flag for investigation")
        elif fraud_score > 0.6:
            explanation_parts.append("  ⚠️  REVIEW required - Request additional verification")
        elif fraud_score > 0.4:
            explanation_parts.append("  👀 MONITOR - Add to watchlist for pattern analysis")
        else:
            explanation_parts.append("  ✅ APPROVE - Transaction appears legitimate")

        explanation_parts.append("=" * 60)

        return "\n".join(explanation_parts)

    def generate_summary_report(self, df: pd.DataFrame) -> str:
        """Generate overall fraud detection summary"""

        total_transactions = len(df)
        suspicious_count = df['is_suspicious'].sum()
        confirmed_fraud = df.get('isFraud', pd.Series([0]*len(df))).sum()

        avg_fraud_score = df['fraud_score'].mean()
        high_risk = (df['fraud_score'] > 0.8).sum()
        medium_risk = ((df['fraud_score'] > 0.6) & (df['fraud_score'] <= 0.8)).sum()

        report = f"""
╔══════════════════════════════════════════════════════════════╗
║            FRAUDSHIELD AI - DETECTION SUMMARY                ║
╚══════════════════════════════════════════════════════════════╝

📈 OVERALL STATISTICS:
  • Total Transactions Analyzed: {total_transactions:,}
  • Suspicious Transactions Detected: {suspicious_count:,} ({suspicious_count/total_transactions*100:.1f}%)
  • Confirmed Fraud Cases: {confirmed_fraud:,}
  • Average Fraud Score: {avg_fraud_score:.2%}

🚨 RISK DISTRIBUTION:
  • Critical Risk (>80%): {high_risk:,} transactions
  • High Risk (60-80%): {medium_risk:,} transactions
  • Medium/Low Risk: {total_transactions - high_risk - medium_risk:,} transactions

🎯 DETECTION BREAKDOWN:
  • ML Model Detections: {(df['ml_score'] > 0.6).sum():,}
  • Rule Engine Detections: {(df['rule_score'] > 0.6).sum():,}
  • Combined Detections: {suspicious_count:,}

💰 FINANCIAL IMPACT:
  • Total Suspicious Amount: ${df[df['is_suspicious']==1]['amount'].sum():,.2f}
  • Average Suspicious Transaction: ${df[df['is_suspicious']==1]['amount'].mean():,.2f}
  • Potential Loss Prevented: ${df[df['is_suspicious']==1]['amount'].sum() * 0.7:,.2f}

═══════════════════════════════════════════════════════════════
"""
        return report
