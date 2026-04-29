# 📅 Tarefa 20: Registros Retroativos (Datas Customizadas)

## Contexto

Atualmente, os registros (`DailyLog`) são criados assumindo o momento atual (`now()`). Precisamos permitir que o usuário registre hábitos de dias anteriores para manter suas métricas e _streaks_ atualizados, mesmo que ele tenha esquecido de abrir o app no dia.

---

## 1. Alteração no Esquema (`prisma/schema.prisma`)

- Verifique a tabela `DailyLog`. Se estivermos usando apenas o `createdAt` padrão, adicione um campo `date` ou `occurredAt` do tipo `DateTime`.
- **Importante:** Se o campo for novo, você deve rodar `npx prisma migrate dev --name add_date_to_dailylog`.

---

## 2. Componente de UI (Date Picker)

- Nos componentes de inserção (ex: Bottom Sheets de Água, Comida, Treino, etc.), adicione um seletor de data discreto, preferencialmente no topo ou ao lado do título.
- O padrão do input deve ser sempre "Hoje" (`new Date()`).
- Impessa (via UI e validação Zod) o registro de datas futuras (não faz sentido o usuário registrar o treino de "amanhã").

---

## 3. Camada de Serviço (`src/services/logService.ts`)

- Atualize as funções de criação de log para aceitarem uma `date` opcional.
- Se a `date` for enviada pelo frontend, o log deve ser salvo com o horário de referência desse dia (ex: 12:00 do dia escolhido) para evitar bugs de fuso horário que façam o dia "voltar" ou "avançar" no banco.

---

## 4. Integração com o Motor de Streaks

- Garanta que, ao adicionar um registro retroativo, o `streakService` (criado na Task 19) seja capaz de re-calcular a ofensiva do usuário perfeitamente, já que os dias agora podem ser preenchidos fora de ordem.

## Ação Requerida (Agente)

1. Modificar o Prisma Schema e gerar a migração no terminal.
2. Adicionar o seletor de data nos componentes de input do usuário.
3. Atualizar a lógica de backend para respeitar a data escolhida.
4. **Protocolo DoD:** Rodar `npm run validate` e garantir 0 erros de Lint e TypeScript antes de finalizar.
