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
      const [metalRes, petrolRes] = await Promise.all([
        fetch("https://goldpricez.com/api/rates/currency/inr/measure/gram/metal/all", {
          headers: { "X-API-KEY": "5ccc62bfcb748bbaa031d3bf3345b4e75ccc62bf" }
        }),
        fetch("https://fuel.indianapi.in/live_fuel_price?city=delhi", {
          headers: { "x-api-key": "QUxMIFlPVVIgQkFTRSBBUkUgQkVMT05HIFRPIFVT" }
        })
      ]);

      const metalData = await metalRes.json().catch(() => null);
      const petrolData = await petrolRes.json().catch(() => null);

      res.json({
        metals: metalData,
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
