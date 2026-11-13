import "dotenv/config";
import crypto from "node:crypto";
import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { hashPassword } from "better-auth/crypto";
import { auth } from "./auth.ts";
import { requireAuth, requireRole } from "./middleware/auth.ts";
import prisma from "./lib/prisma.ts";
import { UserRole } from "./types/auth.ts";
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

// Admin-only protected route
app.get("/api/admin", requireAuth, requireRole(UserRole.ADMIN), (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  res.json({
    message: "Admin access granted",
    user: authReq.user,
  });
});

// Admin endpoint: Create new user (e.g. Agent or Admin)
app.post("/api/admin/users", requireAuth, requireRole(UserRole.ADMIN), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, role = UserRole.AGENT } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({
        error: "Bad Request",
        message: "Email, password, and name are required fields",
      });
      return;
    }

    const normalizedRole = typeof role === "string" ? role.toUpperCase() : "";
    const assignedRole: UserRole = normalizedRole === UserRole.ADMIN ? UserRole.ADMIN : UserRole.AGENT;

    // Check if user with same email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(409).json({
        error: "Conflict",
        message: `User with email '${email}' already exists`,
      });
      return;
    }

    // Create user and credentials account
    const userId = crypto.randomUUID();
    const hashedPassword = await hashPassword(password);
    const now = new Date();

    const newUser = await prisma.user.create({
      data: {
        id: userId,
        email,
        name,
        role: assignedRole,
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
        accounts: {
          create: {
            id: crypto.randomUUID(),
            providerId: "credential",
            accountId: userId,
            password: hashedPassword,
            createdAt: now,
            updatedAt: now,
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      message: "User created successfully",
      user: newUser,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal Server Error",
      message: error instanceof Error ? error.message : "Failed to create user",
    });
  }
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

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
