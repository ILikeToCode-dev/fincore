export const ASSET_TYPES: Record<string, { label: string, defaultRate: number, sd: number, price2014: number, priceNow: number, unit: string }> = {
  "cash": { label: "Cash (General Inflation)", defaultRate: 5.5, sd: 0.015, price2014: 1, priceNow: 1, unit: "Units" },
  "petrol": { label: "Petrol (Fuel/Transport)", defaultRate: 7.0, sd: 0.02, price2014: 72, priceNow: 95, unit: "Liters" },
  "gold": { label: "Gold (Inflation Hedge)", defaultRate: 8.5, sd: 0.03, price2014: 28000, priceNow: 62000, unit: "10g" },
  "silver": { label: "Silver (Precious Metal)", defaultRate: 7.5, sd: 0.04, price2014: 40000, priceNow: 75000, unit: "1kg" },
  "chocolate": { label: "Chocolate (Cocoa)", defaultRate: 12.0, sd: 0.05, price2014: 40, priceNow: 100, unit: "Bar" },
  "custom": { label: "Custom Inflation Rate", defaultRate: 6.0, sd: 0.02, price2014: 1, priceNow: 1, unit: "Units" },
};
