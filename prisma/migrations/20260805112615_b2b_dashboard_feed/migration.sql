-- CreateEnum
CREATE TYPE "FeedPostType" AS ENUM ('MILESTONE', 'ALERT', 'EVOLUTION', 'SYSTEM');

-- CreateTable
CREATE TABLE "TeamFeedPost" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "type" "FeedPostType" NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamFeedPost_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TeamFeedPost" ADD CONSTRAINT "TeamFeedPost_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamFeedPost" ADD CONSTRAINT "TeamFeedPost_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable RLS (required for Supabase — never skip this)
ALTER TABLE "TeamFeedPost" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "TeamFeedPost" FROM anon;
REVOKE ALL ON TABLE "TeamFeedPost" FROM authenticated;
