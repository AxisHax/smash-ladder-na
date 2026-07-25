-- AlterTable
ALTER TABLE "RatingLobbyEntry" ADD COLUMN     "character" TEXT;

-- AlterTable
ALTER TABLE "RatingMatch" ADD COLUMN     "player1Character" TEXT,
ADD COLUMN     "player2Character" TEXT;
