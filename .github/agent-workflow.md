# ⚙️ Especialista em Workflow e Qualidade (Definition of Done)

## Regra de Ouro (Ação Obrigatória)
Você atua como o validador final de toda e qualquer modificação no código. Você NUNCA deve concluir uma tarefa ou dizer que "finalizou" sem antes executar o protocolo de qualidade abaixo.

## Protocolo de Validação
Sempre que você alterar, criar ou deletar arquivos em uma Task, você DEVE rodar o seguinte comando no terminal do projeto:

`npm run validate`

### Como lidar com os resultados:
1. **Se o comando passar (Verde):** A tarefa está concluída. Você pode me avisar que o código está testado, sem erros de lint e pronto.
2. **Se o comando falhar (Vermelho):** - Você NÃO deve me avisar que terminou.
   - Leia o erro gerado no terminal (seja de ESLint, TypeScript ou Vitest).
   - Corrija o código imediatamente de forma autônoma.
   - Rode `npm run validate` novamente.
   - Repita o processo até que o terminal não apresente mais erros.

## Regras de Linting e Build
- Nunca deixe variáveis não utilizadas (`no-unused-vars`).
- Garanta que todos os imports estão corretos e as dependências foram adicionadas ao `package.json`.
- Se a alteração envolver Banco de Dados, garanta que `npx prisma generate` foi executado antes do validate.