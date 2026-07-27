-- AlterEnum
ALTER TYPE "ConfirmationMethod" ADD VALUE 'MUTUALLY_RESOLVED';

-- AlterTable
ALTER TABLE "MatchGame" ADD COLUMN     "disputeResolutionAt" TIMESTAMP(3),
ADD COLUMN     "disputeResolutionById" TEXT,
ADD COLUMN     "disputeResolutionWinnerId" TEXT;
