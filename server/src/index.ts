import "dotenv/config";
import crypto from "node:crypto";
import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import { z } from "zod";
import { toNodeHandler } from "better-auth/node";
import { hashPassword } from "better-auth/crypto";
import { auth } from "./auth.ts";
import { requireAuth, requireRole } from "./middleware/auth.ts";
import prisma from "./lib/prisma.ts";
import { UserRole } from "./types/auth.ts";
import type { AuthenticatedRequest } from "./types/auth.ts";

const app = express();
const PORT = process.env.PORT || 3001;

// Trust reverse proxy (enables secure cookies and correct client IP behind proxies)
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// CORS
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000", credentials: true }));

// Protected "me" endpoint alias (mounted before wildcard to prevent Better Auth route shadowing)
app.get("/api/auth/me", requireAuth, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  res.json({
    user: authReq.user,
    session: authReq.session,
  });
});

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

// Admin-only protected route
app.get("/api/admin", requireAuth, requireRole(UserRole.ADMIN), (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  res.json({
    message: "Admin access granted",
    user: authReq.user,
  });
});

// Validation schema for creating users via admin endpoint
const createUserSchema = z.object({
  email: z.string().trim().email("Invalid email address format").max(255, "Email must not exceed 255 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must not exceed 128 characters"),
  name: z.string().trim().min(1, "Name is required").max(100, "Name must not exceed 100 characters"),
  role: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return UserRole.AGENT;
      const upper = val.toUpperCase();
      return upper === UserRole.ADMIN ? UserRole.ADMIN : UserRole.AGENT;
    }),
});

// Admin endpoint: Create new user (e.g. Agent or Admin)
app.post("/api/admin/users", requireAuth, requireRole(UserRole.ADMIN), async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = createUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: "Bad Request",
        message: parseResult.error.issues.map((i) => i.message).join(", "),
        details: parseResult.error.issues,
      });
      return;
    }

    const { email, password, name, role: assignedRole } = parseResult.data;

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
    console.error("Failed to create admin user:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "An unexpected error occurred while creating user",
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
