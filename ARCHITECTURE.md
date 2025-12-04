# FraudShield AI - System Architecture

## System Overview

FraudShield AI is a comprehensive fraud detection platform built with a microservices-inspired architecture, combining modern web technologies with advanced machine learning models.

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Browser    │  │  Mobile App  │  │   API Client │             │
│  │  (Next.js)   │  │ (Future)     │  │  (B2B)       │             │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘             │
│         │                 │                  │                      │
│         └─────────────────┴──────────────────┘                      │
│                           │                                         │
└───────────────────────────┼─────────────────────────────────────────┘
                            │
                            │ HTTPS/REST
                            │
┌───────────────────────────▼─────────────────────────────────────────┐
│                       API GATEWAY LAYER                             │
│  ┌──────────────────────────────────────────────────────┐          │
│  │              FastAPI Application                       │          │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │          │
│  │  │   Auth     │  │   Upload   │  │  Detection │     │          │
│  │  │ Middleware │  │  Endpoint  │  │  Endpoint  │     │          │
│  │  └────────────┘  └────────────┘  └────────────┘     │          │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │          │
│  │  │  Training  │  │  Download  │  │   Health   │     │          │
│  │  │  Endpoint  │  │  Endpoint  │  │   Check    │     │          │
│  │  └────────────┘  └────────────┘  └────────────┘     │          │
│  └────────────────────────┬─────────────────────────────┘          │
│                           │                                         │
└───────────────────────────┼─────────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                             │
│  ┌──────────────────────────────────────────────────────┐          │
│  │           Fraud Detection Service                     │          │
│  │  ┌────────────────────────────────────────────────┐  │          │
│  │  │         Data Preprocessing                     │  │          │
│  │  │  • Feature Engineering                         │  │          │
│  │  │  • Data Validation                             │  │          │
│  │  │  • Normalization                               │  │          │
│  │  └────────────────┬───────────────────────────────┘  │          │
│  │                   │                                   │          │
│  │  ┌────────────────▼───────────────────────────────┐  │          │
│  │  │         Detection Pipeline                     │  │          │
│  │  │  ┌──────────────┐  ┌──────────────┐           │  │          │
│  │  │  │   ML Models  │  │ Rule Engine  │           │  │          │
│  │  │  │              │  │              │           │  │          │
│  │  │  │ • Isolation  │  │ • Amount     │           │  │          │
│  │  │  │   Forest     │  │   Anomaly    │           │  │          │
│  │  │  │              │  │ • Balance    │           │  │          │
│  │  │  │ • AutoEncoder│  │   Error      │           │  │          │
│  │  │  │              │  │ • Frequency  │           │  │          │
│  │  │  │              │  │   Check      │           │  │          │
│  │  │  └──────┬───────┘  └──────┬───────┘           │  │          │
│  │  │         │                  │                   │  │          │
│  │  │         └────────┬─────────┘                   │  │          │
│  │  │                  │                             │  │          │
│  │  │         ┌────────▼─────────┐                   │  │          │
│  │  │         │  Score Fusion    │                   │  │          │
│  │  │         └────────┬─────────┘                   │  │          │
│  │  └──────────────────┼─────────────────────────────┘  │          │
│  │                     │                                 │          │
│  │  ┌──────────────────▼─────────────────────────────┐  │          │
│  │  │       Explainability Engine                    │  │          │
│  │  │  • SHAP Analysis                               │  │          │
│  │  │  • Text Generation                             │  │          │
│  │  │  • Risk Classification                         │  │          │
│  │  └────────────────────────────────────────────────┘  │          │
│  └──────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────────┐
│                      DATA LAYER                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  Input CSV   │  │ Trained      │  │  Output      │             │
│  │  Files       │  │ Models       │  │  Results     │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Details

### 1. Frontend Layer (Next.js)

**Technology**: Next.js 14 + React + TypeScript + Tailwind CSS

**Components**:
- **Landing Page**: Marketing and feature showcase
- **Upload Interface**: File upload with drag & drop
- **Dashboard**: Real-time fraud analytics
- **Results View**: Detailed transaction analysis

**Key Features**:
- Server-side rendering for SEO
- Client-side routing for smooth UX
- Responsive dark-theme UI with cyber aesthetics
- Real-time data visualization with Recharts

### 2. API Layer (FastAPI)

**Technology**: FastAPI + Python 3.9+

**Endpoints**:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/train` | POST | Train ML models |
| `/api/detect` | POST | Detect fraud in CSV |
| `/api/analyze` | POST | Detailed analysis with visualizations |
| `/api/download/{filename}` | GET | Download result files |
| `/api/stats` | GET | System statistics |

**Features**:
- CORS middleware for cross-origin requests
- File upload handling (multipart/form-data)
- Async request processing
- Error handling with detailed messages
- Auto-generated OpenAPI documentation

### 3. ML Engine

#### a) **Isolation Forest**

**Purpose**: Anomaly detection based on feature isolation

**How it works**:
1. Builds random decision trees
2. Isolates anomalous points (require fewer splits)
3. Anomaly score based on path length

**Parameters**:
- `contamination=0.1` (expected fraud rate)
- `n_estimators=100` (number of trees)
- `random_state=42` (reproducibility)

**Features Used**:
- Transaction amounts (log-transformed)
- Balance changes
- User behavior patterns
- Transaction frequency

#### b) **AutoEncoder Neural Network**

**Purpose**: Learn normal transaction patterns, detect deviations

**Architecture**:
```
Input (14 features)
    ↓
Dense(32, relu) + Dropout(0.2)
    ↓
Dense(16, relu)
    ↓
Dense(8, relu) [BOTTLENECK]
    ↓
Dense(16, relu) + Dropout(0.2)
    ↓
Dense(32, relu)
    ↓
Output (14 features)
```

**Training**:
- Loss: Mean Squared Error (MSE)
- Optimizer: Adam
- Epochs: 30-50
- Batch size: 32-64

**Anomaly Detection**:
- Reconstruction error = MSE between input and output
- Threshold = 95th percentile of training errors
- High reconstruction error = anomaly

#### c) **Rule-Based Engine**

**Rules**:

1. **Amount Anomaly**
   - Trigger: Transaction > mean + 3×std OR > $100,000
   - Rationale: Unusually large transactions are suspicious

2. **Balance Error**
   - Trigger: `oldbalanceOrg - amount ≠ newbalanceOrig`
   - Rationale: Inconsistent calculations suggest manipulation

3. **Zero Balance**
   - Trigger: Large transaction leaving zero balance
   - Rationale: Possible account draining

4. **High Frequency**
   - Trigger: >5 transactions in same time step
   - Rationale: Automated attack or card testing

5. **Risky Type**
   - Trigger: TRANSFER or CASH_OUT with high amounts
   - Rationale: Common fraud methods

#### d) **Score Fusion**

**Formula**:
```python
fraud_score = 0.6 × ml_score + 0.4 × rule_score
```

**Rationale**:
- ML models catch novel patterns
- Rules catch known fraud types
- Weighted combination reduces false positives

**Classification**:
```python
if fraud_score > 0.6:
    is_suspicious = True
    risk_level = "CRITICAL" if score > 0.8 else "HIGH"
```

### 4. Explainability Layer

#### SHAP (SHapley Additive exPlanations)

**Purpose**: Explain individual predictions

**Process**:
1. Calculate Shapley values for each feature
2. Identify top contributing features
3. Show impact direction (increases/decreases fraud probability)

**Output**:
```
Feature: amount_log
Value: 11.52
Contribution: +0.34
Impact: increases fraud probability
```

#### Text Generation

**Purpose**: Human-readable explanations

**Template**:
```
🔍 FRAUD ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Fraud Score: 87%
Risk Level: CRITICAL

Key Indicators:
✗ Transaction amount $150,000 is unusually high
✗ Account completely emptied after transaction
✗ High-risk transaction type: TRANSFER

Recommendation: BLOCK transaction immediately
```

---

## Data Flow

### Training Flow

```
1. User uploads training CSV
    ↓
2. FastAPI receives file
    ↓
3. Validate columns and data quality
    ↓
4. Feature engineering
    ↓
5. Train Isolation Forest
    ↓
6. Train AutoEncoder
    ↓
7. Calculate thresholds
    ↓
8. Save models to memory
    ↓
9. Return success response
```

### Detection Flow

```
1. User uploads transaction CSV
    ↓
2. FastAPI receives file
    ↓
3. Validate columns
    ↓
4. Feature engineering
    ↓
5. Parallel processing:
   ├─ Isolation Forest prediction
   ├─ AutoEncoder prediction
   └─ Rule-based checks
    ↓
6. Score fusion
    ↓
7. Generate explanations for suspicious transactions
    ↓
8. Save results (CSV + Excel)
    ↓
9. Return summary + download links
```

---

## Feature Engineering

### Input Features

| Original Column | Description |
|----------------|-------------|
| `step` | Time step |
| `type` | Transaction type (PAYMENT, TRANSFER, CASH_OUT, etc.) |
| `amount` | Transaction amount |
| `nameOrig` | Origin account ID |
| `oldbalanceOrg` | Origin balance before |
| `newbalanceOrig` | Origin balance after |
| `nameDest` | Destination account ID |
| `oldbalanceDest` | Destination balance before |
| `newbalanceDest` | Destination balance after |

### Engineered Features

| Feature | Formula | Rationale |
|---------|---------|-----------|
| `type_encoded` | One-hot encoding | Categorical to numerical |
| `amount_log` | log(amount + 1) | Handle skewness |
| `amount_ratio` | amount / (oldbalanceOrg + 1) | Relative size |
| `balance_change_orig` | oldbalanceOrg - newbalanceOrig | Origin impact |
| `balance_change_dest` | newbalanceDest - oldbalanceDest | Dest impact |
| `balance_orig_log` | log(oldbalanceOrg + 1) | Normalized |
| `balance_dest_log` | log(oldbalanceDest + 1) | Normalized |
| `is_zero_balance_orig` | newbalanceOrig == 0 | Draining flag |
| `is_zero_balance_dest` | oldbalanceDest == 0 | New account flag |
| `user_tx_count` | Count per user | Activity level |
| `user_amount_mean` | Mean per user | Typical amount |
| `user_amount_std` | Std per user | Variability |
| `user_amount_max` | Max per user | Historical peak |

---

## Security Considerations

### Current Implementation

- CORS enabled (development mode - allow all origins)
- Input validation (CSV column checks)
- File type restriction (.csv only)
- Error handling (no sensitive data in responses)

### Production Recommendations

1. **Authentication**
   - JWT tokens for API access
   - OAuth2 for user login
   - API keys for B2B integrations

2. **Authorization**
   - Role-based access control (RBAC)
   - Rate limiting per user/API key
   - Request quotas

3. **Data Security**
   - Encrypt files at rest
   - HTTPS only (TLS 1.3)
   - Secure file uploads (virus scanning)
   - Data anonymization for logs

4. **Model Security**
   - Model versioning
   - Access control for model files
   - Adversarial attack detection

---

## Scalability

### Current Architecture
- Single-server deployment
- In-memory model storage
- Synchronous processing

### Scaling Strategy

#### Horizontal Scaling
```
Load Balancer
    ├─ API Server 1
    ├─ API Server 2
    └─ API Server 3
         ↓
    Model Server (shared)
         ↓
    Redis Cache
         ↓
    Database (PostgreSQL)
```

#### Async Processing
```
API Server → Message Queue (RabbitMQ/Kafka)
                  ↓
            Worker Pool
                  ↓
            Results Database
```

#### Caching Strategy
- Redis for:
  - Model predictions (cache fraud scores)
  - User statistics
  - API responses
- TTL: 5-15 minutes

---

## Monitoring & Observability

### Metrics to Track

1. **System Metrics**
   - Request rate (requests/second)
   - Response time (p50, p95, p99)
   - Error rate
   - CPU/Memory usage

2. **Business Metrics**
   - Fraud detection rate
   - False positive rate
   - Model accuracy
   - Average fraud score

3. **ML Metrics**
   - Model drift
   - Feature distribution changes
   - Prediction confidence

### Tools
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Metrics**: Prometheus + Grafana
- **Tracing**: Jaeger
- **Errors**: Sentry

---

## Future Enhancements

### Phase 2
1. **Graph Neural Networks**
   - Model transaction networks
   - Detect organized fraud rings
   - Community detection

2. **Real-time Streaming**
   - Kafka for real-time ingestion
   - Apache Flink for stream processing
   - <10ms latency

3. **Advanced Features**
   - Geolocation analysis
   - Device fingerprinting
   - Behavioral biometrics

### Phase 3
1. **AutoML**
   - Automated feature engineering
   - Hyperparameter tuning
   - Model selection

2. **Federated Learning**
   - Multi-institution collaboration
   - Privacy-preserving ML
   - Shared fraud intelligence

---

## Technology Choices

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Backend | FastAPI | Fast, async, auto-docs, type hints |
| Frontend | Next.js | SSR, SEO, developer experience |
| ML | scikit-learn | Industry standard, easy to use |
| DL | TensorFlow | Production-ready, ecosystem |
| Explainability | SHAP | Model-agnostic, theoretically sound |
| Styling | Tailwind CSS | Utility-first, fast development |
| Charts | Recharts | React-native, customizable |

---

## Deployment Architecture

### Development
```
localhost:3000 (Frontend)
    ↓
localhost:8000 (Backend)
```

### Production (Docker)
```
nginx (Reverse Proxy)
    ├─ frontend:3000
    └─ backend:8000
         ↓
    Redis Cache
         ↓
    PostgreSQL
```

### Cloud (AWS Example)
```
CloudFront (CDN)
    ↓
ALB (Load Balancer)
    ├─ ECS/Fargate (Frontend)
    └─ ECS/Fargate (Backend)
         ↓
    ElastiCache (Redis)
         ↓
    RDS (PostgreSQL)
         ↓
    S3 (File Storage)
```

---

## Conclusion

FraudShield AI is designed as a modular, scalable system that balances:
- **Accuracy**: Hybrid ML+Rules approach
- **Explainability**: SHAP + human-readable text
- **Performance**: <100ms response time
- **Usability**: Clean UI, simple API
- **Extensibility**: Pluggable components

The architecture supports both immediate deployment and future enhancements for enterprise-scale fraud detection.
