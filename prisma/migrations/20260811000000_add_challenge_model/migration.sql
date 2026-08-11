-- AlterEnum
ALTER TYPE "FeedPostType" ADD VALUE 'CHALLENGE_SUMMARY';

-- AlterTable
ALTER TABLE "TeamFeedPost" ADD COLUMN     "challenge_id" TEXT,
ADD COLUMN     "summary_date" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "goal_description" TEXT NOT NULL,
    "cover_image_url" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "share_workouts" BOOLEAN NOT NULL DEFAULT false,
    "share_meals" BOOLEAN NOT NULL DEFAULT false,
    "share_water" BOOLEAN NOT NULL DEFAULT false,
    "weekly_evolution" BOOLEAN NOT NULL DEFAULT false,
    "daily_summary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Challenge_team_id_key" ON "Challenge"("team_id");

-- CreateIndex
CREATE UNIQUE INDEX "TeamFeedPost_challenge_id_patient_id_summary_date_key" ON "TeamFeedPost"("challenge_id", "patient_id", "summary_date");

-- AddForeignKey
ALTER TABLE "Challenge" ADD CONSTRAINT "Challenge_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Enable RLS (required for Supabase security)
ALTER TABLE "Challenge" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "Challenge" FROM anon;
REVOKE ALL ON TABLE "Challenge" FROM authenticated;
