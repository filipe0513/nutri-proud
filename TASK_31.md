# 📝 Task: Melhorias na Visualização e Interação dos Stories (Home)

## Contexto

Na página Home (`/`), temos um carrossel horizontal contendo 5 círculos (Stories) que representam os pilares de saúde (Água, Comida, Treino, Sono, Intestino). Atualmente, precisamos refinar a experiência do usuário com duas melhorias:

1. **Ordenação:** Os dados apresentados/listados no contexto dos stories precisam seguir uma ordem cronológica decrescente (do mais recente para o mais antigo).
2. **Edição Rápida (One-Click):** Os círculos dos stories devem ser clicáveis. Ao clicar em um story, o aplicativo deve abrir o `Drawer` (Bottom Sheet) correspondente àquele pilar para edição rápida, sem sair da página.

## Instruções de Implementação para o Agente

Siga rigorosamente as regras de arquitetura e estilização visual (Glassmorphism, Tailwind) definidas no projeto.

### Passo 1: Ajuste da Ordenação (Decrescente)

**Arquivos prováveis:** `src/app/(main)/page.tsx`, componentes de UI dos Stories ou `src/services/logService.ts`

- Identifique a listagem de dados associada à visualização dos Stories (seja a busca dos logs diários do banco de dados ou o array processado que alimenta os componentes visuais).
- Aplique uma ordenação **decrescente** baseada na data de criação (`created_at`) ou no valor da métrica.
- Se a ordenação for feita no back-end (Prisma), certifique-se de usar `orderBy: { created_at: 'desc' }`. Se for no front-end, ajuste a função de `sort()` do array.

### Passo 2: Adicionar Ação de Clique para Abrir o Drawer

**Arquivos prováveis:** Componente do Story (ex: `StoryCircle`, `StoriesCarousel` em `src/components/` ou na própria `Home`).

- Transforme os círculos dos Stories em elementos interativos acessíveis (use tags `<button>` ou adicione validação de teclado/roles se usar `<div>`).
- Vincule o evento `onClick` do círculo ao estado global de UI (Zustand) que controla a abertura do `Drawer` da respectiva categoria.
- Certifique-se de passar os parâmetros corretos (ex: a categoria `WATER`, `FOOD`, etc.) para que o Drawer saiba qual formulário de edição carregar.
- O Drawer deve subir como uma "gaveta" sobrepondo a Home, mantendo a regra de que "a página não muda".

### Passo 3: Manter a Consistência Visual

- Não altere o visual do anel de progresso (verde, amarelo, vermelho baseado no `primary_value`).
- Mantenha os padrões de tipografia e de Glassmorphism exigidos nos tokens do `tailwind.config.ts` se for criar novos tooltips ou elementos visuais.

### Passo 4: Definition of Done (DoD)

Após aplicar as mudanças, execute a validação local (que simula o Vercel):

```bash
npm run validate
```
