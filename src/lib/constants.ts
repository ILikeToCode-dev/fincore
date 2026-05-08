export const ASSET_TYPES: Record<string, { label: string, defaultRate: number, sd: number, price2014: number, priceNow: number, unit: string }> = {
  "cash": { label: "Cash (General Inflation)", defaultRate: 5.5, sd: 0.015, price2014: 1, priceNow: 1, unit: "Units" },
  "petrol": { label: "Petrol (Fuel/Transport)", defaultRate: 7.0, sd: 0.02, price2014: 72, priceNow: 95, unit: "Liters" },
  "gold": { label: "Gold (Inflation Hedge)", defaultRate: 8.5, sd: 0.03, price2014: 2800, priceNow: 14349, unit: "1g" },
  "silver": { label: "Silver (Precious Metal)", defaultRate: 7.5, sd: 0.04, price2014: 40, priceNow: 244, unit: "1g" },
  "chocolate": { label: "Chocolate (Cocoa)", defaultRate: 12.0, sd: 0.05, price2014: 40, priceNow: 100, unit: "Bar" },
  "custom": { label: "Custom Inflation Rate", defaultRate: 6.0, sd: 0.02, price2014: 1, priceNow: 1, unit: "Units" },
};
