# FraudShield AI - Complete Setup Guide

## 🚀 Quick Start (5 Minutes)

### Prerequisites Check

Before starting, ensure you have:

```bash
# Check Python version (need 3.9+)
python3 --version

# Check Node.js version (need 18+)
node --version

# Check npm version
npm --version
```

If any are missing:
- **Python**: Download from [python.org](https://www.python.org/downloads/)
- **Node.js**: Download from [nodejs.org](https://nodejs.org/)

---

## 📋 Step-by-Step Setup

### Method 1: Automated Setup (Recommended)

```bash
# Navigate to project directory
cd FraudShield-AI

# Make the script executable (Mac/Linux)
chmod +x run.sh

# Run the automated setup
./run.sh
```

This script will:
1. ✅ Create Python virtual environment
2. ✅ Install all Python dependencies
3. ✅ Start the backend server on port 8000
4. ✅ Install all Node.js dependencies
5. ✅ Start the frontend server on port 3000
6. ✅ Open your browser automatically

**Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

---

### Method 2: Manual Setup

#### Step 1: Backend Setup

```bash
# Open Terminal/Command Prompt
cd FraudShield-AI/backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On Mac/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the backend server
python main.py
```

**Expected output:**
```
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

Keep this terminal open!

#### Step 2: Frontend Setup

```bash
# Open a NEW terminal window
cd FraudShield-AI/frontend

# Install dependencies
npm install
# or if you prefer yarn:
yarn install

# Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Start the development server
npm run dev
# or:
yarn dev
```

**Expected output:**
```
- ready started server on 0.0.0.0:3000
- event compiled successfully
```

#### Step 3: Open Your Browser

Navigate to: **http://localhost:3000**

---

## 🧪 Testing the System

### Test 1: API Health Check

```bash
curl http://localhost:8000/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00",
  "model_ready": false
}
```

### Test 2: Full Detection Pipeline

```bash
# Open a new terminal
cd FraudShield-AI/backend
source venv/bin/activate  # Windows: venv\Scripts\activate

# Run the test script
python test_api.py ../data/Synthetic_Financial_datasets_log.csv
```

**Expected output:**
```
============================================================
FraudShield AI - API Test Suite
============================================================

🔍 Testing health check...
✅ Health check passed

🔧 Training model...
✅ Model trained successfully
   Training samples: 6,362,620
   Features used: 14

🔍 Detecting fraud...
✅ Fraud detection completed

📊 Detection Summary:
   Total Transactions: 6,362,620
   Suspicious Count: 8,213
   Suspicious %: 0.13%
   Average Fraud Score: 18.50%
   High Risk Count: 2,456

============================================================
✅ All tests passed!
============================================================
```

---

## 📱 Using the Web Interface

### Step 1: Upload Your Data

1. Go to http://localhost:3000
2. Click **"Start Detection"** or navigate to **Upload** page
3. Drag & drop your CSV file or click to browse
4. Your CSV must have these columns:
   - `step`, `type`, `amount`, `nameOrig`, `oldbalanceOrg`
   - `newbalanceOrig`, `nameDest`, `oldbalanceDest`, `newbalanceDest`

### Step 2: Train the Model (First Time Only)

1. Click **"Train Model"** button
2. Wait ~30 seconds for training to complete
3. You'll see: ✅ "Model Trained Successfully!"

### Step 3: Detect Fraud

1. Click **"Detect Fraud"** button
2. Wait for processing (depends on file size)
3. View results summary:
   - Total transactions analyzed
   - Number of suspicious transactions
   - High-risk count
   - Average fraud score

### Step 4: Download Results

1. Click **"Download CSV"** for spreadsheet format
2. Click **"Download Excel"** for Excel format
3. Files include:
   - All original data
   - Fraud scores
   - Risk levels
   - Explanations for suspicious transactions

### Step 5: View Dashboard (Optional)

1. Click **"View Detailed Dashboard"**
2. Explore:
   - Transaction table with filters
   - Fraud score distribution charts
   - Risk level breakdown
   - Transaction type analysis

---

## 🔧 Troubleshooting

### Issue: "Port already in use"

**Backend (Port 8000):**
```bash
# Find and kill the process
lsof -ti:8000 | xargs kill -9  # Mac/Linux
netstat -ano | findstr :8000   # Windows (find PID, then taskkill /PID xxx /F)
```

**Frontend (Port 3000):**
```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9  # Mac/Linux
netstat -ano | findstr :3000   # Windows
```

### Issue: "Module not found"

**Backend:**
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt --upgrade
```

**Frontend:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Model training fails"

Check your CSV file:
```python
import pandas as pd
df = pd.read_csv('your_file.csv')
print(df.columns)  # Should show required columns
print(df.head())   # Should show data
```

Required columns:
- `step`, `type`, `amount`, `nameOrig`, `oldbalanceOrg`
- `newbalanceOrig`, `nameDest`, `oldbalanceDest`, `newbalanceDest`

### Issue: "API connection refused"

1. Check backend is running: http://localhost:8000/health
2. Check frontend .env.local file exists with:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```
3. Restart frontend:
   ```bash
   npm run dev
   ```

### Issue: "Import errors in Python"

Make sure you're in the virtual environment:
```bash
cd backend
source venv/bin/activate  # You should see (venv) in your prompt
python -c "import fastapi; print('OK')"  # Should print OK
```

---

## 📊 Sample Data

A sample dataset is included at:
```
FraudShield-AI/data/Synthetic_Financial_datasets_log.csv
```

This contains 6+ million synthetic transactions with known fraud labels.

**Sample data structure:**
```csv
step,type,amount,nameOrig,oldbalanceOrg,newbalanceOrig,nameDest,oldbalanceDest,newbalanceDest,isFraud,isFlaggedFraud
1,PAYMENT,9839.64,C1231006815,170136.0,160296.36,M1979787155,0.0,0.0,0,0
1,TRANSFER,181.0,C1305486145,181.0,0.0,C553264065,0.0,0.0,1,0
```

---

## 🌐 API Endpoints

Once the backend is running, you can use these endpoints:

### Health Check
```bash
curl http://localhost:8000/health
```

### Train Model
```bash
curl -X POST http://localhost:8000/api/train \
  -F "file=@data/your_data.csv"
```

### Detect Fraud
```bash
curl -X POST http://localhost:8000/api/detect \
  -F "file=@data/your_data.csv"
```

### View API Documentation
Open in browser: http://localhost:8000/docs

---

## 💻 Development Tips

### Backend Development

```bash
# Watch for changes (auto-reload)
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Run tests
python test_api.py ../data/Synthetic_Financial_datasets_log.csv

# Check types
mypy main.py
```

### Frontend Development

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

---

## 🐳 Docker Setup (Optional)

Coming soon! Full Docker Compose configuration will be added in the next release.

**Current manual Docker setup:**

```dockerfile
# Backend Dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "main.py"]
```

```dockerfile
# Frontend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

---

## 📦 Production Deployment

### Backend (FastAPI)

**Option 1: Cloud Run / App Engine**
```bash
gcloud run deploy fraudshield-api \
  --source . \
  --platform managed \
  --region us-central1
```

**Option 2: Heroku**
```bash
heroku create fraudshield-api
git push heroku main
```

**Option 3: AWS ECS**
```bash
# Build and push Docker image
docker build -t fraudshield-api .
aws ecr get-login-password | docker login --username AWS
docker push your-ecr-url/fraudshield-api
```

### Frontend (Next.js)

**Option 1: Vercel (Recommended)**
```bash
npm install -g vercel
vercel
```

**Option 2: Netlify**
```bash
npm run build
netlify deploy --prod --dir=.next
```

**Environment Variables for Production:**
```
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

---

## 🔐 Security Checklist for Production

Before deploying to production:

- [ ] Enable HTTPS (TLS 1.3)
- [ ] Add API authentication (JWT tokens)
- [ ] Implement rate limiting
- [ ] Add input sanitization
- [ ] Enable CORS for specific origins only
- [ ] Set up monitoring and logging
- [ ] Configure firewall rules
- [ ] Add database for persistent storage
- [ ] Implement backup strategy
- [ ] Set up CI/CD pipeline
- [ ] Add error tracking (Sentry)
- [ ] Enable request/response compression
- [ ] Set proper cache headers
- [ ] Add health checks and readiness probes

---

## 📚 Additional Resources

- **API Documentation**: http://localhost:8000/docs
- **README**: See [README.md](README.md) for detailed documentation
- **Architecture**: See [ARCHITECTURE.md](ARCHITECTURE.md) for system design
- **Project Summary**: See [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)

---

## 🆘 Getting Help

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review error messages in terminal
3. Check browser console (F12)
4. Verify all dependencies are installed
5. Ensure ports 3000 and 8000 are available
6. Try restarting both servers

**Common fixes:**
```bash
# Clean restart everything
pkill -f python
pkill -f node
rm -rf backend/venv
rm -rf frontend/node_modules
# Then start fresh with setup
```

---

## ✅ Setup Complete!

You're all set! 🎉

**Next steps:**
1. ✅ Backend running on port 8000
2. ✅ Frontend running on port 3000
3. ✅ Open http://localhost:3000 in your browser
4. ✅ Upload your CSV file
5. ✅ Train the model (first time)
6. ✅ Detect fraud
7. ✅ Download results

**Happy fraud detecting! 🛡️**

---

<div align="center">

**Need more help?**

Check out our comprehensive [README.md](README.md)

</div>
