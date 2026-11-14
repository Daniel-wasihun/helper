import type { FullConfig } from "@playwright/test";
import { execSync } from "node:child_process";

export default async function globalSetup(config: FullConfig) {
  console.log("\n[Playwright Global Setup] Starting test environment preparation...");

  const testDbName = process.env.TEST_DB_NAME || "helper_test_db";

  // Safety circuit breaker: refuse to run test setup against development or production databases
  if (testDbName === "helper_db" || testDbName === "production" || testDbName.includes("prod")) {
    throw new Error(`[Safety Alert] Refusing to run test setup against non-test database '${testDbName}'!`);
  }

  const pgUser = process.env.PGUSER || "postgres";
  const pgPassword = process.env.PGPASSWORD || "2002";
  const pgHost = process.env.PGHOST || "localhost";
  const pgPort = process.env.PGPORT || "5434";
  const testDatabaseUrl =
    process.env.TEST_DATABASE_URL ||
    `postgresql://${pgUser}:${pgPassword}@${pgHost}:${pgPort}/${testDbName}?schema=public`;

  const pgEnv = { ...process.env, PGPASSWORD: pgPassword };

  try {
    // 1. Ensure test database exists
    const checkDbCmd = `psql -h "${pgHost}" -p "${pgPort}" -U "${pgUser}" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${testDbName}'"`;
    const exists = execSync(checkDbCmd, { stdio: ["pipe", "pipe", "pipe"], encoding: "utf-8", env: pgEnv }).trim();

    if (exists !== "1") {
      console.log(`[Playwright Global Setup] Creating database '${testDbName}'...`);
      execSync(`psql -h "${pgHost}" -p "${pgPort}" -U "${pgUser}" -d postgres -c "CREATE DATABASE ${testDbName};"`, {
        stdio: "inherit",
        env: pgEnv,
      });
    }

    // 2. Deploy Prisma migrations to helper_test_db
    console.log(`[Playwright Global Setup] Ensuring Prisma migrations are deployed to '${testDbName}'...`);
    execSync(`./server/node_modules/.bin/prisma migrate deploy --config=./server/prisma.config.ts`, {
      stdio: "inherit",
      env: {
        ...process.env,
        DATABASE_URL: testDatabaseUrl,
      },
    });

    // 3. Seed initial test fixtures into helper_test_db
    console.log(`[Playwright Global Setup] Synchronizing seed data in '${testDbName}'...`);
    execSync(`node --experimental-strip-types server/prisma/seed.ts`, {
      stdio: "inherit",
      env: {
        ...process.env,
        DATABASE_URL: testDatabaseUrl,
        ADMIN_EMAIL: "admin@example.com",
        ADMIN_PASSWORD: "password123",
        ADMIN_NAME: "Test Admin",
      },
    });

    console.log("[Playwright Global Setup] ✓ Test environment and database ready.\n");
  } catch (error) {
    console.error("[Playwright Global Setup] ✗ Setup failed:", error);
    throw error;
  }
}
