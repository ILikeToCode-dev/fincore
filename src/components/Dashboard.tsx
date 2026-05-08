import { useState, useMemo, useEffect } from "react";
import { Terminal, Settings, RefreshCw, AlertTriangle, TrendingUp, MessageSquare, LayoutDashboard } from "lucide-react";
import { PurchasingMeter } from "./PurchasingMeter";
import { MonteCarloChart } from "./MonteCarloChart";
import { VolumeTracker } from "./VolumeTracker";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "./ThemeContext";
import { randomNormal } from "../lib/utils";
import { WarpGrid } from "./WarpGrid";
import { ASSET_TYPES } from "../lib/constants";
import { PricesTab } from "./PricesTab";
import { ChatTab } from "./ChatTab";
import { Logo } from "./Logo";

function generateRealValueSimulation(initialSavings: number, years: number, meanRate: number, sdRate: number) {
  const numIterations = 1000;
  const paths: number[][] = [];

  for (let i = 0; i < numIterations; i++) {
    const path = [initialSavings];
    let currentMultiplier = 1;
    for (let y = 0; y < years; y++) {
      const rate = randomNormal(meanRate, sdRate);
      currentMultiplier *= (1 + rate);
      path.push(initialSavings / currentMultiplier);
    }
    paths.push(path);
  }

  const medianPath = [];
  const upperPath = [];
  const lowerPath = [];

  for (let y = 0; y <= years; y++) {
    const yearValues = paths.map(p => p[y]).sort((a, b) => a - b);
    // Lower path is index 100 (10th percentile), upper is 900 (90th percentile)
    lowerPath.push(yearValues[Math.floor(numIterations * 0.10)]);
    medianPath.push(yearValues[Math.floor(numIterations * 0.50)]);
    upperPath.push(yearValues[Math.floor(numIterations * 0.90)]);
  }

  return {
    median_path: medianPath,
    upper_bound_90: upperPath,
    lower_bound_10: lowerPath,
  };
}

export function Dashboard({ onBack }: { onBack: () => void }) {
  const [initialSavings, setInitialSavings] = useState(1000000);
  const [timeHorizon, setTimeHorizon] = useState(30);
  const [assetType, setAssetType] = useState<string>("cash");
  const [customInflationRate, setCustomInflationRate] = useState<number>(ASSET_TYPES["cash"].defaultRate);
  const [activeTab, setActiveTab] = useState<'simulator' | 'prices' | 'chat'>('simulator');
  
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationData, setSimulationData] = useState<any>(undefined);

  useEffect(() => {
    if (assetType !== "custom") {
      setCustomInflationRate(ASSET_TYPES[assetType].defaultRate);
    }
  }, [assetType]);

  const runSimulation = async (horizon: number, rate: number, asset: string, amount: number) => {
    setIsSimulating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const assetConf = ASSET_TYPES[asset];
      const data = generateRealValueSimulation(amount, horizon, rate / 100, assetConf.sd);
      setSimulationData({ ...data, asset, rate });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

  useEffect(() => {
    runSimulation(30, ASSET_TYPES["cash"].defaultRate, "cash", 1000000);
  }, []);

  const handleRunSimulation = () => {
    runSimulation(timeHorizon, customInflationRate, assetType, initialSavings);
  };

  const handleReset = () => {
    setInitialSavings(1000000);
    setTimeHorizon(30);
    setAssetType("cash");
    setCustomInflationRate(ASSET_TYPES["cash"].defaultRate);
    runSimulation(30, ASSET_TYPES["cash"].defaultRate, "cash", 1000000);
  };

  const futureRealValue = useMemo(() => {
    if (!simulationData || simulationData.median_path.length === 0) {
       return initialSavings / Math.pow(1 + customInflationRate / 100, timeHorizon);
    }
    return simulationData.median_path[simulationData.median_path.length - 1];
  }, [simulationData, initialSavings, customInflationRate, timeHorizon]);

  const { theme, setTheme } = useTheme();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="min-h-screen flex flex-col font-ui text-text-main pb-24 md:pb-8 relative">
      <WarpGrid hideBacklight={true} />
      <header className="bg-transparent border-b border-white/5 sticky top-0 z-50">
        <div className="flex justify-between items-center px-6 h-16 w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-3 cursor-pointer active:opacity-80" onClick={onBack}>
            <Logo className="w-8 h-8" useSvg={false} />
            <span className="font-ui text-xl text-primary uppercase font-bold tracking-tighter">Fin_Core</span>
          </div>
          
          <div className="flex items-center gap-2 relative">
            <button 
              onClick={handleReset}
              className="px-3 py-1.5 flex items-center gap-1.5 text-xs font-data uppercase tracking-widest text-text-muted hover:text-text-main border border-transparent hover:border-border transition-colors bg-surface-high rounded"
            >
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-surface-high transition-colors text-primary rounded"
            >
              <Settings className="w-5 h-5" />
            </button>
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-12 mt-2 w-48 bg-surface-container border border-border shadow-xl z-50 rounded"
                >
                  <div className="p-3 border-b border-border font-data text-xs uppercase text-text-muted">
                    Settings
                  </div>
                  <div className="p-2">
                    <div className="flex flex-col gap-1">
                      <button 
                        onClick={() => { setTheme('blue'); setShowSettings(false); }}
                        className={`text-left px-3 py-2 font-data text-sm flex items-center justify-between rounded ${theme === 'blue' ? 'bg-primary/20 text-primary' : 'hover:bg-surface-high text-text-main'}`}
                      >
                        Default Blue
                        {theme === 'blue' && <div className="w-2 h-2 bg-primary rounded-full" />}
                      </button>
                      <button 
                        onClick={() => { setTheme('orange'); setShowSettings(false); }}
                        className={`text-left px-3 py-2 font-data text-sm flex items-center justify-between rounded ${theme === 'orange' ? 'bg-primary/20 text-primary' : 'hover:bg-surface-high text-text-main'}`}
                      >
                        Terminal Orange
                        {theme === 'orange' && <div className="w-2 h-2 bg-primary rounded-full" />}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <div className="w-full max-w-7xl mx-auto px-5 pt-8 z-10 flex gap-2">
        <button 
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center gap-2 px-4 py-2 font-data text-xs uppercase tracking-widest rounded-t-lg border-t border-l border-r border-transparent ${activeTab === 'simulator' ? 'bg-surface/80 border-border text-primary' : 'text-text-muted hover:text-text-main'}`}
        >
          <LayoutDashboard className="w-4 h-4" /> Simulator
        </button>
        <button 
          onClick={() => setActiveTab('prices')}
          className={`flex items-center gap-2 px-4 py-2 font-data text-xs uppercase tracking-widest rounded-t-lg border-t border-l border-r border-transparent ${activeTab === 'prices' ? 'bg-surface/80 border-border text-primary' : 'text-text-muted hover:text-text-main'}`}
        >
          <TrendingUp className="w-4 h-4" /> Real Prices
        </button>
        <button 
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-4 py-2 font-data text-xs uppercase tracking-widest rounded-t-lg border-t border-l border-r border-transparent ${activeTab === 'chat' ? 'bg-surface/80 border-border text-primary' : 'text-text-muted hover:text-text-main'}`}
        >
          <MessageSquare className="w-4 h-4" /> Assistant
        </button>
      </div>

      <main className="flex-grow w-full max-w-7xl mx-auto px-5 py-4 md:grid md:grid-cols-12 md:gap-5 z-10">
        {activeTab === 'simulator' && (
          <>
            <aside className="md:col-span-4 flex flex-col gap-4 mb-8 md:mb-0">
          <div className="bg-surface/90 backdrop-blur-3xl border border-white/20 p-6 flex flex-col gap-6 relative shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-2xl">
            <h2 className="text-xl font-bold text-white shadow-sm">Simulation Parameters</h2>
            
            <div className="flex flex-col gap-2">
              <label className="font-data text-[10px] text-text-muted uppercase tracking-widest">
                Initial Savings (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-[45%] text-text-muted font-bold font-data text-sm">₹</span>
                <input
                  type="number"
                  min="0"
                  value={initialSavings}
                  onChange={(e) => setInitialSavings(Number(e.target.value) || 0)}
                  className="w-full bg-surface/50 pl-8 pr-4 py-3 border border-border focus:border-primary outline-none transition-colors font-data text-text-main backdrop-blur-md rounded-lg"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-data text-[10px] text-text-muted uppercase tracking-widest flex justify-between">
                <span>Time Horizon (Years)</span>
                <span className="text-primary font-bold">{timeHorizon} Years</span>
              </label>
              <input
                type="range"
                min="1"
                max="40"
                value={timeHorizon}
                onChange={(e) => setTimeHorizon(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-text-muted font-data text-[10px] uppercase">
                <span>1 Yr</span>
                <span>40 Yrs</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-data text-[10px] text-text-muted uppercase tracking-widest">
                Asset Type
              </label>
              <select 
                value={assetType}
                onChange={(e) => setAssetType(e.target.value)}
                className="w-full bg-surface/50 px-4 py-3 border border-border focus:border-primary outline-none transition-colors font-data text-sm text-text-main appearance-none cursor-pointer backdrop-blur-md rounded-lg"
              >
                {Object.entries(ASSET_TYPES).map(([key, val]) => (
                  <option key={key} value={key} className="bg-surface text-text-main">{val.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-data text-[10px] text-text-muted uppercase tracking-widest flex justify-between">
                <span>Inflation Rate (%)</span>
                <span className="text-primary font-bold">{customInflationRate.toFixed(1)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="15"
                step="0.1"
                value={customInflationRate}
                onChange={(e) => setCustomInflationRate(Number(e.target.value))}
                className="w-full"
                disabled={assetType !== "custom"}
              />
              <div className="flex justify-between text-text-muted font-data text-[10px] uppercase">
                <span>0%</span>
                <span>15%</span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-1">
                {[
                  { label: "Optimistic", rate: 6.0 },
                  { label: "Moderate", rate: 7.0 },
                  { label: "Historical", rate: 7.8 },
                  { label: "Conservative", rate: 8.0 }
                ].map(preset => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      setAssetType("custom");
                      setCustomInflationRate(preset.rate);
                    }}
                    className={`flex flex-col items-center justify-center py-2 px-1 border transition-colors rounded ${customInflationRate === preset.rate && assetType === "custom" ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface/50 text-text-muted hover:border-primary/50 hover:text-text-main"}`}
                  >
                    <span className="font-data text-xs font-bold">{preset.rate}%</span>
                    <span className="font-ui text-[9px] uppercase tracking-wider text-center">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={handleRunSimulation}
              disabled={isSimulating}
              className="mt-2 w-full bg-primary/90 hover:bg-primary disabled:bg-primary/50 backdrop-blur-md text-background flex items-center justify-center font-data font-bold py-3 px-4 transition-colors uppercase tracking-widest text-sm border border-primary gap-2 cursor-pointer shadow-lg shadow-primary/20 rounded-xl"
            >
              {isSimulating ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-background border-t-transparent animate-spin" />
                  Running...
                </>
              ) : "Run Simulation"}
            </button>
          </div>
        </aside>

        <div className="md:col-span-8 flex flex-col gap-5">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <PurchasingMeter
              initialAmount={initialSavings}
              futureValue={futureRealValue}
              years={timeHorizon}
            />
          </motion.div>

          {assetType === "petrol" && simulationData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <VolumeTracker 
                itemName="Petrol"
                unit="Liters"
                price2014={72} /* constant reference */
                price2024={95}
                futureRealValue={futureRealValue}
                initialAmount={initialSavings}
              />
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <MonteCarloChart simulationData={simulationData} isLoading={isSimulating} />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6 border-l-4 border-primary bg-surface/90 backdrop-blur-3xl font-ui text-text-main shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col gap-4 rounded-2xl rounded-l-none border-t border-r border-b border-white/20"
          >
             <div>
               <h3 className="font-bold text-lg mb-1 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-warn" /> CRITICAL TAKEAWAY</h3>
               <p className="text-text-muted text-sm leading-relaxed">
                 This is why investing matters. Your <strong className="text-text-main">₹{Math.round(initialSavings).toLocaleString('en-IN')}</strong> needs to grow at 
                 <strong className="text-text-main"> &gt;{customInflationRate.toFixed(1)}% annually</strong> just to maintain its purchasing power. 
                 At {Math.ceil(customInflationRate)}% growth, you break even. At 12% growth, you could buy 
                 <strong className="text-primary"> {Math.max(1, Math.round(Math.pow(1.12 / (1 + customInflationRate/100), timeHorizon) * 10) / 10)}X</strong> more stuff in {timeHorizon} years.
               </p>
             </div>
             <div>
               <button
                 onClick={() => {
                   const reduction = initialSavings > 0 ? Math.round((1 - futureRealValue / initialSavings) * 100) : 0;
                   const shareText = `💰 In ${timeHorizon} years, ₹${initialSavings.toLocaleString('en-IN')} will lose ${reduction}% of its purchasing power due to ${customInflationRate}% inflation! The value drops to just ₹${Math.round(futureRealValue).toLocaleString('en-IN')}.\n\n#Inflation #India #FinCore`;
                   navigator.clipboard.writeText(shareText);
                   alert("Copied to clipboard!");
                 }}
                 className="px-4 py-2 bg-surface border border-border hover:border-primary text-xs font-data uppercase tracking-widest text-text-muted hover:text-primary transition-colors flex items-center gap-2 rounded"
               >
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                 Share Results
               </button>
             </div>
          </motion.div>
        </div>
          </>
        )}

        {activeTab === 'prices' && (
          <div className="col-span-12">
            <PricesTab />
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="col-span-12">
            <ChatTab 
              contextData={{
                initialSavings,
                timeHorizon,
                inflationRate: customInflationRate,
                assetLabel: ASSET_TYPES[assetType]?.label || "Custom"
              }} 
            />
          </div>
        )}
      </main>

      <footer className="border-t border-border mt-auto z-10 bg-background/50 backdrop-blur-md">
        <div className="w-full py-6 px-6 flex flex-col md:flex-row justify-between items-center gap-4 max-w-7xl mx-auto text-center md:text-left">
          <span className="font-data text-[10px] text-text-main opacity-80 uppercase tracking-widest leading-relaxed">
            Historical inflation data: RBI, Ministry of Statistics (2024-2026)<br/>
            © 2026 Fin_Core Terminal
          </span>
          <div className="flex gap-6">
            <a href="#" className="font-data text-[10px] text-text-muted hover:text-text-main transition-colors uppercase tracking-widest">System Status</a>
            <a href="#" className="font-data text-[10px] text-text-muted hover:text-text-main transition-colors uppercase tracking-widest">API</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

