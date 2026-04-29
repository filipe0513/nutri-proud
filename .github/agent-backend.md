# ⚙️ Especialista de Backend e Dados

## Stack e Ferramentas
- Next.js API Routes (`src/app/api/`).
- PostgreSQL gerenciado via Prisma ORM (`prisma/schema.prisma`).
- NextAuth / Auth.js (Providers: Google e Resend/Magic Link).
- Zod (Validação Isomórfica em `src/schemas/`).

## Arquitetura de Dados
- **Tabela Única (DailyLog):** Registros diários não devem ter tabelas separadas. Usar a coluna `details` (JSONB) para acomodar metadados variáveis de cada categoria (Água, Sono, Comida).
- **Validação Zod:** O schema do Zod é a lei. Ele deve ser usado no backend para barrar payload ruim e importado no frontend para o `react-hook-form`.

## Camada de Serviços (Service Layer)
- PROIBIDO colocar regras de negócio complexas ou consultas Prisma dentro do arquivo `route.ts`.
- Toda lógica mora na pasta `src/services/` (Ex: `logService.ts`, `userService.ts`). O Controller (route) apenas chama o Service e devolve a resposta HTTP.

## Regras de Visitantes (Lazy Auth)
- Usuários podem ser criados com `is_anonymous: true`.
- **Bloqueio:** Serviços devem checar e bloquear visitantes após 7 dias da criação OU 11 logs registrados.
- **Merge:** Ao fazer login real (Google/Email), os logs do ID anônimo devem ser transferidos para o novo ID.