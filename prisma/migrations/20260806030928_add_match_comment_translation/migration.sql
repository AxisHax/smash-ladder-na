-- CreateTable
CREATE TABLE "MatchCommentTranslation" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "lang" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchCommentTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MatchCommentTranslation_commentId_lang_key" ON "MatchCommentTranslation"("commentId", "lang");

-- AddForeignKey
ALTER TABLE "MatchCommentTranslation" ADD CONSTRAINT "MatchCommentTranslation_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "MatchComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
