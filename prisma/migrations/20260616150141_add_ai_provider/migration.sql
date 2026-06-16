-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN "aiModel" TEXT DEFAULT 'gpt-4o-mini';
ALTER TABLE "UserSettings" ADD COLUMN "aiProvider" TEXT DEFAULT 'openai';
