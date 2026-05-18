# 📝 Task: Refatoração da Meta de Refeições (Checkboxes e Cálculo Proporcional)

## Contexto

Atualmente, a meta de alimentação do usuário é baseada em uma quantidade numérica simples (ex: 4 refeições). O objetivo agora é permitir que o usuário personalize _quais_ refeições ele faz no dia.
Em vez de um input de número, o usuário verá uma lista de 10 opções de refeições em formato de Checkbox (ex: Café da Manhã, Lanche da Manhã, Almoço, Lanche da Tarde 1, Lanche da Tarde 2, Jantar, Ceia, Pré-treino, Pós-treino, Lanche Extra).
Essa escolha deve ditar as opções disponíveis no Drawer de Adição de Comida e basear o cálculo de gamificação (score) proporcionalmente à quantidade de refeições escolhidas.

## Instruções de Implementação para o Agente

Siga as regras rigorosas de arquitetura, validação isomórfica (Zod) e UI (Shadcn) do projeto.

### Passo 1: Atualização do Banco de Dados e Schemas (Backend 🤝 Frontend)

**Arquivos prováveis:** `prisma/schema.prisma`, `src/schemas/userSchema.ts` (ou similar)

- Modifique o modelo de metas do usuário no `schema.prisma`. Substitua o campo numérico de quantidade de refeições por um array de strings ou JSON que armazene os IDs/Nomes das refeições selecionadas (ex: `planned_meals: String[]`).
- Execute `npx prisma generate` (e crie a migration, se necessário).
- Atualize o schema do **Zod** correspondente para validar esse novo array de strings. Lembre-se que a validação Zod é isomórfica e obrigatória para barrar dados ruins na API e no Front.

### Passo 2: Ajuste na UI de Configurações e Onboarding

**Arquivos prováveis:** `src/app/(setup)/onboarding/page.tsx`, `src/app/(main)/settings/page.tsx`

- Remova o input numérico de refeições.
- Implemente um grupo de 10 **Checkboxes** usando a biblioteca de componentes Shadcn UI / Radix UI.
- Crie um array constante com as 10 opções de refeições para mapear na interface.
- O usuário pode marcar quantas quiser (pelo menos 1). Salve esse array no perfil do usuário via API RESTful.

### Passo 3: Ajuste no Drawer de Adição de Refeição (Home)

**Arquivos prováveis:** Componente do Drawer de Comida (ex: `FoodDrawer.tsx` em `src/components/shared/`)

- Ao abrir o Drawer (Bottom Sheet) para registrar uma refeição, o campo de seleção (Select/Dropdown) da refeição não deve mais ser estático.
- Ele deve ser populado dinamicamente usando APENAS as refeições que o usuário marcou como meta no seu `user_profile` (recuperado via cache do Zustand ou requisição).

### Passo 4: Atualização da Lógica de Gamificação (Score Proporcional)

**Arquivos prováveis:** `src/services/logService.ts` ou serviço responsável pelos cálculos de pontuação.

- A pontuação (`primary_value` / score) do pilar de Alimentação deve ser calculada de forma proporcional.
- **Cálculo:** Se o usuário selecionou 5 refeições na meta, cada refeição registrada equivale a 20% do progresso diário (100 / quantidade de refeições selecionadas).
- Certifique-se de que a soma das notas do dia não ultrapasse 100 e alimente corretamente as cores do anel de progresso SVG (Verde `>=75`, Amarelo `<75`, Vermelho `<50`).

### Passo 5: Definition of Done (DoD)

Antes de finalizar, o agente deve obrigatoriamente executar a validação de qualidade:

```bash
npm run validate
```
