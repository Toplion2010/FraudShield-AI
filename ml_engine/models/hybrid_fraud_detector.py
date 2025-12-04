"""
FraudShield AI - Hybrid Fraud Detection Model
Combines ML (Isolation Forest + AutoEncoder) with Rule-Based Engine
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from typing import Dict, List, Tuple
import warnings
warnings.filterwarnings('ignore')

# Try to import TensorFlow, but make it optional
try:
    import tensorflow as tf
    from tensorflow import keras
    TENSORFLOW_AVAILABLE = True
except ImportError:
    TENSORFLOW_AVAILABLE = False
    print("⚠️  TensorFlow not available. AutoEncoder will be disabled.")


class AutoEncoder:
    """AutoEncoder for anomaly detection"""

    def __init__(self, input_dim: int, encoding_dim: int = 8):
        self.input_dim = input_dim
        self.encoding_dim = encoding_dim
        self.model = None
        self.threshold = None
        self.scaler = StandardScaler()

    def build_model(self):
        """Build AutoEncoder architecture"""
        input_layer = keras.layers.Input(shape=(self.input_dim,))

        # Encoder
        encoded = keras.layers.Dense(32, activation='relu')(input_layer)
        encoded = keras.layers.Dropout(0.2)(encoded)
        encoded = keras.layers.Dense(16, activation='relu')(encoded)
        encoded = keras.layers.Dense(self.encoding_dim, activation='relu')(encoded)

        # Decoder
        decoded = keras.layers.Dense(16, activation='relu')(encoded)
        decoded = keras.layers.Dropout(0.2)(decoded)
        decoded = keras.layers.Dense(32, activation='relu')(decoded)
        decoded = keras.layers.Dense(self.input_dim, activation='sigmoid')(decoded)

        self.model = keras.Model(input_layer, decoded)
        self.model.compile(optimizer='adam', loss='mse')

    def train(self, X: np.ndarray, epochs: int = 50, batch_size: int = 32):
        """Train the autoencoder"""
        if self.model is None:
            self.build_model()

        X_scaled = self.scaler.fit_transform(X)

        history = self.model.fit(
            X_scaled, X_scaled,
            epochs=epochs,
            batch_size=batch_size,
            validation_split=0.1,
            verbose=0
        )

        # Calculate threshold based on reconstruction error
        reconstructions = self.model.predict(X_scaled, verbose=0)
        mse = np.mean(np.power(X_scaled - reconstructions, 2), axis=1)
        self.threshold = np.percentile(mse, 95)

        return history

    def predict_anomaly_score(self, X: np.ndarray) -> np.ndarray:
        """Predict anomaly scores based on reconstruction error"""
        X_scaled = self.scaler.transform(X)
        reconstructions = self.model.predict(X_scaled, verbose=0)
        mse = np.mean(np.power(X_scaled - reconstructions, 2), axis=1)

        # Normalize to 0-1 range
        scores = np.clip(mse / (self.threshold * 2), 0, 1)
        return scores


class RuleBasedEngine:
    """Rule-based fraud detection engine"""

    def __init__(self):
        self.rules = {}

    def detect_anomalies(self, df: pd.DataFrame) -> pd.DataFrame:
        """Apply rule-based detection"""

        # Rule 1: Unusual amount (> 3 std dev from user mean)
        user_stats = df.groupby('nameOrig')['amount'].agg(['mean', 'std']).reset_index()
        df = df.merge(user_stats, on='nameOrig', how='left')
        df['rule_amount_anomaly'] = (
            (df['amount'] > df['mean'] + 3 * df['std']) |
            (df['amount'] > 100000)
        ).astype(int)

        # Rule 2: Balance inconsistency
        df['rule_balance_error'] = (
            df['oldbalanceOrg'] - df['amount'] != df['newbalanceOrig']
        ).astype(int)

        # Rule 3: Zero balance after large transaction
        df['rule_zero_balance'] = (
            (df['oldbalanceOrg'] > 0) &
            (df['newbalanceOrig'] == 0) &
            (df['amount'] > 50000)
        ).astype(int)

        # Rule 4: High-frequency transactions (more than 5 in same step)
        freq = df.groupby(['nameOrig', 'step']).size().reset_index(name='freq')
        df = df.merge(freq, on=['nameOrig', 'step'], how='left')
        df['rule_high_frequency'] = (df['freq'] > 5).astype(int)

        # Rule 5: Risky transaction types
        df['rule_risky_type'] = df['type'].isin(['TRANSFER', 'CASH_OUT']).astype(int)

        # Calculate rule score (0-1)
        rule_cols = [col for col in df.columns if col.startswith('rule_')]
        df['rule_score'] = df[rule_cols].mean(axis=1)

        return df


class HybridFraudDetector:
    """Main hybrid fraud detection system"""

    def __init__(self):
        self.isolation_forest = IsolationForest(
            contamination=0.1,
            random_state=42,
            n_estimators=100
        )
        self.autoencoder = None
        self.rule_engine = RuleBasedEngine()
        self.scaler = StandardScaler()
        self.feature_columns = []

    def prepare_features(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, np.ndarray]:
        """Feature engineering for ML models"""

        # Create a copy to avoid modifying original
        df_features = df.copy()

        # Encode transaction type
        type_encoding = {'PAYMENT': 0, 'TRANSFER': 1, 'CASH_OUT': 2, 'DEBIT': 3, 'CASH_IN': 4}
        df_features['type_encoded'] = df_features['type'].map(type_encoding).fillna(0)

        # Amount features
        df_features['amount_log'] = np.log1p(df_features['amount'])
        df_features['amount_ratio'] = df_features['amount'] / (df_features['oldbalanceOrg'] + 1)

        # Balance features
        df_features['balance_change_orig'] = df_features['oldbalanceOrg'] - df_features['newbalanceOrig']
        df_features['balance_change_dest'] = df_features['newbalanceDest'] - df_features['oldbalanceDest']
        df_features['balance_orig_log'] = np.log1p(df_features['oldbalanceOrg'])
        df_features['balance_dest_log'] = np.log1p(df_features['oldbalanceDest'])

        # Transaction patterns
        df_features['is_zero_balance_orig'] = (df_features['newbalanceOrig'] == 0).astype(int)
        df_features['is_zero_balance_dest'] = (df_features['oldbalanceDest'] == 0).astype(int)

        # User behavior features
        user_features = df_features.groupby('nameOrig').agg({
            'amount': ['count', 'mean', 'std', 'max'],
            'step': ['min', 'max']
        }).reset_index()
        user_features.columns = ['nameOrig', 'user_tx_count', 'user_amount_mean',
                                 'user_amount_std', 'user_amount_max',
                                 'user_step_min', 'user_step_max']

        df_features = df_features.merge(user_features, on='nameOrig', how='left')
        df_features['user_amount_std'] = df_features['user_amount_std'].fillna(0)

        # Select feature columns for ML
        self.feature_columns = [
            'type_encoded', 'amount_log', 'amount_ratio',
            'balance_change_orig', 'balance_change_dest',
            'balance_orig_log', 'balance_dest_log',
            'is_zero_balance_orig', 'is_zero_balance_dest',
            'user_tx_count', 'user_amount_mean', 'user_amount_std',
            'user_amount_max', 'step'
        ]

        X = df_features[self.feature_columns].fillna(0).values

        return df_features, X

    def train(self, df: pd.DataFrame):
        """Train all models"""
        print("🔧 Training FraudShield AI models...")

        # Prepare features
        df_features, X = self.prepare_features(df)

        # Train Isolation Forest
        print("  → Training Isolation Forest...")
        X_scaled = self.scaler.fit_transform(X)
        self.isolation_forest.fit(X_scaled)

        # Train AutoEncoder (if TensorFlow is available)
        if TENSORFLOW_AVAILABLE:
            print("  → Training AutoEncoder...")
            self.autoencoder = AutoEncoder(input_dim=X.shape[1])
            self.autoencoder.train(X, epochs=30, batch_size=64)
        else:
            print("  → Skipping AutoEncoder (TensorFlow not available)")

        print("✅ Training complete!")

    def predict(self, df: pd.DataFrame) -> pd.DataFrame:
        """Detect fraud with hybrid approach"""

        # Apply rule-based detection
        df_rules = self.rule_engine.detect_anomalies(df)

        # Prepare features for ML
        df_features, X = self.prepare_features(df_rules)
        X_scaled = self.scaler.transform(X)

        # Isolation Forest predictions (-1 for anomaly, 1 for normal)
        iso_predictions = self.isolation_forest.predict(X_scaled)
        iso_scores = self.isolation_forest.score_samples(X_scaled)
        # Normalize to 0-1 (higher = more anomalous) with safe division
        score_range = iso_scores.max() - iso_scores.min()
        if score_range == 0:
            iso_scores_norm = np.zeros(len(iso_scores))
        else:
            iso_scores_norm = 1 - (iso_scores - iso_scores.min()) / score_range

        # AutoEncoder predictions (if available)
        if TENSORFLOW_AVAILABLE and self.autoencoder is not None:
            ae_scores = self.autoencoder.predict_anomaly_score(X)
            ml_score = (iso_scores_norm + ae_scores) / 2
        else:
            ae_scores = np.zeros(len(df))
            ml_score = iso_scores_norm

        # Combine scores
        df_result = df_rules.copy()
        df_result['ml_isolation_forest_score'] = iso_scores_norm
        df_result['ml_autoencoder_score'] = ae_scores
        df_result['ml_score'] = ml_score

        # Final combined fraud score (ML + Rules)
        df_result['fraud_score'] = (
            0.6 * df_result['ml_score'] +
            0.4 * df_result['rule_score']
        )

        # Flag as suspicious if fraud_score > 0.6
        df_result['is_suspicious'] = (df_result['fraud_score'] > 0.6).astype(int)

        return df_result

    def explain_transaction(self, row: pd.Series) -> str:
        """Generate human-readable explanation for suspicious transaction"""

        reasons = []

        # Check ML scores
        if row.get('ml_score', 0) > 0.7:
            reasons.append(f"ML models detected highly anomalous pattern (score: {row['ml_score']:.2f})")

        # Check rule violations
        if row.get('rule_amount_anomaly', 0) == 1:
            reasons.append(f"Transaction amount ${row['amount']:,.2f} is unusually high for this user")

        if row.get('rule_balance_error', 0) == 1:
            reasons.append("Balance calculations don't match (possible data manipulation)")

        if row.get('rule_zero_balance', 0) == 1:
            reasons.append("Large transaction leaving zero balance (possible account draining)")

        if row.get('rule_high_frequency', 0) == 1:
            reasons.append(f"High-frequency transactions detected ({row.get('freq', 0)} in same time period)")

        if row.get('rule_risky_type', 0) == 1 and row.get('fraud_score', 0) > 0.6:
            reasons.append(f"Risky transaction type: {row['type']}")

        # Additional contextual info
        if row['amount'] > 100000:
            reasons.append(f"Very large transaction amount: ${row['amount']:,.2f}")

        if row['newbalanceOrig'] == 0 and row['oldbalanceOrg'] > 0:
            reasons.append("Account completely emptied after transaction")

        if len(reasons) == 0:
            return f"Moderately suspicious based on behavioral patterns (fraud score: {row['fraud_score']:.2f})"

        explanation = " | ".join(reasons)
        return explanation
