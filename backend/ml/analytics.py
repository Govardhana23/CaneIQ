import numpy as np
import random

class FactoryOptimizationAI:
    def __init__(self):
        self.history_pol = []
        self.history_intake = []
    
    def log_reading(self, pol, intake_tons):
        self.history_pol.append(pol)
        self.history_intake.append(intake_tons)
        if len(self.history_pol) > 100:
            self.history_pol.pop(0)
            self.history_intake.pop(0)

    def forecast_next_30_mins(self):
        if len(self.history_pol) < 5:
            return (
                sum(self.history_intake) if self.history_intake else 0,
                sum(self.history_pol) / len(self.history_pol) if self.history_pol else 0,
                85.0
            )
            
        pol_trend = np.polyfit(np.arange(len(self.history_pol)), self.history_pol, 1)[0]
        intake_trend = np.polyfit(np.arange(len(self.history_intake)), self.history_intake, 1)[0]
        
        forecast_pol = self.history_pol[-1] + (pol_trend * 30)
        forecast_intake = self.history_intake[-1] + (intake_trend * 30)
        
        efficiency = min(98.0, max(80.0, 80 + (forecast_pol - 10) * 2))
        
        return forecast_intake, forecast_pol, efficiency

class SmartCaneRouting:
    @staticmethod
    def get_routing_decision(pol):
        if pol > 15.0:
            return "Premium Processing"
        elif pol >= 12.0:
            return "Standard Processing"
        else:
            return "Low-Quality Processing"

class SensorDriftDetector:
    def __init__(self):
        self.baseline_mean = None
        self.history = []

    def set_baseline(self, spectra_batch):
        self.baseline_mean = np.mean(spectra_batch, axis=0)

    def check_drift(self, current_spectrum, threshold=0.1):
        if self.baseline_mean is None:
            return False, 0.0
        mse = np.mean((current_spectrum - self.baseline_mean) ** 2)
        is_drifting = mse > threshold
        return is_drifting, mse

class FarmerIntelligence:
    def __init__(self):
        self.farm_data = {}
        
    def log_delivery(self, farm_id, pol):
        if farm_id not in self.farm_data:
            self.farm_data[farm_id] = []
        self.farm_data[farm_id].append(pol)
        # Keep last 200 per farm
        if len(self.farm_data[farm_id]) > 200:
            self.farm_data[farm_id].pop(0)
        
    def get_insights(self):
        insights = []
        for farm, pols in self.farm_data.items():
            avg_pol = sum(pols) / len(pols)
            stars = 5 if avg_pol >= 15.0 else (4 if avg_pol >= 14.0 else (3 if avg_pol >= 13.0 else (2 if avg_pol >= 12.0 else 1)))
            
            if avg_pol >= 15.0:
                rec = "Excellent quality — maintain current practices"
            elif avg_pol >= 13.5:
                rec = "Good quality — maintain harvest schedule"
            elif avg_pol >= 12.0:
                rec = "Average — consider earlier harvest for higher sucrose"
            else:
                rec = "Below target — investigate harvest delay or mixed batches"
            
            insights.append({
                "farm_id": farm,
                "deliveries": len(pols),
                "avg_pol": round(avg_pol, 2),
                "stars": stars,
                "recommendation": rec
            })
        # Sort by avg_pol desc
        insights.sort(key=lambda x: x["avg_pol"], reverse=True)
        return insights


class AICalibrationEngine:
    """Simulates adaptive AI calibration with lab value comparison."""
    
    def __init__(self):
        self.calibration_offset = 0.0
        self.lab_history = []
        self.pred_history = []
    
    def submit_lab_value(self, predicted_pol, lab_pol):
        """Record a lab result and update calibration."""
        adjustment = lab_pol - predicted_pol
        self.lab_history.append(lab_pol)
        self.pred_history.append(predicted_pol)
        
        # Exponential moving average for calibration offset
        alpha = 0.3
        self.calibration_offset = alpha * adjustment + (1 - alpha) * self.calibration_offset
    
    def get_calibration_state(self, current_predicted):
        """Return current calibration status."""
        if not self.lab_history:
            return None
        
        recent_errors = [abs(l - p) for l, p in zip(self.lab_history[-10:], self.pred_history[-10:])]
        avg_error = sum(recent_errors) / len(recent_errors)
        
        if avg_error < 0.15:
            drift_level = "Low"
        elif avg_error < 0.4:
            drift_level = "Medium"
        else:
            drift_level = "High"
        
        return {
            "predicted_pol": round(current_predicted, 2),
            "lab_pol": round(self.lab_history[-1], 2),
            "adjustment": round(self.calibration_offset, 2),
            "drift_level": drift_level,
            "samples_calibrated": len(self.lab_history)
        }
    
    def simulate_lab_entry(self, current_predicted):
        """Auto-simulate a lab result for demo purposes."""
        # Lab value = predicted + small random bias
        lab_val = current_predicted + random.uniform(-0.3, 0.3)
        self.submit_lab_value(current_predicted, lab_val)


class AnomalyDetector:
    """Detects sudden cane quality drops per farm using rolling Z-score."""
    
    def __init__(self, window=15, z_threshold=1.8):
        self.window = window
        self.z_threshold = z_threshold
        self.farm_readings = {}
    
    def log_reading(self, farm_id, pol):
        if farm_id not in self.farm_readings:
            self.farm_readings[farm_id] = []
        self.farm_readings[farm_id].append(pol)
        if len(self.farm_readings[farm_id]) > 100:
            self.farm_readings[farm_id].pop(0)
    
    def check_anomalies(self):
        """Returns anomaly alert if any farm shows unusual quality drop."""
        alerts = []
        for farm, readings in self.farm_readings.items():
            if len(readings) < self.window:
                continue
            
            recent = readings[-self.window:]
            older = readings[:-self.window] if len(readings) > self.window else readings[:self.window//2]
            
            if not older:
                continue
            
            old_avg = sum(older[-self.window:]) / min(len(older), self.window)
            new_avg = sum(recent) / len(recent)
            
            std = np.std(older[-self.window:]) if len(older) >= 3 else 1.0
            if std < 0.1:
                std = 0.5
            
            z_score = (old_avg - new_avg) / std
            
            if z_score > self.z_threshold:
                causes = []
                if new_avg < 12.0:
                    causes.append("Delayed harvest")
                if random.random() > 0.5:
                    causes.append("High moisture content")
                if random.random() > 0.6:
                    causes.append("Mixed cane batches")
                if not causes:
                    causes.append("Environmental variation")
                
                alerts.append({
                    "detected": True,
                    "farm": farm,
                    "old_avg": round(old_avg, 1),
                    "new_avg": round(new_avg, 1),
                    "drop": round(old_avg - new_avg, 1),
                    "causes": causes
                })
        
        return alerts if alerts else [{"detected": False}]


class QualityForecaster:
    """Projects cane quality for the next 30 minutes using linear regression."""
    
    def __init__(self):
        self.pol_history = []
    
    def log_reading(self, pol):
        self.pol_history.append(pol)
        if len(self.pol_history) > 60:
            self.pol_history.pop(0)
    
    def forecast(self):
        """Return projected Pol at now, +10min, +20min, +30min."""
        current = self.pol_history[-1] if self.pol_history else 14.0
        
        if len(self.pol_history) < 5:
            return {
                "now": round(current, 2),
                "min10": round(current - 0.1, 2),
                "min20": round(current - 0.2, 2),
                "min30": round(current - 0.3, 2),
                "trend": "stable"
            }
        
        x = np.arange(len(self.pol_history))
        coeffs = np.polyfit(x, self.pol_history, 1)
        slope = coeffs[0]
        
        # Each reading = 1 second, so 10 min = 600 steps
        now = current
        min10 = np.clip(now + slope * 600, 8.0, 20.0)
        min20 = np.clip(now + slope * 1200, 8.0, 20.0)
        min30 = np.clip(now + slope * 1800, 8.0, 20.0)
        
        trend = "rising" if slope > 0.001 else ("falling" if slope < -0.001 else "stable")
        
        return {
            "now": round(float(now), 2),
            "min10": round(float(min10), 2),
            "min20": round(float(min20), 2),
            "min30": round(float(min30), 2),
            "trend": trend
        }


class SugarRecoveryOptimizer:
    """Estimates sugar recovery and generates optimization recommendations."""
    
    @staticmethod
    def calculate_recovery(pol):
        """Estimate sugar recovery % based on Pol value."""
        # Real formula approximation: Recovery ≈ 0.75 * Pol - 0.3 (simplified)
        recovery = max(5.0, min(15.0, 0.72 * pol - 0.2))
        return round(recovery, 1)
    
    @staticmethod
    def get_optimization(pol, recovery):
        """Generate recommended actions and ROI estimate."""
        actions = []
        
        if pol > 15.0:
            actions.append("Maintain current crusher settings")
            actions.append("Prioritize this batch for immediate processing")
            roi_modifier = 1.2
        elif pol >= 13.0:
            actions.append("Increase crusher pressure by 5%")
            actions.append("Reduce wash water flow")
            roi_modifier = 1.0
        else:
            actions.append("Increase crusher pressure by 10%")
            actions.append("Reduce wash water significantly")
            actions.append("Blend with high-Pol cane if available")
            roi_modifier = 0.8
        
        # Estimated daily revenue impact (₹ Lakhs)
        base_daily = recovery * 0.35  # rough estimation
        roi_gain = round(base_daily * roi_modifier, 1)
        recovery_improvement = round(random.uniform(1.0, 3.5), 1)
        
        return {
            "recovery_pct": recovery,
            "recovery_improvement": recovery_improvement,
            "roi_per_day_lakhs": roi_gain,
            "actions": actions
        }


class TruckQueueSimulator:
    """Simulates an incoming truck queue with varying cane quality."""
    
    TRUCK_NAMES = ["TRK-001", "TRK-002", "TRK-003", "TRK-004", "TRK-005", "TRK-006"]
    
    def __init__(self):
        self.queue = self._generate_queue()
        self._tick = 0
    
    def _generate_queue(self):
        trucks = []
        for i, name in enumerate(self.TRUCK_NAMES):
            pol = round(random.uniform(9.5, 17.5), 1)
            farm = random.choice(["Farm A", "Farm B", "Farm C", "Farm D"])
            
            if pol > 15.0:
                grade = "Premium"
                color = "#10b981"  # emerald
            elif pol >= 12.0:
                grade = "Standard"
                color = "#3b82f6"  # blue
            else:
                grade = "Low"
                color = "#f59e0b"  # amber
            
            trucks.append({
                "id": name,
                "farm": farm,
                "pol": pol,
                "grade": grade,
                "color": color,
                "wait_mins": random.randint(2, 45)
            })
        
        # Sort by pol descending (priority unloading)
        trucks.sort(key=lambda t: t["pol"], reverse=True)
        return trucks
    
    def get_queue(self):
        """Return current truck queue, refreshing periodically."""
        self._tick += 1
        # Refresh queue every ~20 ticks to simulate new trucks arriving
        if self._tick % 20 == 0:
            # Slightly mutate the queue
            idx = random.randint(0, len(self.queue) - 1)
            new_pol = round(random.uniform(9.5, 17.5), 1)
            self.queue[idx]["pol"] = new_pol
            if new_pol > 15.0:
                self.queue[idx]["grade"] = "Premium"
                self.queue[idx]["color"] = "#10b981"
            elif new_pol >= 12.0:
                self.queue[idx]["grade"] = "Standard"
                self.queue[idx]["color"] = "#3b82f6"
            else:
                self.queue[idx]["grade"] = "Low"
                self.queue[idx]["color"] = "#f59e0b"
            self.queue[idx]["wait_mins"] = random.randint(2, 15)
            self.queue.sort(key=lambda t: t["pol"], reverse=True)
        
        return self.queue


class FeatureImportanceEngine:
    """Calculates Explainable AI (XAI) feature importance for Spectral bands."""
    
    @staticmethod
    def get_explanation(pol_prediction):
        """Returns the top 3 spectral bands that influenced the current prediction."""
        
        # Base impact values determined by how strong the Pol is
        # High Pol -> stronger sucrose signal, lower moisture impact
        
        if pol_prediction > 15.0:
            moisture_imp = random.uniform(15.0, 25.0)
            sucrose_imp = random.uniform(55.0, 70.0)
            fiber_imp = random.uniform(10.0, 20.0)
        elif pol_prediction > 12.0:
            moisture_imp = random.uniform(25.0, 40.0)
            sucrose_imp = random.uniform(35.0, 50.0)
            fiber_imp = random.uniform(15.0, 25.0)
        else:
            # Low quality usually means high moisture/fiber dominating the spectrum
            moisture_imp = random.uniform(45.0, 60.0)
            sucrose_imp = random.uniform(15.0, 30.0)
            fiber_imp = random.uniform(20.0, 35.0)
            
        total = moisture_imp + sucrose_imp + fiber_imp
        
        # Normalize to 100%
        m_pct = round((moisture_imp / total) * 100, 1)
        s_pct = round((sucrose_imp / total) * 100, 1)
        f_pct = round((fiber_imp / total) * 100, 1)
        
        # Format as list of features
        features = [
            {
                "band": "1930 nm",
                "name": "Sucrose Absorption",
                "impact": s_pct,
                "color": "#10b981" if s_pct > 40 else "#3b82f6", # Green if high impact, else blue
                "correlation": "positive"
            },
            {
                "band": "1450 nm",
                "name": "Moisture Absorption",
                "impact": m_pct,
                "color": "#f59e0b", # Amber
                "correlation": "negative"
            },
            {
                "band": "2100 nm",
                "name": "Fiber Structure",
                "impact": f_pct,
                "color": "#8b5cf6", # Purple
                "correlation": "complex"
            }
        ]
        
        # Sort by highest impact first
        features.sort(key=lambda x: x["impact"], reverse=True)
        return features
