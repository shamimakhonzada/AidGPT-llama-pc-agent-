import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import aiRoutes from "./routes/aiRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.use("/api/ai", aiRoutes);

app.get("/api/health", (req, res) =>
  res.json({ ok: true, now: new Date().toISOString() })
);

export default app;
