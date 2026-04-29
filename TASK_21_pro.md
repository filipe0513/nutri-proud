# ⚙️ Tarefa 21 - Parte B: Funcionalidade de Edição e Integração

## Contexto

Implementar a capacidade de editar registos existentes no histórico, reutilizando a lógica dos modais de criação.

---

## 1. Lógica de Seleção para Edição

- **Onde:** Tela de Histórico.
- **Ação:** Tornar os itens do histórico clicáveis. Ao clicar, deve disparar a abertura do modal correspondente à categoria, mas passando o objeto do Log selecionado.

## 2. Refatoração dos Modais (Criação vs Edição)

- **Ação:** - Os modais devem detetar se receberam um `initialData`.
  - Se sim: Mudar o título para "Editar [Categoria]" e o texto do botão para "Salvar".
  - Preencher os campos do formulário com os valores existentes do log.
  - Garantir que o `datetime-local` receba a data correta formatada (YYYY-MM-DDThh:mm).

## 3. Atualização no Backend (`logService.ts`)

- **Ação:** Implementar a função `updateDailyLog(id, data)` utilizando o Prisma para atualizar o registo existente no banco de dados.

## 4. Re-cálculo de Streaks

- **Ação:** Após uma edição bem-sucedida, garantir que o motor de streaks (Task 19) seja notificado ou re-executado para validar se a mudança afetou a ofensiva do utilizador.

## Ação Requerida (Agente Pro)

1. Implementar o fluxo completo de edição (Frontend -> Backend).
2. **Protocolo DoD:** Rodar `npm run validate` e garantir que a lógica de tipos (TypeScript) está perfeita.
