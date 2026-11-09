import "dotenv/config";
import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth.ts";
import { requireAuth } from "./middleware/auth.ts";
import prisma from "./lib/prisma.ts";
import type { AuthenticatedRequest } from "./types/auth.ts";

const app = express();
const PORT = process.env.PORT || 3001;

// CORS
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000", credentials: true }));

// Better Auth route handler (mounted before express.json() to prevent request stream consumption)
app.all("/api/auth/*", toNodeHandler(auth));

// Body parser middleware
app.use(express.json());

// Protected "me" endpoint
app.get("/api/me", requireAuth, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  res.json({
    user: authReq.user,
    session: authReq.session,
  });
});

// Alias for /api/auth/me
app.get("/api/auth/me", requireAuth, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  res.json({
    user: authReq.user,
    session: authReq.session,
  });
});

// Health route
app.get("/api/health", async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "ok",
      database: "connected",
      message: `Server is running smoothly on port ${PORT} connected to Helper database`,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      database: "disconnected",
      message: error instanceof Error ? error.message : "Database connection error",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
