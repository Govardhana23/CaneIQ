import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import MetricCard from './MetricCard';
import SpectraChart from './SpectraChart';

import pkg from 'react-use-websocket';
const useWebSocket = (typeof pkg === 'function' ? pkg : (pkg.default || pkg.useWebSocket));
const ReadyState = pkg.ReadyState || { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3, UNINSTANTIATED: 4 };

const {
  Settings, Zap, CheckCircle, AlertTriangle, Activity,
  Crosshair, Brain, TrendingUp, TrendingDown, Minus,
  Star, Truck, Beaker, Factory, BarChart3, Shield,
  ArrowUpRight, ArrowDownRight
} = Lucide;

// Connect to the Live Render Backend URL
const SOCKET_URL = window.location.hostname === 'localhost' && window.location.port === '5173'
  ? 'ws://localhost:8000/ws/conveyor' // Local development fallback
  : 'wss://caneiq.onrender.com/ws/conveyor'; // Production (GitHub Pages) pointing to Render

export default function Dashboard() {
  const [currentReading, setCurrentReading] = useState(null);
  const [history, setHistory] = useState([]);

  const { lastJsonMessage, readyState } = useWebSocket(SOCKET_URL, {
    shouldReconnect: () => true,
    reconnectInterval: 3000,
  });

  useEffect(() => {
    if (lastJsonMessage) {
      setCurrentReading(lastJsonMessage);
      setHistory(prev => {
        const newHistory = [...prev, lastJsonMessage];
        if (newHistory.length > 20) newHistory.shift();
        return newHistory;
      });
    }
  }, [lastJsonMessage]);

  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting...',
    [ReadyState.OPEN]: 'Live Stream Active',
    [ReadyState.CLOSING]: 'Closing...',
    [ReadyState.CLOSED]: 'Disconnected. Retrying...',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  }[readyState];

  const getRoutingColor = (decision) => {
    if (!decision) return "text-neutral-400 bg-neutral-800";
    if (decision.includes("Premium")) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    if (decision.includes("Standard")) return "text-blue-400 bg-blue-500/10 border-blue-500/30";
    return "text-orange-400 bg-orange-500/10 border-orange-500/30";
  };

  if (!currentReading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="w-16 h-16 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin mb-4"></div>
        <p className="text-neutral-400 animate-pulse">{connectionStatus}</p>
      </div>
    );
  }

  const cal = currentReading.calibration;
  const anomalies = currentReading.anomalies || [];
  const activeAnomaly = anomalies.find(a => a.detected);
  const farmRankings = currentReading.farm_rankings || [];
  const forecast = currentReading.quality_forecast || {};
  const recovery = currentReading.sugar_recovery || {};
  const truckQueue = currentReading.truck_queue || [];

  return (
    <div className="space-y-6">
      {/* ═══ Top Metrics Row ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Predicted Pol %"
          value={currentReading.pol_prediction.toFixed(2)}
          unit="°Z"
          icon={Activity}
          trend={currentReading.pol_prediction > 13.5 ? "+0.2" : "-0.1"}
        />
        <MetricCard
          title="AI Confidence"
          value={currentReading.confidence.toFixed(1)}
          unit="%"
          icon={CheckCircle}
          colorClass={currentReading.confidence > 90 ? "text-green-400" : "text-yellow-400"}
          bgClass={currentReading.confidence > 90 ? "bg-green-500/10" : "bg-yellow-500/10"}
        />
        <MetricCard
          title="Current Source"
          value={currentReading.farm_source}
          icon={Settings}
          colorClass="text-blue-400"
          bgClass="bg-blue-500/10"
        />
        {currentReading.drift_alert ? (
          <MetricCard
            title="Sensor Status"
            value="Drift Detected"
            icon={AlertTriangle}
            colorClass="text-red-500"
            bgClass="bg-red-500/10"
          />
        ) : (
          <MetricCard
            title="Sensor Status"
            value="Optimal"
            icon={Zap}
            colorClass="text-emerald-400"
            bgClass="bg-emerald-500/10"
          />
        )}
      </div>

      {/* ═══ Row 2: Spectrum + Routing ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-neutral-800 border border-neutral-700 rounded-xl p-5 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-white flex items-center">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2"></span>
              Live NIR
            </h2>
            <span className="text-xs text-neutral-500 font-mono">700nm - 2500nm</span>
          </div>
          <div className="h-72 w-full">
            <SpectraChart data={currentReading.raw_spectrum} />
          </div>
        </div>

        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5 shadow-lg flex flex-col">
          <h2 className="text-lg font-semibold text-white mb-6">Smart Conveyor Routing</h2>
          <div className={`flex-1 flex flex-col justify-center items-center rounded-xl border-2 border-dashed ${getRoutingColor(currentReading.routing_decision)} p-6 text-center transition-colors duration-500`}>
            {currentReading.routing_decision.includes("Premium") && <CheckCircle className="w-16 h-16 mb-4" />}
            {currentReading.routing_decision.includes("Standard") && <Zap className="w-16 h-16 mb-4" />}
            {currentReading.routing_decision.includes("Low-Quality") && <AlertTriangle className="w-16 h-16 mb-4" />}
            <h3 className="text-2xl font-bold mb-2">{currentReading.routing_decision}</h3>
            <p className="text-sm opacity-80">
              Diverter Gate: {currentReading.routing_decision.includes("Premium") ? "A (High Priority)" : "B (Standard)"}
            </p>
          </div>
          <div className="mt-6 pt-6 border-t border-neutral-700">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-neutral-400">Stream Status</span>
              <span className="text-xs font-mono text-green-400">{connectionStatus}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-400">Update Frequency</span>
              <span className="text-xs font-mono text-neutral-300">1.0 Hz</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Row 3: AI Calibration + Quality Forecast ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Calibration Engine */}
        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5 shadow-lg">
          <div className="flex items-center mb-5">
            <div className="p-2 bg-purple-500/10 rounded-lg mr-3">
              <Crosshair className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">AI Calibration Engine</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-neutral-900/50 rounded-lg p-4">
              <p className="text-xs text-neutral-500 uppercase mb-1">Predicted Pol</p>
              <p className="text-2xl font-bold text-white">{cal?.predicted_pol ?? '--'}</p>
            </div>
            <div className="bg-neutral-900/50 rounded-lg p-4">
              <p className="text-xs text-neutral-500 uppercase mb-1">Lab Pol</p>
              <p className="text-2xl font-bold text-cyan-400">{cal?.lab_pol ?? 'Awaiting...'}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-400">Calibration Adjustment</span>
              <span className={`text-sm font-mono font-bold ${(cal?.adjustment || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {(cal?.adjustment || 0) >= 0 ? '+' : ''}{cal?.adjustment ?? '0.00'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-400">Model Drift</span>
              <span className={`text-xs px-2 py-1 rounded font-medium ${cal?.drift_level === 'Low' ? 'bg-green-500/20 text-green-400' :
                  cal?.drift_level === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    cal?.drift_level === 'High' ? 'bg-red-500/20 text-red-400' :
                      'bg-neutral-700 text-neutral-400'
                }`}>
                {cal?.drift_level ?? 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-400">Lab Samples</span>
              <span className="text-sm font-mono text-neutral-300">{cal?.samples_calibrated ?? 0}</span>
            </div>
          </div>

          {/* Calibration offset bar */}
          <div className="mt-4 pt-4 border-t border-neutral-700">
            <p className="text-xs text-neutral-500 mb-2">Calibration Offset History</p>
            <div className="h-2 bg-neutral-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.abs((cal?.adjustment || 0)) * 200 + 30)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Quality Forecast */}
        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5 shadow-lg">
          <div className="flex items-center mb-5">
            <div className="p-2 bg-blue-500/10 rounded-lg mr-3">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Incoming Cane Quality Forecast</h2>
            <span className={`ml-auto text-xs px-2 py-1 rounded ${forecast.trend === 'rising' ? 'bg-green-500/20 text-green-400' :
                forecast.trend === 'falling' ? 'bg-red-500/20 text-red-400' :
                  'bg-neutral-700 text-neutral-400'
              }`}>
              {forecast.trend === 'rising' ? '↑ Rising' : forecast.trend === 'falling' ? '↓ Falling' : '→ Stable'}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Now', value: forecast.now, accent: true },
              { label: '+10 min', value: forecast.min10 },
              { label: '+20 min', value: forecast.min20 },
              { label: '+30 min', value: forecast.min30 },
            ].map((item, i) => (
              <div key={i} className={`rounded-lg p-4 text-center ${item.accent ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-neutral-900/50'}`}>
                <p className="text-xs text-neutral-500 uppercase mb-1">{item.label}</p>
                <p className={`text-2xl font-bold ${item.accent ? 'text-blue-400' : 'text-white'}`}>{item.value ?? '--'}</p>
                <p className="text-xs text-neutral-500 mt-1">Pol %</p>
              </div>
            ))}
          </div>

          {/* Sparkline approximation */}
          <div className="mt-5 pt-4 border-t border-neutral-700">
            <div className="flex items-end justify-between h-16 gap-1">
              {history.slice(-15).map((item, i) => {
                const h = Math.max(8, ((item.pol_prediction - 8) / 12) * 64);
                const color = item.pol_prediction > 15 ? 'bg-emerald-400' : item.pol_prediction > 12 ? 'bg-blue-400' : 'bg-orange-400';
                return <div key={i} className={`flex-1 ${color} rounded-t opacity-80 transition-all duration-300`} style={{ height: `${h}px` }}></div>;
              })}
            </div>
            <p className="text-xs text-neutral-500 mt-2 text-center">Recent Pol % Trend (last 15 readings)</p>
          </div>
        </div>
      </div>

      {/* ═══ Row 3.5: Explainable AI ═══ */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5 shadow-lg">
          <div className="flex items-center mb-5">
            <div className="p-2 bg-indigo-500/10 rounded-lg mr-3 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <Brain className="w-5 h-5 text-indigo-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">AI Prediction Explanation (XAI)</h2>
            <span className="ml-auto text-xs text-neutral-500">Why was {currentReading.pol_prediction.toFixed(2)} Pol predicted?</span>
          </div>

          <p className="text-sm text-neutral-400 mb-6 font-medium">Top spectral bands influencing the current neural network prediction:</p>

          <div className="space-y-5">
            {(currentReading.explanation || []).map((feature, i) => (
              <div key={i} className="group">
                <div className="flex justify-between items-end mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-neutral-900 rounded text-xs font-mono font-bold text-neutral-300 border border-neutral-700 group-hover:border-neutral-500 transition-colors">{feature.band}</span>
                    <span className="text-sm font-semibold text-neutral-200">{feature.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold" style={{ color: feature.color }}>{feature.impact}%</span>
                    <span className="text-xs text-neutral-500 ml-1">impact</span>
                  </div>
                </div>

                {/* Horizontal Bar Chart */}
                <div className="w-full h-3 bg-neutral-900/80 rounded-full overflow-hidden border border-neutral-800 relative">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out relative"
                    style={{
                      width: `${feature.impact}%`,
                      backgroundColor: feature.color,
                      boxShadow: `0 0 10px ${feature.color}80`
                    }}
                  >
                    {/* Shimmer effect inside the bar */}
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ Row 4: Sugar Recovery + Anomaly Detection ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sugar Recovery Optimization */}
        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5 shadow-lg">
          <div className="flex items-center mb-5">
            <div className="p-2 bg-amber-500/10 rounded-lg mr-3">
              <Factory className="w-5 h-5 text-amber-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Sugar Recovery Optimization AI</h2>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-neutral-900/50 rounded-lg p-4 text-center">
              <p className="text-xs text-neutral-500 uppercase mb-1">Current Pol</p>
              <p className="text-xl font-bold text-white">{currentReading.pol_prediction.toFixed(1)}</p>
            </div>
            <div className="bg-neutral-900/50 rounded-lg p-4 text-center">
              <p className="text-xs text-neutral-500 uppercase mb-1">Est. Recovery</p>
              <p className="text-xl font-bold text-emerald-400">{recovery.recovery_pct}%</p>
            </div>
            <div className="bg-gradient-to-br from-amber-500/10 to-green-500/10 border border-amber-500/20 rounded-lg p-4 text-center">
              <p className="text-xs text-neutral-500 uppercase mb-1">ROI Impact</p>
              <p className="text-xl font-bold text-amber-400">₹{recovery.roi_per_day_lakhs}L</p>
              <p className="text-xs text-neutral-500">/day</p>
            </div>
          </div>

          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4 mb-3">
            <div className="flex items-center mb-2">
              <ArrowUpRight className="w-4 h-4 text-emerald-400 mr-2" />
              <span className="text-sm font-semibold text-emerald-400">+{recovery.recovery_improvement}% Recovery Improvement Possible</span>
            </div>
          </div>

          <div>
            <p className="text-xs text-neutral-500 uppercase mb-2">Recommended Actions</p>
            <div className="space-y-2">
              {(recovery.actions || []).map((action, i) => (
                <div key={i} className="flex items-center text-sm text-neutral-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-2 flex-shrink-0"></span>
                  {action}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Anomaly Detection */}
        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5 shadow-lg">
          <div className="flex items-center mb-5">
            <div className={`p-2 rounded-lg mr-3 ${activeAnomaly ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
              <Shield className={`w-5 h-5 ${activeAnomaly ? 'text-red-400 animate-pulse' : 'text-green-400'}`} />
            </div>
            <h2 className="text-lg font-semibold text-white">Cane Quality Anomaly Detection</h2>
          </div>

          {activeAnomaly ? (
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5 animate-pulse">
              <div className="flex items-center mb-3">
                <AlertTriangle className="w-6 h-6 text-red-400 mr-2" />
                <h3 className="text-red-400 font-bold text-lg">Anomaly Detected</h3>
              </div>
              <p className="text-sm text-neutral-300 mb-3">
                <span className="font-semibold text-white">{activeAnomaly.farm}</span> avg Pol dropped
              </p>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl font-bold text-neutral-400">{activeAnomaly.old_avg}</span>
                <ArrowDownRight className="w-5 h-5 text-red-400" />
                <span className="text-2xl font-bold text-red-400">{activeAnomaly.new_avg}</span>
                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">-{activeAnomaly.drop} Pol</span>
              </div>
              <div>
                <p className="text-xs text-neutral-500 uppercase mb-2">Possible Causes</p>
                <div className="space-y-1">
                  {activeAnomaly.causes.map((cause, i) => (
                    <div key={i} className="flex items-center text-sm text-neutral-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 mr-2"></span>
                      {cause}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-8 flex flex-col items-center justify-center text-center">
              <CheckCircle className="w-12 h-12 text-green-400 mb-3" />
              <h3 className="text-green-400 font-bold text-lg mb-1">All Clear</h3>
              <p className="text-sm text-neutral-400">No quality anomalies detected across all farm sources</p>
              <p className="text-xs text-neutral-500 mt-2">Using Z-score analysis &amp; rolling mean monitoring</p>
            </div>
          )}
        </div>
      </div>

      {/* ═══ Row 5: Farm Rankings + Truck Queue ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Farm Intelligence */}
        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5 shadow-lg">
          <div className="flex items-center mb-5">
            <div className="p-2 bg-green-500/10 rounded-lg mr-3">
              <BarChart3 className="w-5 h-5 text-green-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Farm Intelligence & Rankings</h2>
          </div>

          <div className="space-y-3">
            {farmRankings.map((farm, i) => (
              <div key={i} className={`flex items-center justify-between p-3 rounded-lg ${i === 0 ? 'bg-amber-500/5 border border-amber-500/20' : 'bg-neutral-900/50'}`}>
                <div className="flex items-center">
                  <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold mr-3 ${i === 0 ? 'bg-amber-500 text-black' : 'bg-neutral-700 text-neutral-400'
                    }`}>{i + 1}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{farm.farm_id}</p>
                    <p className="text-xs text-neutral-500">{farm.deliveries} deliveries</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{farm.avg_pol} <span className="text-xs text-neutral-500">Pol</span></p>
                    <div className="flex">
                      {Array.from({ length: farm.stars || 0 }).map((_, s) => (
                        <Star key={s} className="w-3 h-3 text-amber-400 fill-amber-400" />
                      ))}
                      {Array.from({ length: 5 - (farm.stars || 0) }).map((_, s) => (
                        <Star key={s} className="w-3 h-3 text-neutral-700" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {farmRankings.length > 0 && (
            <div className="mt-4 pt-4 border-t border-neutral-700">
              <p className="text-xs text-neutral-500 uppercase mb-2">AI Recommendation</p>
              <p className="text-sm text-neutral-300">
                {farmRankings[farmRankings.length - 1]?.recommendation}
              </p>
            </div>
          )}
        </div>

        {/* Truck Queue Heatmap */}
        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5 shadow-lg">
          <div className="flex items-center mb-5">
            <div className="p-2 bg-cyan-500/10 rounded-lg mr-3">
              <Truck className="w-5 h-5 text-cyan-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">📊 Cane Quality Heatmap — Truck Queue</h2>
          </div>

          {/* True Visual Heatmap Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {truckQueue.map((truck, i) => (
              <div
                key={i}
                className="relative overflow-hidden rounded-xl border border-neutral-700/50 p-4 transition-all duration-500 flex flex-col items-center justify-center text-center group"
                style={{
                  backgroundColor: `${truck.color}15`,
                  boxShadow: `inset 0 0 40px ${truck.color}10`
                }}
              >
                {/* Heatmap Glow Effect */}
                <div
                  className="absolute inset-0 opacity-20 transition-opacity group-hover:opacity-40"
                  style={{ backgroundImage: `radial-gradient(circle at center, ${truck.color} 0%, transparent 70%)` }}
                />

                <Truck className="w-8 h-8 mb-2 z-10 transition-transform group-hover:scale-110" style={{ color: truck.color }} />
                <h3 className="text-2xl font-bold z-10 text-white mb-1 shadow-black drop-shadow-md">
                  {truck.pol} <span className="text-xs font-normal opacity-70 tracking-widest uppercase">Pol</span>
                </h3>
                <div className="z-10 flex flex-col items-center">
                  <span className="text-xs font-mono font-semibold text-white/90 bg-black/40 px-2 py-0.5 rounded mb-1">{truck.id}</span>
                  <span className="text-[10px] text-white/60">{truck.farm} • {truck.wait_mins}m wait</span>
                </div>

                {/* Intensity Indicator Line */}
                <div className="absolute bottom-0 left-0 right-0 h-1.5 opacity-80" style={{ backgroundColor: truck.color }}></div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-neutral-700 flex items-center justify-between">
            <p className="text-xs text-neutral-500">Sorted by processing priority</p>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5 text-xs text-neutral-400"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>Premium</div>
              <div className="flex items-center gap-1.5 text-xs text-neutral-400"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>Standard</div>
              <div className="flex items-center gap-1.5 text-xs text-neutral-400"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>Low</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Row 6: History Log ═══ */}
      <div className="bg-neutral-800 border border-neutral-700 rounded-xl shadow-lg overflow-hidden">
        <div className="p-4 border-b border-neutral-700 bg-neutral-800/50">
          <h3 className="text-sm font-semibold text-neutral-300">Recent Quality Log</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-neutral-500 uppercase bg-neutral-900/50">
              <tr>
                <th className="px-6 py-3">Time</th>
                <th className="px-6 py-3">Source</th>
                <th className="px-6 py-3">Est. Pol (%)</th>
                <th className="px-6 py-3">Confidence</th>
                <th className="px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {history.slice().reverse().map((item, i) => (
                <tr key={i} className="border-b border-neutral-700 hover:bg-neutral-700/30">
                  <td className="px-6 py-3 font-mono text-neutral-400">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-3 text-neutral-300">{item.farm_source}</td>
                  <td className="px-6 py-3 font-semibold text-white">{item.pol_prediction.toFixed(2)}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${item.confidence > 90.0 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {item.confidence.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-3 text-neutral-400">{item.routing_decision}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
