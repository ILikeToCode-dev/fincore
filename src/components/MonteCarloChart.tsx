import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Info, Sparkles } from "lucide-react";
import { useMemo } from "react";

interface MonteCarloChartProps {
  simulationData?: {
    median_path: number[];
    upper_bound_90: number[];
    lower_bound_10: number[];
  };
  isLoading: boolean;
}

export function MonteCarloChart({ simulationData, isLoading }: MonteCarloChartProps) {
  const data = useMemo(() => {
    if (!simulationData) return [];
    
    return simulationData.median_path.map((median, idx) => ({
      year: new Date().getFullYear() + idx,
      median,
      range: [
        simulationData.lower_bound_10[idx],
        simulationData.upper_bound_90[idx],
      ],
      high: simulationData.upper_bound_90[idx],
      low: simulationData.lower_bound_10[idx],
    }));
  }, [simulationData]);

  // Use a custom tooltip to display data clearly
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const year = payload[0].payload.year;
      const median = payload[0].payload.median;
      const high = payload[0].payload.high;
      const low = payload[0].payload.low;
      return (
        <div className="bg-surface/90 backdrop-blur-md border border-border p-3 flex flex-col font-mono text-[10px] text-text-main shadow-xl">
           <div className="text-text-muted mb-2 border-b border-border pb-1">Year {year}</div>
           <div className="flex justify-between gap-4">
             <span className="text-text-muted uppercase">90th %ile:</span><span>₹{Math.round(high).toLocaleString('en-IN')}</span>
           </div>
           <div className="flex justify-between gap-4 font-bold text-danger">
             <span className="uppercase">Median:</span><span>₹{Math.round(median).toLocaleString('en-IN')}</span>
           </div>
           <div className="flex justify-between gap-4">
             <span className="text-text-muted uppercase">10th %ile:</span><span>₹{Math.round(low).toLocaleString('en-IN')}</span>
           </div>
        </div>
      )
    }
    return null;
  }

  return (
    <div className="flex flex-col font-ui relative">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold text-white leading-tight flex items-center gap-2">
            1,000 Monte Carlo Outcomes
          </h2>
          <p className="text-primary flex items-center gap-1 font-data text-[10px] mt-1 uppercase tracking-wider">
            <Sparkles className="w-3 h-3" /> Real Value Statistical Projection
          </p>
        </div>
      </div>

      <div className="h-56 w-full relative pt-4 overflow-hidden block rounded mt-2">
        {/* Faux Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between opacity-10 pointer-events-none p-4 z-0">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-full border-b border-white" />
          ))}
        </div>

        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/50 backdrop-blur-sm rounded">
            <div className="font-data text-primary text-sm uppercase tracking-widest animate-pulse">Running 1,000 iterations...</div>
          </div>
        )}

        {!simulationData && !isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/50 rounded">
            <div className="font-data text-text-muted text-xs uppercase tracking-widest">Click 'Run Simulation' to load projection</div>
          </div>
        )}

        {simulationData && (
          <div className="absolute inset-0 z-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorHighLow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="year" hide />
              <YAxis domain={['auto', 'auto']} hide />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ stroke: 'var(--color-border)', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area 
                type="monotone" 
                dataKey="range" 
                stroke="none" 
                fill="url(#colorHighLow)" 
                animationDuration={800}
              />
              <Area 
                type="monotone" 
                dataKey="median" 
                stroke="var(--color-danger)" 
                strokeWidth={2}
                fill="none" 
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
          </div>
        )}
      </div>

    </div>
  );
}
