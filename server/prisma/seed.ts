import "dotenv/config";
import crypto from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import prisma from "../src/lib/prisma.ts";
import { UserRole } from "../src/types/auth.ts";

async function seedUser(email: string, password: string, name: string, role: UserRole) {
  const hashedPassword = await hashPassword(password);

  const existingUser = await prisma.user.findUnique({
    where: { email },
    include: { accounts: true },
  });

  if (existingUser) {
    console.log(`User ${email} already exists. Updating role to ${role} and refreshing password...`);

    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        role,
        name,
        emailVerified: true,
      },
    });

    const credentialAccount = existingUser.accounts.find(
      (acc) => acc.providerId === "credential"
    );

    if (credentialAccount) {
      await prisma.account.update({
        where: { id: credentialAccount.id },
        data: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      });
    } else {
      await prisma.account.create({
        data: {
          id: crypto.randomUUID(),
          userId: existingUser.id,
          providerId: "credential",
          accountId: existingUser.id,
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    console.log(`✓ User ${email} updated successfully with role ${role}.`);
    return;
  }

  const userId = crypto.randomUUID();
  const now = new Date();

  await prisma.user.create({
    data: {
      id: userId,
      email,
      name,
      role,
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
  });

  console.log(`✓ User ${email} created successfully with role ${role}!`);
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "password123";
  const adminName = process.env.ADMIN_NAME || "System Admin";

  const agentEmail = process.env.AGENT_EMAIL || "agent@example.com";
  const agentPassword = process.env.AGENT_PASSWORD || "password123";
  const agentName = process.env.AGENT_NAME || "Support Agent";

  console.log("=== SEEDING DATABASE ===");
  await seedUser(adminEmail, adminPassword, adminName, UserRole.ADMIN);
  await seedUser(agentEmail, agentPassword, agentName, UserRole.AGENT);
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
