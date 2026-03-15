from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
import time
import random
import os
import numpy as np

from simulator.virtual_nir import VirtualNIR
try:
    from ml.engine import CaneIQMLEngine
    ENGINE_AVAILABLE = True
except ImportError:
    print("Warning: ML Libraries failed to load (missing C++ DLLs). Simulating inference.")
    ENGINE_AVAILABLE = False
    CaneIQMLEngine = None

from ml.analytics import (
    FactoryOptimizationAI, SmartCaneRouting, SensorDriftDetector, FarmerIntelligence,
    AICalibrationEngine, AnomalyDetector, QualityForecaster, SugarRecoveryOptimizer,
    TruckQueueSimulator, FeatureImportanceEngine
)
import uvicorn

app = FastAPI(title="CaneIQ Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global State
vnir = VirtualNIR()
ml_engine = CaneIQMLEngine(base_path="./models/") if CaneIQMLEngine else None
try:
    if ml_engine:
        ml_engine.load_models(input_size=901)
except Exception:
    print("Warning: Models not found, utilizing random fallback for simulation mode.")

factory_ai = FactoryOptimizationAI()
drift_detector = SensorDriftDetector()
farmer_intelligence = FarmerIntelligence()
calibration_engine = AICalibrationEngine()
anomaly_detector = AnomalyDetector()
quality_forecaster = QualityForecaster()
truck_queue = TruckQueueSimulator()
feature_engine = FeatureImportanceEngine()

FARMS = ["Farm A", "Farm B", "Farm C", "Farm D"]

# Tick counter for periodic events
_tick_counter = 0

@app.get("/")
def health_check():
    return {"status": "ok", "message": "CaneIQ API is running."}

@app.get("/api/dashboard/stats")
async def get_dashboard_stats():
    forecast_intake, forecast_pol, efficiency = factory_ai.forecast_next_30_mins()
    insights = farmer_intelligence.get_insights()
    return {
        "forecast_intake_tons_30m": round(forecast_intake, 2),
        "forecast_avg_pol": round(forecast_pol, 2),
        "mill_efficiency_pct": round(efficiency, 2),
        "farmer_insights": insights
    }

@app.websocket("/ws/conveyor")
async def conveyor_simulation_endpoint(websocket: WebSocket):
    global _tick_counter
    await websocket.accept()
    
    try:
        while True:
            _tick_counter += 1
            
            base_pol = float(np.clip(random.gauss(13.5, 2.0), 10.0, 18.0))
            moisture = float(np.clip(random.gauss(70.0, 2.0), 65.0, 75.0))
            farm_source = random.choice(FARMS)
            
            # 1. Virtual Spectrometer
            wavelengths, spectrum = vnir.generate_spectrum(base_pol, moisture, add_noise=True)
            
            # 2. Drift detection
            is_drifting, drift_val = drift_detector.check_drift(spectrum)
            
            # 3. AI Inference
            if ml_engine and ml_engine.is_trained:
                pred_result = ml_engine.predict(spectrum.reshape(1, -1))[0]
                pol_pred = pred_result["pol_prediction"]
                conf = pred_result["confidence"]
            else:
                pol_pred = round(base_pol + random.uniform(-0.5, 0.5), 2)
                conf = round(random.uniform(85.0, 99.0), 1)
            
            # 4. Routing
            routing = SmartCaneRouting.get_routing_decision(pol_pred)
            
            # 5. Log for core analytics
            factory_ai.log_reading(pol_pred, random.uniform(50, 60))
            farmer_intelligence.log_delivery(farm_source, pol_pred)
            
            # 6. Advanced analytics
            anomaly_detector.log_reading(farm_source, pol_pred)
            quality_forecaster.log_reading(pol_pred)
            
            # Simulate lab calibration entry every ~15 ticks
            if _tick_counter % 15 == 0:
                calibration_engine.simulate_lab_entry(pol_pred)
            
            # Get calibration state
            cal_state = calibration_engine.get_calibration_state(pol_pred)
            if cal_state is None:
                cal_state = {
                    "predicted_pol": round(pol_pred, 2),
                    "lab_pol": None,
                    "adjustment": 0.0,
                    "drift_level": "Awaiting lab data",
                    "samples_calibrated": 0
                }
            
            # Get anomaly alerts
            anomaly_alerts = anomaly_detector.check_anomalies()
            
            # Get quality forecast
            forecast = quality_forecaster.forecast()
            
            # Get sugar recovery optimization
            recovery = SugarRecoveryOptimizer.calculate_recovery(pol_pred)
            sugar_opt = SugarRecoveryOptimizer.get_optimization(pol_pred, recovery)
            
            # Get farm rankings
            farm_rankings = farmer_intelligence.get_insights()
            
            # Get truck queue
            truck_q = truck_queue.get_queue()
            
            # Get XAI explanations
            explanation = feature_engine.get_explanation(pol_pred)

            # Build enriched data packet
            data_packet = {
                "timestamp": int(time.time() * 1000),
                "farm_source": farm_source,
                "raw_spectrum": spectrum.tolist()[:100],
                "pol_prediction": pol_pred,
                "confidence": conf,
                "routing_decision": routing,
                "drift_alert": is_drifting,
                # New advanced fields
                "calibration": cal_state,
                "anomalies": anomaly_alerts,
                "farm_rankings": farm_rankings,
                "quality_forecast": forecast,
                "sugar_recovery": sugar_opt,
                "truck_queue": truck_q,
                "explanation": explanation
            }
            
            await websocket.send_text(json.dumps(data_packet))
            await asyncio.sleep(1.0)

    except Exception as e:
        print(f"WebSocket disconnected: {e}")

if __name__ == "__main__":
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)
