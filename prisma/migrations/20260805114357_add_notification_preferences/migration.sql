-- AlterTable
ALTER TABLE "User" ADD COLUMN     "notification_preferences" JSONB NOT NULL DEFAULT '{}';
