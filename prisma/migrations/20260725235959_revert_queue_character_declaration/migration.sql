-- AlterTable
ALTER TABLE "RatingLobbyEntry" DROP COLUMN "character";

-- AlterTable
ALTER TABLE "RatingMatch" DROP COLUMN "player1Character",
DROP COLUMN "player2Character";
