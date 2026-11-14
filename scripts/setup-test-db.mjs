import { execSync } from "node:child_process";

const TEST_DB_NAME = process.env.TEST_DB_NAME || "helper_test_db";

// Safety circuit breaker: refuse to run test setup against development or production databases
if (TEST_DB_NAME === "helper_db" || TEST_DB_NAME === "production" || TEST_DB_NAME.includes("prod")) {
  throw new Error(`[Safety Alert] Refusing to run test setup against non-test database '${TEST_DB_NAME}'!`);
}

const PG_USER = process.env.PGUSER || "postgres";
const PG_PASSWORD = process.env.PGPASSWORD || "2002";
const PG_HOST = process.env.PGHOST || "localhost";
const PG_PORT = process.env.PGPORT || "5434";

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  `postgresql://${PG_USER}:${PG_PASSWORD}@${PG_HOST}:${PG_PORT}/${TEST_DB_NAME}?schema=public`;

const pgEnv = { ...process.env, PGPASSWORD: PG_PASSWORD };

console.log(`[Test DB Setup] Ensuring test database '${TEST_DB_NAME}' exists...`);

try {
  // Check if test database exists, create if not
  const checkDbCmd = `psql -h "${PG_HOST}" -p "${PG_PORT}" -U "${PG_USER}" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${TEST_DB_NAME}'"`;
  const result = execSync(checkDbCmd, { stdio: ["pipe", "pipe", "pipe"], encoding: "utf-8", env: pgEnv }).trim();

  if (result !== "1") {
    console.log(`[Test DB Setup] Database '${TEST_DB_NAME}' does not exist. Creating...`);
    const createDbCmd = `psql -h "${PG_HOST}" -p "${PG_PORT}" -U "${PG_USER}" -d postgres -c "CREATE DATABASE ${TEST_DB_NAME};"`;
    execSync(createDbCmd, { stdio: "inherit", env: pgEnv });
    console.log(`[Test DB Setup] ✓ Database '${TEST_DB_NAME}' created.`);
  } else {
    console.log(`[Test DB Setup] ✓ Database '${TEST_DB_NAME}' already exists.`);
  }

  // Deploy migrations to the isolated test database
  console.log(`[Test DB Setup] Applying Prisma migrations to '${TEST_DB_NAME}'...`);
  execSync(`./server/node_modules/.bin/prisma migrate deploy --config=./server/prisma.config.ts`, {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: TEST_DATABASE_URL,
    },
  });

  // Seed the test database with initial admin/agent accounts
  console.log(`[Test DB Setup] Seeding test database...`);
  execSync(`node --experimental-strip-types server/prisma/seed.ts`, {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: TEST_DATABASE_URL,
      ADMIN_EMAIL: "admin@example.com",
      ADMIN_PASSWORD: "password123",
      ADMIN_NAME: "Test Admin",
    },
  });

  console.log(`[Test DB Setup] ✓ Test database '${TEST_DB_NAME}' successfully prepared and ready!`);
} catch (error) {
  console.error(`[Test DB Setup] Failed to setup test database:`, error);
  process.exit(1);
}
