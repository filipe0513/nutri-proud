# #52 Task: Implementar Reação Gamificada (IA) nas Jacadas

## Contexto
Para tornar as "Jacadas" menos punitivas e mais interativas, o sistema utilizará o Gemini (IA) para gerar uma reação bem-humorada e personalizada logo após o usuário salvar um registro de jacada, baseada nos níveis de açúcar, gordura e álcool informados.

## Instruções de Execução para o Agente (Branch: stage)

### Passo 1: Rota de IA para Jacada
Arquivo provável: `src/app/api/ai/jacada-reaction/route.ts`
- Crie uma rota POST que receba os valores de `sugar`, `fat` e `alcohol` (0 a 5).
- Use o SDK do Gemini (`gemini-1.5-flash`).
- **Prompt:** "O usuário registrou um deslize na dieta com nível {sugar}/5 de açúcar, {fat}/5 de gordura e {alcohol}/5 de álcool. Escreva uma única frase (máx 15 palavras) reagindo a isso com humor leve, sem ser punitivo, usando um emoji. Ex: 5 de álcool? Amanhã a garrafa d'água será sua melhor amiga! 🍺"

### Passo 2: Disparo via Frontend (Toast)
Arquivo provável: `src/components/shared/JacadaDrawer.tsx`
- Após o envio bem-sucedido dos dados da Jacada para o banco (no submit do form), não feche o app silenciosamente.
- Faça uma requisição para a nova rota `/api/ai/jacada-reaction`.
- Pegue a string retornada e exiba usando a biblioteca de Toasts do Shadcn UI (ex: `toast({ title: "Nutri diz:", description: aiResponse })`).