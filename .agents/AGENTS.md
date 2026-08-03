# Regras do Projeto — Orgulho da Nutri

## 🔒 Segurança Obrigatória: RLS em Toda Nova Tabela Prisma

> [!CAUTION]
> **REGRA DE SEGURANÇA — Sem Exceções**
>
> Toda vez que um novo `model` for adicionado ao `prisma/schema.prisma`, o **arquivo SQL da mesma migration** que criou a tabela **DEVE** conter o bloco abaixo ao final. Sem isso, a tabela fica exposta publicamente no Supabase (`rls_disabled_in_public`), o que constitui uma vulnerabilidade crítica de dados.

### Template obrigatório (adicionar ao final de toda `migration.sql` que cria nova tabela):

```sql
-- Enable RLS (required for Supabase — never skip this)
ALTER TABLE "NomeDaNovaTabela" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "NomeDaNovaTabela" FROM anon;
REVOKE ALL ON TABLE "NomeDaNovaTabela" FROM authenticated;
```

**Por que?** O Supabase emite alertas críticos e os dados ficam acessíveis por qualquer pessoa com a URL do projeto se o RLS não estiver habilitado.

**Histórico:** Em julho/2026, as tabelas `Notification`, `AiInsight` e `SystemEvent` foram criadas sem RLS e precisaram de uma migration corretiva (`20260716165500_enable_rls_new_tables`).

---

## 🚨 COMANDO PROIBIDO: `prisma migrate reset`

> [!CAUTION]
> **PROIBIÇÃO ABSOLUTA — Sem Exceções, Sem Discussão**
>
> O comando `prisma migrate reset` está **terminantemente proibido** neste projeto em qualquer situação, em qualquer branch, em qualquer ambiente.
>
> **NUNCA execute:**
> ```bash
> prisma migrate reset        # ❌ PROIBIDO
> npx prisma migrate reset    # ❌ PROIBIDO
> ```
>
> **Por que é tão perigoso?** O `prisma.config.ts` deste projeto lê `DIRECT_URL` do `.env`, que aponta para o **Supabase de produção**. Esse comando apaga `DROP SCHEMA public CASCADE` no banco apontado — ou seja, **destroi todos os dados de produção irreversivelmente**.
>
> **Incidente real:** Em 03/08/2026 às ~09:42 (BRT), o comando foi executado na conversa `c963adec` durante uma operação de consolidação de migrations. O resultado foi a perda total de todos os usuários, logs e dados do banco de produção (Supabase Free tier, sem backup automático).
>
> **Alternativas seguras:**
> - Para criar uma nova migration: `npx prisma migrate dev --name <nome>` (lê `.env.local` → banco local)
> - Para aplicar migrations em prod: `npx prisma migrate deploy` (só aplica pendentes, nunca destrói)
> - Para resetar SOMENTE o banco local: `psql postgresql://postgres:pg123456@localhost:5432/nutriproud -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"` seguido de `npx prisma migrate deploy`

