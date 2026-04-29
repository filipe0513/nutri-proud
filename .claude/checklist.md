# ✅ Definition of Done — Checklist Rápido

Copie este checklist mentalmente antes de reportar qualquer tarefa como concluída.

## Obrigatório (toda tarefa)
- [ ] `npm run validate` passou sem erros (lint + TS + vitest)
- [ ] Nenhuma variável não utilizada (`no-unused-vars`)
- [ ] Todos os imports resolvem; dependências em `package.json`

## Se tocou no Banco de Dados
- [ ] `npx prisma generate` executado após mudança no `schema.prisma`
- [ ] Migration criada se necessário (`npx prisma migrate dev`)

## Se criou/modificou um Serviço
- [ ] Lógica de negócio está em `src/services/`, NÃO em `route.ts`
- [ ] Teste unitário (AAA) escrito ou atualizado em `src/services/__tests__/`

## Se criou/modificou uma API Route
- [ ] Validação Zod no início do handler
- [ ] Schema importado do `src/schemas/` (mesmo schema do frontend)
- [ ] Apenas chamadas ao Service — sem Prisma direto no route

## Se criou/modificou um Componente UI
- [ ] Apenas tokens do design system (`text-title-*`, `text-body-*`, etc.)
- [ ] Sem tamanhos de fonte ou opacidades arbitrárias do Tailwind
- [ ] Glassmorphism aplicado se o componente for sobreposto (card/drawer/toast)
- [ ] Formulários usam `<Drawer>`, nunca redirect de página

## Se tocou em Regras de Acesso
- [ ] Usuários anônimos: limite de 7 dias OU 11 logs verificado no service
- [ ] Rotas `/admin` e APIs admin verificam `role: 'ADMIN'`
