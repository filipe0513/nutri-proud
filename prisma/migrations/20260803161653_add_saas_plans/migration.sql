-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'START', 'PRO');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "plan" "Plan" NOT NULL DEFAULT 'FREE';
