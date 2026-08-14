-- CreateEnum
CREATE TYPE "DirectoryVisibility" AS ENUM ('HIDDEN', 'APP_ONLY', 'PUBLIC');

-- CreateTable
CREATE TABLE "NutritionistProfile" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "display_name" TEXT,
    "crn" TEXT,
    "bio" TEXT,
    "city" TEXT,
    "uf" TEXT,
    "whatsapp" TEXT,
    "public_email" TEXT,
    "scheduling_url" TEXT,
    "plans_info" TEXT,
    "visibility" "DirectoryVisibility" NOT NULL DEFAULT 'HIDDEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionistProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NutritionistProfile_user_id_key" ON "NutritionistProfile"("user_id");

-- AddForeignKey
ALTER TABLE "NutritionistProfile" ADD CONSTRAINT "NutritionistProfile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable RLS (diretório público — policies diferem do template padrão do projeto)
ALTER TABLE "NutritionistProfile" ENABLE ROW LEVEL SECURITY;

-- Zera acesso e reconcede só SELECT controlado (cinto contra chave anon do Supabase)
REVOKE ALL ON TABLE "NutritionistProfile" FROM anon;
REVOKE ALL ON TABLE "NutritionistProfile" FROM authenticated;

-- Anônimo lê apenas perfis 100% públicos
GRANT SELECT ON TABLE "NutritionistProfile" TO anon;
CREATE POLICY "np_anon_read_public" ON "NutritionistProfile"
  FOR SELECT TO anon
  USING (visibility = 'PUBLIC');

-- Logado lê públicos + app-only
GRANT SELECT ON TABLE "NutritionistProfile" TO authenticated;
CREATE POLICY "np_auth_read_listed" ON "NutritionistProfile"
  FOR SELECT TO authenticated
  USING (visibility IN ('PUBLIC', 'APP_ONLY'));
