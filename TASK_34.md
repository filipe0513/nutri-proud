# 📝 Task: Implementar Botão de Ação Central (FAB) e Reordenar Bottom Navigation

## Contexto

A barra de navegação inferior (Bottom Navigation) precisa ser reestruturada para acomodar o botão principal de inserção de dados (um Floating Action Button - FAB com o símbolo de "+") e o novo botão de Compartilhar. O botão "+" deve ser o grande destaque visual da barra, com um gradiente chamativo, e servirá como o atalho central para abrir o Drawer com as opções de qual pilar o usuário deseja registrar.

## Instruções de Implementação para o Agente

Siga as regras de estilização (Tailwind) e componentes (Shadcn UI) descritas em `GEMINI.md`.

### Passo 1: Reordenação da Bottom Navigation

**Arquivos prováveis:** `src/components/shared/BottomNav.tsx` (ou similar).

- Reordene os ícones da barra estritamente para a seguinte sequência:
  1. Home (Início)
  2. History (Diário/Histórico)
  3. **+ (FAB Central)**
  4. Compartilhar (Nutri)
  5. Config (Ajustes/Settings)
- Para acomodar o botão "+" que será maior, diminua o padding vertical (`py-X`) do container principal da Bottom Nav. Lembre-se de manter o estilo do container com `bg-glass-light-2 backdrop-blur-md`.

### Passo 2: Criação e Estilização do Botão "+" (FAB)

- O botão "+" deve ser fisicamente maior que os outros botões da barra.
- **Estilo Chamativo:** Aplique um fundo em gradiente (ex: `bg-gradient-to-tr` usando as cores primárias do tema/brand definidas no `tailwind.config.ts`). Evite usar cores soltas arbitrárias.
- Adicione uma leve sombra (`shadow-lg` ou sombra colorida baseada no gradiente) para que ele pareça flutuar (Floating Action Button).
- O ícone (símbolo de Plus do Lucide React) deve ter uma cor contrastante, preferencialmente branco/claro.

### Passo 3: Criação do Drawer de Seleção de Logs (Layout Ergonômico)

**Arquivos prováveis:** Novo componente (ex: `AddLogOptionsDrawer.tsx` em `src/components/shared/`).

- Ao clicar no botão "+", deve-se alterar o estado do Zustand para abrir um novo `Drawer` (Bottom Sheet).
- **Layout:** Este Drawer deve conter uma grade de **2 colunas** (`grid grid-cols-2 gap-4`) contendo os 5 botões de atalho: Água 💧, Alimentação 🍎, Sono 💤, Treino 💪 e Intestino 💩.
- _Atenção à UX:_ O layout deve ser compacto para que os botões fiquem próximos à base da tela (ergonomicamente acessíveis para o polegar do usuário). O 5º item pode ocupar a largura total (`col-span-2`) se o design exigir alinhamento, ou apenas ficar centralizado.
- Ao clicar em qualquer uma dessas opções, o app deve fechar este Drawer atual e abrir imediatamente o Drawer correspondente àquele pilar específico (os mesmos que já são acionados pelos círculos da Home).

### Passo 4: Definition of Done (DoD)

Antes de realizar o commit, o agente deve obrigatoriamente executar:

```bash
npm run validate
```
