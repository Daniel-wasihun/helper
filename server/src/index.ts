import express from "express";
import type { Request, Response } from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000", credentials: true }));
app.use(express.json());

// Routes
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", message: "Server is running smoothly on port " + PORT });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
