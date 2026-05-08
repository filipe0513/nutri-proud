# 🔄 Tarefa 25: Atualização do Protocolo de Workflow (Git Automático)

## Contexto

O aplicativo agora está em produção na Vercel. Para garantir a estabilidade da branch "main", todo o desenvolvimento a partir de agora acontecerá na branch "dev". Precisamos atualizar as suas instruções base (@agent-workflow.md) para que você faça os commits de forma autônoma ao finalizar cada tarefa com sucesso.

---

## 1. Atualização do Arquivo @agent-workflow.md

- Ação: Abra o arquivo "@agent-workflow.md" e reescreva a seção "Protocolo de Validação" para incluir uma nova regra de "Versionamento Automático (Git)".
- Regra: O novo Protocolo de "Definition of Done (DoD)" deve ditar estritamente a seguinte ordem:
  1. Executar "npm run validate".
  2. Ler o terminal e resolver de forma autônoma qualquer erro (TypeScript, Lint, etc) até ficar Verde.
  3. [NOVO] Se a validação passar sem erros, executar o versionamento no Git antes de dar a tarefa como concluída.

---

## 2. Padrão de Commits (Conventional Commits)

- Ação: Adicione a seguinte instrução explícita no "@agent-workflow.md":
  "Quando a validação for um sucesso, você DEVE executar os comandos de versionamento no terminal do projeto:
  1. git add .
  2. git commit -m '<tipo>(<escopo>): <descrição da tarefa e das mudanças realizadas>'"
- Ensine a você mesmo os tipos válidos de commit:
  - feat: Nova funcionalidade ou página.
  - fix: Correção de bug.
  - refactor: Refatoração ou melhoria de lógica/UI sem mudar o comportamento.
  - chore: Atualização de pacotes ou configurações de workflow.

---

## Ação Requerida (Agente)

1. Modifique o arquivo "@agent-workflow.md" incluindo detalhadamente as regras acima.
2. Certifique-se de não apagar a regra anterior que te obriga a rodar o "npm run validate".
3. Teste o seu novo protocolo: adicione as mudanças do "@agent-workflow.md", rode a validação e faça o seu primeiro commit automático no terminal desta própria tarefa (ex: "chore(workflow): atualiza protocolo DoD com versionamento automatico").
