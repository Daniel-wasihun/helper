-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'AGENT');

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "user" ALTER COLUMN "role" TYPE "UserRole" USING (UPPER("role")::"UserRole");
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'AGENT';
