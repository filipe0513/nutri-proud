# Task 1: Comentários em Posts de Times

## O que fazer
Implementar a feature de comentários em posts de times, substituindo o toast "Comentários em breve!" por um fluxo funcional.

## Arquivos afetados
- `src/app/(main)/teams/[id]/page.tsx:53` — remover toast, abrir drawer de comentários
- `src/app/(main)/profile/[id]/ProfileClient.tsx:48` — idem
- `src/app/api/posts/[id]/comments/route.ts` — criar (GET + POST)
- `src/services/commentService.ts` — criar (lógica de buscar/criar comentários)
- `src/components/shared/CommentsDrawer.tsx` — criar (drawer com thread + input)

## O que já existe
- Model `Comment` no Prisma (userId, postId, content, createdAt)
- Model `Post` com relação `comments`

## Pré-requisito
Nenhum. Pode ser feito diretamente.

## Comportamento esperado
1. Usuário clica no ícone de comentário em um post do time
2. Abre um Drawer (bottom sheet) com a lista de comentários do post
3. Input no rodapé do drawer para escrever e enviar um novo comentário
4. Submit fecha o input e adiciona o comentário otimisticamente
5. Comentários exibem avatar + nome + texto + tempo relativo

## Design
- Drawer com `bg-glass-light-3 backdrop-blur-lg`
- Input com `text-input-1`
- Botão de envio com `bg-brand-500`

## Validação
```bash
npx prisma generate
npm run validate
```
