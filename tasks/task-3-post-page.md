# Task 3: Página Individual de Post

## O que fazer
Criar a rota `/teams/[id]/posts/[postId]` com a visualização completa de um post, incluindo comentários e reações. Pré-requisito para a Task 1 (comentários) ter uma rota dedicada além do drawer.

## Arquivos a criar
- `src/app/(main)/teams/[id]/posts/[postId]/page.tsx`
- `src/app/(main)/teams/[id]/posts/[postId]/PostClient.tsx`
- `src/app/api/posts/[id]/route.ts` — GET de um post específico (verificar se existe)

## Comportamento esperado
1. Ao clicar num post no feed do time, navegar para `/teams/[id]/posts/[postId]`
2. Exibir o post completo (autor, conteúdo, imagem se houver, timestamp)
3. Exibir reações + comentários abaixo
4. Input de comentário na base da tela
5. Botão "voltar" no topo (← Voltar para o Time)

## Notas de design
- Layout similar à página do time mas com foco no post único
- Header com `bg-glass-light-2 backdrop-blur-md`
- Comentários listados com separadores suaves

## Alternativa
Se a Task 1 usar drawer (sem rota dedicada), esta task pode ser adiada. Avaliar após Task 1.

## Validação
```bash
npx prisma generate
npm run validate
```
