import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.get("/api/prices", async (req, res) => {
    try {
      const [goldRes, silverRes, petrolRes] = await Promise.all([
        fetch("https://www.goldapi.io/api/XAU/INR", {
          headers: { "x-access-token": "goldapi-b33ccf45d6e957f04e9b128929f6b2fc-io" }
        }),
        fetch("https://www.goldapi.io/api/XAG/INR", {
          headers: { "x-access-token": "goldapi-b33ccf45d6e957f04e9b128929f6b2fc-io" }
        }),
        fetch("https://fuel.indianapi.in/live_fuel_price?city=delhi", {
          headers: { "x-api-key": "QUxMIFlPVVIgQkFTRSBBUkUgQkVMT05HIFRPIFVT" }
        })
      ]);

      const goldData = await goldRes.json().catch(() => null);
      const silverData = await silverRes.json().catch(() => null);
      const petrolData = await petrolRes.json().catch(() => null);

      res.json({
        gold: goldData,
        silver: silverData,
        petrol: petrolData
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
