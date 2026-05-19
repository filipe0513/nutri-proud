# #43 Task: Limpeza da Home (Remover Ações Rápidas) e Ajuste de Contraste

## Contexto

Com a implementação do novo botão central flutuante (FAB) na Bottom Navigation, os atalhos de criação de logs ficaram centralizados e acessíveis a apenas um clique de distância. Por isso, a lista vertical de "Ações Rápidas" na página inicial (`/`) tornou-se redundante e está poluindo a interface. Além disso, o botão principal dentro do Drawer de Compartilhamento ("Mandar para Nutri") está com um problema de legibilidade (texto preto sobre fundo roxo).

## Instruções de Implementação para o Agente

Siga rigorosamente as regras de estilização (Tailwind) e componentes (Shadcn UI) descritas em `GEMINI.md`.

### Passo 1: Limpeza das Ações Rápidas na Home

Arquivos prováveis: `src/app/(main)/page.tsx` ou componentes de listagem na Home.

- Localize a seção do corpo da página (Home) que renderiza a lista vertical de Cards de Ações Rápidas (ex: "💧 Beba Água", "🍎 Adicionar Refeição").
- Remova todos esses atalhos de registro da interface.
- Mantenha ÚNICA e EXCLUSIVAMENTE o card/botão de "Adicionar Nota" (que provavelmente serve para registros de texto livre ou observações gerais do dia).
- Certifique-se de que o layout não quebre e que o espaço deixado pelos cards removidos fique harmonioso com o fundo `bg-neutral-100` ou `bg-bg-light`.

### Passo 2: Ajuste de Acessibilidade (Cor do Texto do Botão)

Arquivos prováveis: Componente do Drawer de compartilhamento (ex: `ShareReportDrawer.tsx` criado na task #40).

- Localize o botão de ação principal (ex: "Gerar Relatório" ou "Compartilhar") que atualmente possui fundo roxo.
- Adicione a classe utilitária do Tailwind `text-white` (ou a variável correspondente do tema, se aplicável) para forçar o texto a ficar branco, garantindo contraste suficiente para a leitura.

### Passo 3: Definition of Done (DoD)

Antes de finalizar a tarefa e realizar o commit, o agente deve obrigatoriamente executar a validação de qualidade:
npm run validate

- A tarefa só está concluída se o comando rodar com 100% de sucesso.
- Garanta que a remoção dos atalhos na Home não deixou funções órfãs ou importações sem uso, o que causaria falhas no ESLint (`no-unused-vars`).
