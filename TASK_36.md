# 📝 Task: Resolução de Vulnerabilidades Críticas de Segurança (Supabase RLS & Dados Sensíveis)

## Contexto

A Supabase emitiu dois alertas críticos de segurança para o projeto:

1. rls_disabled_in_public: Tabelas publicamente acessíveis devido à falta de Row-Level Security (RLS).
2. sensitive_columns_exposed: Colunas com dados sensíveis (ex: o campo email na tabela de Usuários) expostas via API pública sem restrições de acesso.

Como a arquitetura do "Orgulho da Nutri" determina que o banco de dados seja acessado exclusivamente via Prisma ORM no lado do servidor (Next.js API Routes), a API Data nativa da Supabase (acessada pela anon_key) não deve ter permissão de leitura ou escrita em nenhuma tabela.

## Instruções de Implementação para o Agente

O objetivo é blindar o banco de dados contra acessos anônimos externos sem quebrar a comunicação interna do Prisma.

### Passo 1: Habilitar RLS em Todas as Tabelas (Fix: rls_disabled_in_public)

Onde: Banco de Dados / Prisma Migrations

- Crie uma migration no Prisma ou execute um script SQL no painel da Supabase para ativar o RLS em todas as tabelas do projeto (ex: User, DailyLog, Notification).
- Comando SQL (Exemplo):
  ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "DailyLog" ENABLE ROW LEVEL SECURITY;

- Regra de Ouro: NÃO crie nenhuma política (Policy) de acesso (CREATE POLICY). Ao ativar o RLS sem criar políticas, o banco assume a postura de "Default Deny" (Negar Tudo) para acessos via API pública. O Prisma não será afetado, pois ele conecta-se via string de conexão administrativa, ignorando o RLS.

### Passo 2: Bloquear Exposição de Dados Sensíveis (Fix: sensitive_columns_exposed)

- O Passo 1 tecnicamente já resolve esse problema ao bloquear o acesso às linhas. Porém, para garantir que o alerta desapareça do painel de segurança da Supabase, assegure-se de que a role anon e authenticated da Supabase não tenham permissões de leitura (SELECT) concedidas diretamente nas colunas da tabela User.
- Execute a revogação de privilégios públicos do schema, se aplicável:
  REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
  REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;

### Passo 3: Verificação de Segurança no Código Front-end

Arquivos: .env, e chamadas globais de serviço.

- Faça uma varredura para garantir que o projeto não possui o pacote @supabase/supabase-js instalado e sendo utilizado no lado do cliente (Client Components) usando a NEXT_PUBLIC_SUPABASE_ANON_KEY.
- Toda e qualquer requisição do front-end deve apontar apenas para as rotas /api/\*.

### Passo 4: Definition of Done (DoD)

Antes de dar a tarefa como concluída:

1. Execute a validação local simulando a Vercel:
   npm run validate

2. A validação deve passar sem erros, garantindo que o Prisma continua conseguindo ler e gravar dados.
3. O agente deve instruir o humano a acessar o painel da Supabase (Security -> Security Advisor) e verificar se os alertas rls_disabled_in_public e sensitive_columns_exposed desapareceram.
