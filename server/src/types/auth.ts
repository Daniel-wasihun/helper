import type { Request } from "express";
import { UserRole } from "@prisma/client";
import type { auth } from "../auth.ts";

export { UserRole };

export type AuthUser = typeof auth.$Infer.Session.user & {
  role?: UserRole | string | null;
};
export type AuthSession = typeof auth.$Infer.Session.session;

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      session?: AuthSession;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
  session: AuthSession;
}
