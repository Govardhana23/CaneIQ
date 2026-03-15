# CaneIQ - AI Powered Inline Sugarcane Quality Intelligence System

A digital twin and real-time AI prototype designed for sugar mill incoming sugarcane quality estimation. CaneIQ simulates an inline Near-Infrared (NIR) spectrometer, predicts sugar content Pol % using an ensemble ML engine, and provides real-time confidence scores and optimal factory routing decisions.

## Features
- **Virtual NIR Sensor**: Simulates 700nm-2500nm reflectance spectra mimicking inline conveyor measurements.
- **Deep Spectral AI**: Employs an ensemble of 1D CNN, XGBoost, and PLSRegression to predict Pol % from spectra.
- **AI Confidence Engine**: Flag uncertain predictions for manual lab verification based on multi-model variance.
- **Real-Time Analytics Dashboard**: React + Chart.js frontend subscribing to a 1Hz websocket stream of predictions.
- **Factory Optimization Engine**: Forecasts near-term intake and adjusts quality metrics to simulate smart mill routing decisions.

## Quickstart (Docker)
Ensure Docker is installed, then run:
```bash
docker-compose up --build
```
- **Frontend Dashboard**: `http://localhost:5173`
- **Backend API Docs**: `http://localhost:8000/docs`

## Local Development
If you prefer running locally without docker:

### 1. Backend
```bash
cd backend
pip install -r requirements.txt
python data/generator.py
python ml/train.py
uvicorn api.main:app --reload
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

## Hackathon Demo Flow
1. Open the UI dashboard.
2. Observe the continuous high-speed spectral plots simulating the conveyor belt passing sugar cane.
3. Show the real-time AI Confidence Score and Pol Prediction updating.
4. Point out cases where the Diverter Gate route dynamically shifts between Premium, Standard, and Low-Quality processing.
5. Highlight the API documentation and explain the OPC-UA/MQTT ready architecture for real factory PLCs.
