import { ASSET_TYPES } from "../lib/constants";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { useState, useEffect, useMemo } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";

export function PricesTab() {
  const [livePrices, setLivePrices] = useState<any>({ gold: null, silver: null, petrol: null, chocolate: 50 });
  const [isLoading, setIsLoading] = useState(true);

  const fetchLivePrices = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/prices");
      const data = await res.json();
      
      const goldPrice = data.metals?.gram_in_inr ? data.metals.gram_in_inr : null;
      const silverPrice = data.metals?.silver_gram_in_inr ? data.metals.silver_gram_in_inr : null;
      const petrolPrice = data.petrol?.fuel_price?.[0]?.petrol?.retailPrice ? parseFloat(data.petrol.fuel_price[0].petrol.retailPrice) : null;
      
      setLivePrices({
        gold: goldPrice,
        silver: silverPrice,
        petrol: petrolPrice,
        chocolate: 50
      });
    } catch (e) {
      console.error("Failed to fetch live prices", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLivePrices();
  }, []);

  const assets = Object.entries(ASSET_TYPES).filter(([k]) => k !== "custom" && k !== "cash");

  const chartData = useMemo(() => {
    // Helper to calculate normalized index (2014 = 100)
    const norm = (val: number, base: number) => (val / base) * 100;
    
    // Base prices (2014)
    const gBase = ASSET_TYPES.gold.price2014;
    const sBase = ASSET_TYPES.silver.price2014;
    const pBase = ASSET_TYPES.petrol.price2014;

    const baseData = [
      { year: 2014, Gold: 100, Silver: 100, Petrol: 100 },
      { year: 2016, Gold: norm(2900, gBase), Silver: norm(41, sBase), Petrol: norm(65, pBase) },
      { year: 2018, Gold: norm(3100, gBase), Silver: norm(38, sBase), Petrol: norm(75, pBase) },
      { year: 2020, Gold: norm(5000, gBase), Silver: norm(65, sBase), Petrol: norm(80, pBase) },
      { year: 2022, Gold: norm(5200, gBase), Silver: norm(60, sBase), Petrol: norm(96, pBase) },
      { year: 2024, Gold: norm(7000, gBase), Silver: norm(85, sBase), Petrol: norm(95, pBase) },
    ];

    // Append current data (2026) based on live API or defaults
    const currentGold = livePrices.gold || ASSET_TYPES.gold.priceNow;
    const currentSilver = livePrices.silver || ASSET_TYPES.silver.priceNow;
    const currentPetrol = livePrices.petrol || ASSET_TYPES.petrol.priceNow;

    baseData.push({
      year: 2026,
      Gold: norm(currentGold, gBase),
      Silver: norm(currentSilver, sBase),
      Petrol: norm(currentPetrol, pBase),
    });

    return baseData;
  }, [livePrices]);

  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500 fade-in w-full">
      <div className="flex justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-white shadow-sm flex items-center gap-2">
            <TrendingUp className="text-primary w-6 h-6" />
              Real Historical vs Current Prices
            </h2>
            <p className="text-text-muted mt-2 max-w-3xl leading-relaxed">
              Comparing the actual market price of commodities in 2014 against today. This reveals the "true" inflation you experience when paying for specific goods, which often differs significantly from published general inflation metrics.
            </p>
          </div>
          <button 
            onClick={fetchLivePrices}
            disabled={isLoading}
            className="p-2 bg-surface border border-border rounded-lg text-text-main hover:text-primary transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="w-full overflow-x-auto mt-4">
          <table className="w-full text-left font-ui border-collapse">
            <thead>
              <tr className="border-b-2 border-border/50 text-text-muted font-data text-xs uppercase tracking-widest">
                <th className="py-4 pl-4 pr-2 font-medium">Commodity</th>
                <th className="py-4 px-4 font-medium text-right">2014 Price</th>
                <th className="py-4 px-4 font-medium text-right">Current Price</th>
                <th className="py-4 px-4 font-medium text-right">% Change</th>
                <th className="py-4 px-4 font-medium text-right">Unit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {assets.map(([key, item]) => {
                const currentVal = livePrices[key] || item.priceNow;
                const diff = currentVal - item.price2014;
                const pctChange = (diff / item.price2014) * 100;
                
                return (
                  <motion.tr 
                    key={key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="hover:bg-white/5 transition-colors group"
                  >
                    <td className="py-5 pl-4 pr-2 font-bold text-white">
                      {item.label.split(" (")[0]}
                      <span className="block text-xs font-normal text-text-muted mt-1 font-data">{item.label.split("(")[1]?.replace(")", "") || ""}</span>
                    </td>
                    <td className="py-5 px-4 text-right font-data text-sm text-text-muted">
                      ₹{item.price2014.toLocaleString()}
                    </td>
                    <td className="py-5 px-4 text-right font-data text-sm font-bold text-white group-hover:text-primary transition-colors">
                      {isLoading ? (
                        <div className="w-16 h-4 bg-surface-high animate-pulse rounded ml-auto"></div>
                      ) : (
                        `₹${Math.round(currentVal).toLocaleString()}`
                      )}
                    </td>
                    <td className="py-5 px-4 text-right">
                      {isLoading ? (
                        <div className="w-16 h-6 bg-surface-high animate-pulse rounded ml-auto"></div>
                      ) : (
                        <span className={`inline-flex items-center gap-1 font-data text-sm px-2 py-1 rounded ${pctChange >= 0 ? "bg-danger/10 text-danger border border-danger/20" : "bg-green-500/10 text-green-500 border border-green-500/20"}`}>
                          {pctChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {pctChange.toFixed(1)}%
                        </span>
                      )}
                    </td>
                    <td className="py-5 px-4 text-right text-text-muted font-data text-xs uppercase">
                      {item.unit}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="mt-12 relative overflow-hidden">
           <h3 className="text-lg font-bold text-white mb-6 font-ui">Relative Price Evolution (2014 = 100)</h3>
           <div className="w-full h-[400px]">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart
                 data={chartData}
                 margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
               >
                 <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                 <XAxis 
                   dataKey="year" 
                   stroke="rgba(255,255,255,0.5)" 
                   tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: 'monospace' }}
                   tickLine={false}
                   axisLine={false}
                 />
                 <YAxis 
                   stroke="rgba(255,255,255,0.5)" 
                   tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: 'monospace' }}
                   tickLine={false}
                   axisLine={false}
                   tickFormatter={(val) => `${val}`}
                 />
                 <Tooltip 
                   contentStyle={{ backgroundColor: 'rgba(20,20,20,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontFamily: 'monospace' }}
                   itemStyle={{ color: '#fff' }}
                   formatter={(value: number, name: string) => {
                     // Since lines are normalized to 100, let's reverse calculate the real price for the tooltip
                     const assetKey = name.toLowerCase() as "gold" | "silver" | "petrol";
                     const basePrice = ASSET_TYPES[assetKey]?.price2014;
                     const realValue = (value / 100) * basePrice;
                     return [`₹${realValue.toLocaleString(undefined, {maximumFractionDigits: 2})}`, name];
                   }}
                 />
                 <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: 12, paddingTop: 20 }} />
                 <Line type="monotone" dataKey="Gold" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#1a1a1a', strokeWidth: 2 }} activeDot={{ r: 8 }} />
                 <Line type="monotone" dataKey="Silver" stroke="#cbd5e1" strokeWidth={3} dot={{ r: 4, fill: '#1a1a1a', strokeWidth: 2 }} activeDot={{ r: 8 }} />
                 <Line type="monotone" dataKey="Petrol" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#1a1a1a', strokeWidth: 2 }} activeDot={{ r: 8 }} />
               </LineChart>
             </ResponsiveContainer>
           </div>
        </div>
    </div>
  );
}
