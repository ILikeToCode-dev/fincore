import { AlertTriangle, Info } from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import { AnimatedNumber } from "./AnimatedNumber";

interface PurchasingMeterProps {
  initialAmount: number;
  futureValue: number;
  years: number;
}

export function PurchasingMeter({ initialAmount, futureValue, years }: PurchasingMeterProps) {
  const percentageLost = useMemo(() => {
    return Math.max(0, Math.min(100, ((initialAmount - futureValue) / initialAmount) * 100));
  }, [initialAmount, futureValue]);

  // For SVG gauge: circumference of semi-circle = PI * r
  const r = 40;
  const dashArray = Math.PI * r;
  const dashOffset = dashArray * (1 - percentageLost / 100);

  // Dynamic colors based on percentage
  const getColorName = () => {
    if (percentageLost <= 30) return { name: "Safe", var: "var(--color-primary)", tw: "text-primary border-primary", bgTw: "bg-primary/20", icon: Info };
    if (percentageLost <= 60) return { name: "Moderate", var: "var(--color-warn)", tw: "text-warn border-warn", bgTw: "bg-warn/20", icon: AlertTriangle };
    if (percentageLost <= 80) return { name: "High", var: "var(--color-alert)", tw: "text-alert border-alert", bgTw: "bg-alert/20", icon: AlertTriangle };
    return { name: "Critical", var: "var(--color-danger)", tw: "text-danger border-danger", bgTw: "bg-danger/20", icon: AlertTriangle };
  };

  const status = getColorName();

  return (
    <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-6 flex flex-col items-center justify-center relative font-ui shadow-2xl rounded-2xl">
      <div className="w-full flex justify-between items-start mb-8">
        <div>
          <h2 className="text-xl font-bold text-white">Purchasing Power Erosion</h2>
          <p className="text-text-muted mt-1 text-sm flex gap-1">
            Value after {years} years
          </p>
        </div>
        <div className={`${status.tw} ${status.bgTw} font-data text-xs px-2 py-1 flex items-center gap-1 border uppercase tracking-wider font-bold shrink-0`}>
          <status.icon className="w-3 h-3" /> {status.name} Risk
        </div>
      </div>

      {/* SVG Gauge */}
      <div className="relative w-72 h-40 flex items-end justify-center my-2">
        <svg viewBox="0 0 100 55" className="w-full h-full overflow-visible">
          <path 
            d="M 10 50 A 40 40 0 0 1 90 50" 
            fill="none" 
            stroke="var(--color-surface)" 
            strokeWidth="12" 
          />
          <motion.path 
            d="M 10 50 A 40 40 0 0 1 90 50" 
            fill="none" 
            stroke={status.var}
            strokeWidth="12" 
            strokeLinecap="butt"
            strokeDasharray={dashArray}
            initial={false}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </svg>

        <div className="absolute bottom-0 text-center flex flex-col pb-2">
          <span className={`font-data text-5xl font-bold ${status.tw.split(' ')[0]} tracking-tighter flex justify-center items-center`}>
            -<AnimatedNumber value={percentageLost} format={(v) => v.toFixed(2)} />%
          </span>
          <span className="font-data text-xs text-text-muted uppercase tracking-widest mt-1">
            Value Lost
          </span>
        </div>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <div className="bg-surface/50 p-4 flex flex-col items-center text-center border border-border relative overflow-hidden group rounded-xl">
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="font-data text-[10px] text-text-muted mb-1 uppercase tracking-widest">Today's Value</span>
          <span className="font-data text-lg text-text-main relative z-10">
            <AnimatedNumber value={initialAmount} format={(v) => `₹${Math.round(v).toLocaleString("en-IN")}`} />
          </span>
        </div>
        <div className="bg-surface/50 p-4 flex flex-col items-center text-center border border-border relative overflow-hidden group rounded-xl">
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="font-data text-[10px] text-text-muted mb-1 uppercase tracking-widest">Future Value (Nominal)</span>
          <span className="font-data text-lg text-text-main relative z-10">
            <AnimatedNumber value={initialAmount} format={(v) => `₹${Math.round(v).toLocaleString("en-IN")}`} />
          </span>
        </div>
        <div className="md:col-span-2 bg-danger/5 border border-danger/20 p-4 flex flex-col items-center text-center relative overflow-hidden group rounded-xl">
          <div className="absolute inset-0 bg-danger/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="font-data text-[10px] text-danger mb-1 uppercase tracking-widest font-bold">Future Value (Real)</span>
          <span className="font-data text-2xl font-bold text-danger relative z-10">
            <AnimatedNumber value={futureValue} format={(v) => `₹${Math.round(v).toLocaleString("en-IN")}`} />
          </span>
        </div>
      </div>
    </div>
  );
}

