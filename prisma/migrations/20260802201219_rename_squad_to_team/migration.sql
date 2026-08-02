-- Renomear Enum
ALTER TYPE "SquadRole" RENAME TO "TeamRole";

-- Remover chaves estrangeiras antigas
ALTER TABLE "Post" DROP CONSTRAINT "Post_squad_id_fkey";
ALTER TABLE "SquadMember" DROP CONSTRAINT "SquadMember_squad_id_fkey";
ALTER TABLE "SquadMember" DROP CONSTRAINT "SquadMember_user_id_fkey";

-- Renomear tabelas e colunas (MANTENDO OS DADOS INTACTOS)
ALTER TABLE "Squad" RENAME TO "Team";
ALTER TABLE "SquadMember" RENAME TO "TeamMember";
ALTER TABLE "TeamMember" RENAME COLUMN "squad_id" TO "team_id";
ALTER TABLE "Post" RENAME COLUMN "squad_id" TO "team_id";

-- Renomear Índices e Chaves Primárias
ALTER INDEX "Squad_pkey" RENAME TO "Team_pkey";
ALTER INDEX "Squad_invite_code_key" RENAME TO "Team_invite_code_key";
ALTER INDEX "SquadMember_pkey" RENAME TO "TeamMember_pkey";
ALTER INDEX "SquadMember_squad_id_user_id_key" RENAME TO "TeamMember_team_id_user_id_key";

-- Recriar as chaves estrangeiras com os novos nomes
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Post" ADD CONSTRAINT "Post_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Garantir RLS nas novas tabelas renomeadas
ALTER TABLE "Team" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "Team" FROM anon;
REVOKE ALL ON TABLE "Team" FROM authenticated;

ALTER TABLE "TeamMember" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "TeamMember" FROM anon;
REVOKE ALL ON TABLE "TeamMember" FROM authenticated;
