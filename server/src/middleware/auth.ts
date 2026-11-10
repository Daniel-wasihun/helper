import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth.ts";
import { UserRole } from "../types/auth.ts";
import "../types/auth.ts";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required to access this resource",
      });
      return;
    }

    req.user = session.user;
    req.session = session.session;
    next();
  } catch (error) {
    res.status(500).json({
      error: "Internal Server Error",
      message: error instanceof Error ? error.message : "Failed to verify authentication session",
    });
  }
}

export function requireRole(allowedRoles: UserRole | UserRole[]) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required to access this resource",
      });
      return;
    }

    const rawRole = req.user.role;
    const normalizedRole = typeof rawRole === "string" ? rawRole.toUpperCase() : UserRole.AGENT;
    const userRole = (normalizedRole as UserRole) || UserRole.AGENT;

    if (!roles.includes(userRole)) {
      res.status(403).json({
        error: "Forbidden",
        message: `Access denied. Requires one of the following roles: ${roles.join(", ")}`,
      });
      return;
    }

    next();
  };
}
