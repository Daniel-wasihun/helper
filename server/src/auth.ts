import "dotenv/config";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { UserRole } from "@prisma/client";
import prisma from "./lib/prisma.ts";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: UserRole.AGENT,
        input: false,
      },
    },
  },
  trustedOrigins: [process.env.CLIENT_URL || "http://localhost:3000"],
});
