# 📝 Task: Adicionar Botão de Compartilhamento (Relatório para a Nutri)

## Contexto

O aplicativo precisa de uma nova funcionalidade na barra de navegação inferior (Bottom Navigation). O objetivo é criar um botão de "Compartilhar" que permita ao usuário gerar um mini-relatório em texto do seu desempenho e enviar para a sua nutricionista.
O relatório deve cobrir diferentes períodos (Hoje, Semana, Mês, Período Personalizado) e trazer uma média das pontuações, destaques (dias muito bons ou ruins) e as observações anotadas nos logs diários.

## Instruções de Implementação para o Agente

Siga rigorosamente as regras de arquitetura (API + Services), validação (Zod) e UI (Shadcn + Glassmorphism) do projeto.

### Passo 1: Atualização da Bottom Navigation (UI)

**Arquivos prováveis:** Componente de navegação principal (ex: `BottomNav.tsx` em `src/components/shared/` ou `src/app/(main)/layout.tsx`).

- Adicione um novo botão (ícone de Compartilhar do **Lucide React**) na barra inferior.
- Mantenha a consistência visual da barra usando as regras estritas de Glassmorphism: `bg-glass-light-2 backdrop-blur-md`.
- Ao clicar no botão, ele deve alterar o estado global (Zustand) para abrir o novo Drawer de compartilhamento.

### Passo 2: Criação do Drawer "Mandar para Nutri"

**Arquivos prováveis:** Novo componente (ex: `ShareReportDrawer.tsx` em `src/components/shared/`).

- Crie um componente `Drawer` (Bottom Sheet do Shadcn UI) com o fundo `bg-glass-light-3 backdrop-blur-lg`.
- **Título:** "Mandar para Nutri".
- **Botões de Período:** Crie botões de seleção rápida para "Hoje", "Semana", "Mês" e "Período".
- **Seletor de Datas:** Se o usuário selecionar "Período", exiba um componente de _Date Picker_ (calendário de data inicial e final, sem necessidade de hora).
- **Botão de Ação:** Um botão "Gerar Relatório" que fará a requisição para a API.

### Passo 3: Lógica de Geração do Relatório (Backend / Services)

**Arquivos prováveis:** Novo serviço `src/services/reportService.ts` e nova rota `GET /api/reports`.

- Crie a regra de negócio isolada em `src/services/reportService.ts`. A função deve receber o `userId`, `startDate` e `endDate`.
- Faça a busca no banco (Prisma) da tabela `DailyLog` filtrando pelo período desejado.
- **Cálculo do Relatório:**
  1. **Média:** Calcule a média geral de score dos pilares no período.
  2. **Insights:** Identifique dias com pontuação muito alta (ex: > 85) e muito baixa (ex: < 40).
  3. **Observações:** Extraia o campo de observação dos logs (se houver) e atrele à data de criação (`created_at`) formatada (ex: "Dia 12/05: Senti muita fome à tarde").
- A rota da API (`src/app/api/reports/route.ts`) deve apenas chamar esse serviço e devolver o texto já formatado.

### Passo 4: Formatação do Texto e UX

- O texto retornado pela API deve ser amigável, usar emojis (ex: 💧, 🍎, 💤, 💪, 💩) e ser bem estruturado com quebras de linha para facilitar a leitura no WhatsApp.
- Quando o frontend receber a resposta da API, exiba o texto no Drawer e forneça um botão "Copiar Texto" (usando a Clipboard API) e um botão "Compartilhar" (usando a Web Share API nativa do celular, ideal para PWAs).

### Passo 5: Definition of Done (DoD)

Antes de finalizar a tarefa e realizar o commit, o agente deve obrigatoriamente executar:

```bash
npm run validate
```
