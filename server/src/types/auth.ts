import type { Request } from "express";
import type { auth } from "../auth.ts";

export type AuthUser = typeof auth.$Infer.Session.user;
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
