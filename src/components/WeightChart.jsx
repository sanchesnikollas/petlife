import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-alt rounded-2xl shadow-xl px-4 py-3 border border-gray-100">
      <p className="text-[10px] text-text-secondary font-medium uppercase tracking-wide">{label}</p>
      <p className="text-lg font-bold text-primary mt-0.5">{payload[0].value} <span className="text-xs font-medium text-text-secondary">kg</span></p>
    </div>
  );
};

const CustomDot = ({ cx, cy, index, dataLength }) => {
  const isLast = index === dataLength - 1;
  return (
    <g>
      <circle cx={cx} cy={cy} r={isLast ? 5 : 3} fill="#2D6A4F" stroke="white" strokeWidth={2} />
      {isLast && (
        <circle cx={cx} cy={cy} r={10} fill="#2D6A4F" fillOpacity={0.15} className="animate-pulse-soft" />
      )}
    </g>
  );
};

export default function WeightChart({ data }) {
  if (!data || data.length === 0) return null;

  const lastWeight = data[data.length - 1]?.value;
  const prevWeight = data.length > 1 ? data[data.length - 2]?.value : lastWeight;
  const diff = lastWeight - prevWeight;
  const trend = diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable';
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-accent' : trend === 'down' ? 'text-primary' : 'text-text-secondary';
  const trendBg = trend === 'up' ? 'bg-warning-light' : trend === 'down' ? 'bg-primary-50' : 'bg-gray-100';

  const minVal = Math.min(...data.map((d) => d.value));
  const maxVal = Math.max(...data.map((d) => d.value));
  const padding = Math.max(0.5, (maxVal - minVal) * 0.2);

  return (
    <div className="bg-surface-alt rounded-2xl p-4 border border-gray-100 shadow-sm animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-text-primary">Evolução do Peso</h3>
          <p className="text-xs text-text-secondary">{data.length} registros</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-text-primary">{lastWeight}kg</span>
          <div className={`flex items-center gap-0.5 px-2 py-1 rounded-full text-xs font-semibold ${trendBg} ${trendColor}`}>
            <TrendIcon size={12} />
            {Math.abs(diff).toFixed(1)}kg
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2D6A4F" stopOpacity={0.25} />
                <stop offset="50%" stopColor="#52B788" stopOpacity={0.1} />
                <stop offset="100%" stopColor="#52B788" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#95D5B2" />
                <stop offset="100%" stopColor="#2D6A4F" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" strokeOpacity={0.6} vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              domain={[minVal - padding, maxVal + padding]}
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}`}
              tickCount={5}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#2D6A4F', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <ReferenceLine y={lastWeight} stroke="#2D6A4F" strokeDasharray="3 3" strokeOpacity={0.3} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="url(#lineGradient)"
              strokeWidth={2.5}
              fill="url(#weightGradient)"
              dot={(props) => <CustomDot {...props} dataLength={data.length} />}
              activeDot={{ fill: '#52B788', stroke: 'white', strokeWidth: 3, r: 7 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
