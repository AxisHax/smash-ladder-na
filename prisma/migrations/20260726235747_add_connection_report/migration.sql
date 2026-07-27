-- CreateTable
CREATE TABLE "ConnectionReport" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reportedUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConnectionReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConnectionReport_reportedUserId_idx" ON "ConnectionReport"("reportedUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectionReport_matchId_reporterId_key" ON "ConnectionReport"("matchId", "reporterId");

-- AddForeignKey
ALTER TABLE "ConnectionReport" ADD CONSTRAINT "ConnectionReport_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "RatingMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectionReport" ADD CONSTRAINT "ConnectionReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectionReport" ADD CONSTRAINT "ConnectionReport_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
