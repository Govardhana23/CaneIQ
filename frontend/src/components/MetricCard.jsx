import { Activity, Droplet, Thermometer, Maximize, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function MetricCard({ title, value, unit, icon: Icon, trend, colorClass = "text-green-400", bgClass = "bg-green-500/10" }) {
  return (
    <div className="bg-neutral-800 rounded-xl p-5 border border-neutral-700 shadow-lg flex flex-col justify-between hover:border-neutral-500 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-neutral-400 font-medium text-sm">{title}</h3>
        <div className={`p-2 rounded-lg ${bgClass}`}>
          <Icon className={`w-5 h-5 ${colorClass}`} />
        </div>
      </div>
      <div>
        <div className="flex items-baseline space-x-1">
          <span className="text-3xl font-bold text-white">{value}</span>
          {unit && <span className="text-neutral-400 text-sm font-medium">{unit}</span>}
        </div>
        {trend && (
          <p className={`text-xs mt-2 ${trend.startsWith('+') ? 'text-green-400' : (trend.startsWith('-') ? 'text-red-400' : 'text-neutral-400')}`}>
            {trend} from last hour
          </p>
        )}
      </div>
    </div>
  );
}
