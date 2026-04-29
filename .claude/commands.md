# ⚡ Comandos Frequentes

## Validação (SEMPRE rodar antes de reportar tarefa concluída)
```bash
npm run validate        # lint + tsc + vitest
```

## Desenvolvimento
```bash
npm run dev             # servidor local
npm run build           # bundle de produção (apenas quando solicitado)
```

## Prisma
```bash
npx prisma generate          # regenerar client após mudanças no schema
npx prisma migrate dev       # criar/aplicar migration em dev
npx prisma studio            # GUI do banco
npx prisma db push           # sincronizar schema sem migration (prototipagem)
```

## Shadcn UI
```bash
npx shadcn-ui@latest add <component>   # adicionar componente (button, card, drawer…)
```

## Testes
```bash
npx vitest run              # rodar todos os testes uma vez
npx vitest                  # modo watch
npx vitest run --reporter=verbose   # verbose output
```
