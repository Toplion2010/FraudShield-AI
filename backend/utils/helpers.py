"""
FraudShield AI - Helper Functions
Utility functions for backend operations
"""


def get_risk_level(score: float) -> str:
    """
    Classify fraud score into risk levels

    Args:
        score: Fraud score between 0 and 1

    Returns:
        Risk level classification (CRITICAL, HIGH, MEDIUM, LOW)
    """
    if score > 0.8:
        return "CRITICAL"
    elif score > 0.6:
        return "HIGH"
    elif score > 0.4:
        return "MEDIUM"
    else:
        return "LOW"
