-- AlterEnum
ALTER TYPE "ConfirmationMethod" ADD VALUE 'CORRECTED';

-- AlterTable
ALTER TABLE "RatingMatch" ADD COLUMN     "correctionDisputed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "correctionReportedAt" TIMESTAMP(3),
ADD COLUMN     "correctionReportedById" TEXT,
ADD COLUMN     "correctionSecondReportedAt" TIMESTAMP(3),
ADD COLUMN     "correctionSecondReportedById" TEXT,
ADD COLUMN     "correctionSecondWinnerId" TEXT,
ADD COLUMN     "correctionWinnerId" TEXT;
