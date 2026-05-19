# 📝 Task: Criar Testes Unitários para o Sistema de Notificações

## Contexto

A estrutura principal do sistema de notificações (Cron Jobs e Gatilhos) foi criada no arquivo `notificationService.ts`. Agora, precisamos garantir a qualidade dessa lógica escrevendo testes unitários. O objetivo é simular os gatilhos (como o lembrete de água) e garantir que o sistema crie as notificações corretamente, sem nunca tocar no banco de dados de produção.

## Instruções de Implementação para o Agente

Siga o padrão AAA (Arrange, Act, Assert) e utilize o framework Vitest com o mock do Prisma Client.

### Passo 1: Configuração Inicial e Mocks

**Arquivo:** `src/services/notificationService.test.ts` (crie se não existir)

- Importe os métodos necessários do Vitest (`describe`, `it`, `expect`, `vi`, `beforeEach`).
- Importe o serviço a ser testado (`notificationService.ts`).
- Faça o mock completo do Prisma Client utilizando `vi.mock` (garantindo que nenhuma requisição real seja feita).
- Utilize o bloco `beforeEach` para limpar o estado dos mocks antes de cada teste (`vi.clearAllMocks()`).

### Passo 2: Testes de Leitura e Escrita Básica (Listar e Marcar como Lida)

- **Cenário 1:** Teste a listagem de notificações. Simule (`Arrange`) o `prisma.notification.findMany` retornando um array de notificações fictícias. Chame a função do serviço (`Act`) e verifique (`Assert`) se ela retorna os dados corretamente.
- **Cenário 3:** Teste a marcação de leitura. Simule o `prisma.notification.update`. Verifique se a função do serviço envia o parâmetro `is_read: true` para o Prisma.

### Passo 3: Testes de Gatilhos e Regras de Negócio (Cron)

- **Cenário 3 (Lembrete de Água - Disparo Correto):** Simule que a busca no banco (`prisma.dailyLog.findMany`) retorna que o usuário _não_ bateu a meta de água hoje. Aja chamando a função de gatilho do cron. Afirme (`Assert`) que `prisma.notification.create` foi chamado com os dados corretos (`category: 'REMINDER'` e `action_type: 'OPEN_WATER_DRAWER'`).
- **Cenário 4 (Lembrete de Água - Silêncio Correto):** Simule que o banco retorna que o usuário _já_ bateu a meta de água. Chame a função de gatilho. Afirme que o `prisma.notification.create` **NÃO** foi chamado (usando `toHaveBeenCalledTimes(0)`).

### Passo 4: Definition of Done (DoD)

Antes de finalizar a tarefa, o agente deve executar o ambiente de testes local:

```bash
npm run validate
```

- A tarefa só estará concluída quando o terminal exibir que 100% dos testes passaram com sucesso (Verde) e não restarem erros de TypeScript ou Lint.
- É expressamente proibido utilizar o banco de dados real na execução dos testes.
