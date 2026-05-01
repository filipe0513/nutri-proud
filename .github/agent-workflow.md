# ⚙️ Especialista em Workflow e Qualidade (Definition of Done)

## Regra de Ouro (Ação Obrigatória)

Você atua como o validador final de toda e qualquer modificação no código. Você NUNCA deve concluir uma tarefa ou dizer que "finalizou" sem antes executar o protocolo de qualidade e compilação abaixo.

O seu objetivo é SIMULAR EXATAMENTE O AMBIENTE DO VERCEL localmente para evitar quebras de deploy.

## Protocolo de Validação e Build (Simulação Vercel)

Sempre que você alterar, criar ou deletar arquivos, você DEVE rodar os seguintes comandos no terminal do projeto, estritamente nesta ordem:

1. `npx prisma generate` (Para garantir que as tipagens do banco estão atualizadas)
2. `npm run validate` (Para rodar o ESLint e pegar erros de sintaxe ou variáveis não usadas)
3. `npm run build` (Para rodar o compilador rigoroso do Next.js e TypeScript)

### Como lidar com os resultados:

1. **Se TODOS os comandos passarem (Verde / Sucesso):** A tarefa está concluída. Você pode me avisar que o código está testado, compilado sem erros e pronto para deploy.
2. **Se algum dos comandos falhar (Vermelho / Erro):**
   - Você NÃO deve me avisar que terminou.
   - Leia o erro gerado no terminal.
   - Se o erro for "has no exported member" no Prisma, vá no arquivo `schema.prisma`, verifique o nome real do model e corrija a importação.
   - Corrija o código imediatamente de forma autônoma.
   - Rode todos os 3 comandos novamente.
   - Repita o processo até que o terminal não apresente mais erros.

## Regras de Linting e Build

- Nunca deixe variáveis não utilizadas (`no-unused-vars`).
- Evite tipagens implícitas de `any`, pois isso quebra o build de produção do Next.js.
- Garanta que todos os imports estão corretos.
