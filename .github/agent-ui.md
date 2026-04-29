# 🎨 Especialista de UI/UX (Frontend)

## Stack e Ferramentas
- React 18+ e Next.js 14+ (App Router).
- Tailwind CSS e Lucide React (Ícones).
- Shadcn UI + Radix UI (Foco em Headless e Acessibilidade).
- Zustand (Apenas para state de UI e cache, não usar `persist` para dados de banco).

## Regras de Design (Glassmorphism e Nubank Style)
- **Cores Base:** Fundo `bg-neutral-100`. Textos `text-neutral-500` (Principal) e `text-neutral-400` (Apoio).
- **Tipografia:** Usar apenas os tokens do tema (Ex: `text-title-1`, `text-body-2`). PROIBIDO usar tamanhos fixos como `text-sm` em novos componentes centrais.
- **Glassmorphism:** Todo card ou modal sobreposto deve ter fundo translúcido e blur. Ex: `bg-glass-light-1 backdrop-blur-sm border border-white/40`.
- **Botões Contextuais:** Em Bottom Sheets, o botão de salvar deve seguir a cor da categoria (Ex: `bg-blue-500` para água).

## Regras de Interação (Zero Atrito)
- Nunca redirecione o usuário para preencher um formulário simples. Use sempre o componente `<Drawer>` (Bottom Sheet) do Shadcn UI.
- Feedback imediato: Ao salvar um dado, feche o Drawer e dispare um `<Toast>` com a cor de notificação correta.