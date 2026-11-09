import "dotenv/config";
import crypto from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import prisma from "../src/lib/prisma.ts";

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "password123";
  const adminName = process.env.ADMIN_NAME || "System Admin";

  console.log("=== SEEDING DATABASE ===");
  console.log(`Admin email: ${adminEmail}`);

  const hashedPassword = await hashPassword(adminPassword);

  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
    include: { accounts: true },
  });

  if (existingUser) {
    console.log(`User ${adminEmail} already exists. Updating role to 'admin' and refreshing password...`);

    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        role: "admin",
        name: adminName,
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

    console.log(`✓ Admin user ${adminEmail} updated successfully.`);
    return;
  }

  const userId = crypto.randomUUID();
  const now = new Date();

  await prisma.user.create({
    data: {
      id: userId,
      email: adminEmail,
      name: adminName,
      role: "admin",
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

  console.log(`✓ Admin user ${adminEmail} created successfully with role 'admin'!`);
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
