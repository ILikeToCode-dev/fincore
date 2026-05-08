import { AnimatedNumber } from "./AnimatedNumber";
import { Droplet, Home, Coins, Box } from "lucide-react";

interface VolumeTrackerProps {
  itemName: string;
  unit: string;
  price2014: number;
  price2024: number;
  futureRealValue: number;
  initialAmount: number;
}

export function VolumeTracker({ itemName, unit, price2014, price2024, futureRealValue, initialAmount }: VolumeTrackerProps) {
  // Using an equivalent 2014 budget based on purchasing power backwards
  const backwardsMultiplier = price2024 / price2014; // ~ 1.31
  const budget2014 = initialAmount;
  const vol2014 = budget2014 / price2014;
  
  // Real calculation: Fixed amount today, compared to same amount in 2014, and real value in future.
  // Actually, the requirement asks: 
  // - TODAY: ₹10L / ₹95 per liter = 10,526 liters
  // - FUTURE: ₹[real_value] / ₹95 per liter = [calculated] liters
  const volToday = initialAmount / price2024;
  const volFuture = futureRealValue / price2024;

  const Icon = unit === "Liters" ? Droplet : unit === "Sq Ft" ? Home : unit === "Grams" ? Coins : Box;

  return (
    <div className="flex flex-col font-ui relative overflow-hidden">
      <h2 className="text-xl font-bold text-white leading-tight flex items-center gap-2 mb-1">
        The Shrinking {unit}
      </h2>
      <p className="text-text-muted text-xs mb-6">How much {itemName} you can buy today vs future</p>
      
      <div className="flex flex-col gap-4">
        {/* TODAY */}
        <div className="flex items-center gap-4">
          <div className="w-16 text-right font-data text-[10px] text-primary font-bold uppercase tracking-widest">Today</div>
          <div className="flex-1 bg-surface border border-border h-8 relative flex items-center shrink-0">
             <div className="bg-primary/50 h-full border-r border-primary absolute left-0" style={{ width: `100%`, transition: 'width 1s ease-out' }} />
             <div className="absolute left-0 h-full flex items-center justify-end overflow-hidden w-full">
               <div className="pr-2 text-primary/30">
                 <Icon className="w-4 h-4" />
               </div>
             </div>
          </div>
          <div className="w-24 font-data text-sm text-primary font-bold text-right flex justify-end gap-1 shrink-0"><AnimatedNumber value={volToday} format={(v) => Math.round(v).toLocaleString('en-IN')} /> <span className="text-text-muted">{unit}</span></div>
        </div>

        {/* Future */}
        <div className="flex items-center gap-4">
          <div className="w-16 text-right font-data text-[10px] text-danger uppercase font-bold tracking-widest">Future</div>
          <div className="flex-1 bg-surface border border-border h-8 relative flex items-center shrink-0">
             <div className="bg-danger/50 h-full border-r border-danger absolute left-0" style={{ width: `${Math.min(100, (volFuture/volToday)*100)}%`, transition: 'width 1s ease-out' }} />
             <div className="absolute left-0 h-full flex items-center justify-end overflow-hidden transition-all duration-1000" style={{ width: `${Math.min(100, (volFuture/volToday)*100)}%` }}>
               <div className="pr-2 text-danger/30">
                 <Icon className="w-4 h-4" />
               </div>
             </div>
          </div>
          <div className="w-24 font-data text-sm text-danger font-bold text-right flex justify-end gap-1 shrink-0"><AnimatedNumber value={volFuture} format={(v) => Math.round(v).toLocaleString('en-IN')} /> <span className="text-text-muted">{unit}</span></div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-surface/50 border border-border rounded-xl font-ui text-sm text-text-main shadow-inner">
        <p className="mb-2">If {itemName.toLowerCase()} costs ₹{price2024}/{unit.toLowerCase()} today, your ₹{initialAmount.toLocaleString('en-IN')} buys:</p>
        <ul className="list-none flex flex-col gap-1 mb-2 font-data">
          <li className="flex items-center gap-2">
            <span className="w-20 text-text-muted uppercase text-xs">Today:</span>
            <span>{Math.round(volToday).toLocaleString('en-IN')} {unit.toLowerCase()}</span>
            <span className="opacity-70 text-xs text-primary">{'⛽'.repeat(Math.max(0, Math.min(10, Math.ceil(volToday / 1000))) || 0)}</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-20 text-danger uppercase text-xs">Future:</span>
            <span className="text-danger font-bold">{Math.round(volFuture).toLocaleString('en-IN')} {unit.toLowerCase()}</span>
            <span className="opacity-70 text-xs text-danger">{'⛽'.repeat(Math.max(0, Math.min(10, Math.ceil((volFuture / (volToday || 1)) * Math.min(10, Math.ceil(volToday / 1000))))) || 0)}</span>
          </li>
        </ul>
        <p className="text-danger font-bold text-xs">
          ({Math.round((1 - volFuture / volToday) * 100)}% reduction in {itemName.toLowerCase()} purchasing power)
        </p>
      </div>
    </div>
  );
}
