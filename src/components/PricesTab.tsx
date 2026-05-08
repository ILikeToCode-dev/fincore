import { ASSET_TYPES } from "../lib/constants";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { useState, useEffect } from "react";

export function PricesTab() {
  const [livePrices, setLivePrices] = useState<any>({ gold: null, silver: null, petrol: null, chocolate: 50 });
  const [isLoading, setIsLoading] = useState(true);

  const fetchLivePrices = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/prices");
      const data = await res.json();
      
      const goldPrice = data.gold?.price_gram_24k ? data.gold.price_gram_24k * 10 : null; // Custom 10g logic
      const silverPrice = data.silver?.price_gram_24k ? data.silver.price_gram_24k * 1000 : null; // 1kg
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

  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
      <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-6 md:p-10 flex flex-col gap-6 relative shadow-2xl rounded-2xl w-full">
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
      </div>
    </div>
  );
}
