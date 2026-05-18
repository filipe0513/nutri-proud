# 📝 Task: Implementar Guard de Rota para o Fluxo de Onboarding

## Contexto do Bug

Atualmente, quando um usuário faz login pela primeira vez no "Orgulho da Nutri" (via Google OAuth ou Magic Link usando Auth.js), ele é redirecionado diretamente para a Home (`/`). Como o perfil dele acabou de ser criado, ele ainda não possui as metas básicas estabelecidas (como `weight_kg` ou `main_goal` no JSON `profile` da tabela User).
Isso quebra a lógica de gamificação do aplicativo, pois o app tenta calcular dados de um perfil inexistente ou incompleto.

## Objetivo

Criar um mecanismo de proteção (Guard) Server-Side que intercepte os usuários autenticados. Se o usuário tentar acessar qualquer rota protegida dentro da pasta `(main)` e não tiver o `main_goal` definido no banco de dados, ele deve ser obrigatoriamente redirecionado para `/onboarding`.

## Instruções de Implementação para o Agente

Siga rigorosamente as regras de arquitetura do projeto definidas em `GEMINI.md` e `PROJECT_CONTEXT.md`.

### Passo 1: Criar a verificação na Camada de Serviços

**Arquivo:** `src/services/userService.ts` (crie se não existir)

- Crie uma função assíncrona chamada `checkHasCompletedOnboarding(userId: string)`.
- Use o `prisma.user.findUnique` para buscar apenas o campo `profile` do usuário.
- Verifique se o campo `profile` existe e se a propriedade `main_goal` está preenchida dentro dele.
- Retorne `true` se o onboarding estiver completo, e `false` caso contrário.
- **Regra:** Nenhuma lógica de banco de dados deve vazar para fora desta camada.

### Passo 2: Interceptar o Layout Principal (Server Component)

**Arquivo:** `src/app/(main)/layout.tsx`

- Utilize a função `auth()` do NextAuth para pegar a sessão do usuário atual.
- Se não houver sessão ou `user.id`, redirecione para `/welcome`.
- Importe e execute `checkHasCompletedOnboarding(session.user.id)`.
- Se a função retornar `false`, use a função `redirect('/onboarding')` do pacote `next/navigation`.

### Passo 3: Criar Testes Unitários (Obrigatório)

**Arquivo:** `src/services/userService.test.ts`

- Utilize o **Vitest** e aplique o padrão **AAA (Arrange, Act, Assert)**.
- Faça o mock do `prisma.user.findUnique` usando `vi.mock` (Nunca acesse o banco real nos testes).
- Crie testes para os seguintes cenários:
  1. Retorna `false` se o usuário não for encontrado.
  2. Retorna `false` se `profile` for nulo.
  3. Retorna `false` se `profile` existir mas não tiver `main_goal`.
  4. Retorna `true` se `profile` tiver o `main_goal` preenchido.

### Passo 4: Definition of Done (DoD)

Após escrever os códigos acima, você **DEVE** rodar obrigatoriamente o script de validação do projeto:

```bash
npm run validate
```
