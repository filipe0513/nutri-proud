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
