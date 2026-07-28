-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastTimeoutAt" TIMESTAMP(3),
ADD COLUMN     "queueCooldownUntil" TIMESTAMP(3),
ADD COLUMN     "recentTimeoutCount" INTEGER NOT NULL DEFAULT 0;
