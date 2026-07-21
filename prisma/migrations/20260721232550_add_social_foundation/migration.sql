-- CreateEnum
CREATE TYPE "SquadRole" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('USER_GENERATED', 'SYSTEM_MILESTONE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "one_signal_id" TEXT;

-- CreateTable
CREATE TABLE "Squad" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "invite_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Squad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SquadMember" (
    "id" TEXT NOT NULL,
    "squad_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "SquadRole" NOT NULL DEFAULT 'MEMBER',
    "mute_notifications" BOOLEAN NOT NULL DEFAULT false,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SquadMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "content" TEXT,
    "image_url" TEXT,
    "type" "PostType" NOT NULL DEFAULT 'USER_GENERATED',
    "squad_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reaction" (
    "id" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Squad_invite_code_key" ON "Squad"("invite_code");

-- CreateIndex
CREATE UNIQUE INDEX "SquadMember_squad_id_user_id_key" ON "SquadMember"("squad_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_post_id_user_id_emoji_key" ON "Reaction"("post_id", "user_id", "emoji");

-- AddForeignKey
ALTER TABLE "SquadMember" ADD CONSTRAINT "SquadMember_squad_id_fkey" FOREIGN KEY ("squad_id") REFERENCES "Squad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SquadMember" ADD CONSTRAINT "SquadMember_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_squad_id_fkey" FOREIGN KEY ("squad_id") REFERENCES "Squad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable RLS (required for Supabase — never skip this)
ALTER TABLE "Squad" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "Squad" FROM anon;
REVOKE ALL ON TABLE "Squad" FROM authenticated;

ALTER TABLE "SquadMember" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "SquadMember" FROM anon;
REVOKE ALL ON TABLE "SquadMember" FROM authenticated;

ALTER TABLE "Post" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "Post" FROM anon;
REVOKE ALL ON TABLE "Post" FROM authenticated;

ALTER TABLE "Reaction" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "Reaction" FROM anon;
REVOKE ALL ON TABLE "Reaction" FROM authenticated;

ALTER TABLE "Comment" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "Comment" FROM anon;
REVOKE ALL ON TABLE "Comment" FROM authenticated;
