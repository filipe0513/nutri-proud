---
name: deploy
description: Executa a rotina automatizada de deploy para produção (validação, bump, notas e merge).
---

# Deploy Automatizado do Orgulho da Nutri

Ao ser acionado para realizar um deploy, execute estritamente os passos abaixo, em ordem. Você só precisa executar os comandos e avisar o usuário quando terminar.

## 1. Verificações Iniciais
1. Use `git branch --show-current` para verificar se você está na branch `dev`. Se não estiver, mude para `dev` com `git checkout dev`.
2. Verifique se o diretório de trabalho está limpo com `git status`. Se houver alterações não commitadas, aborte o deploy e peça ao usuário para commitar primeiro (ou commite para ele se ele pedir).

## 2. Validação
Execute a validação completa do projeto:
```bash
npm run validate
```
Se a validação falhar, você DEVE parar, corrigir os erros (TypeScript, Lint, Vitest) e rodar novamente até passar 100%. NUNCA siga em frente com a validação falhando.

## 3. Descobrir Próxima Versão
Leia a versão atual do `package.json`.
Pergunte ao usuário: "A versão atual é X.Y.Z. Deseja realizar um bump de minor (X.Y+1.0) ou patch (X.Y.Z+1)?" e espere a resposta.

## 4. Gerar Release Notes
1. Descubra quais commits existem na `dev` que não estão na `main` ainda: `git log --oneline main..dev`
2. Sintetize as novidades em 2 a 5 bullet points amigáveis, em português, com emojis, voltados para o usuário final.
3. Edite o arquivo `src/data/release-notes.json`, inserindo a nova versão **no topo** do array (índice 0), contendo a versão informada, a data de hoje e a lista de highlights gerada.

## 5. Atualizar Versão e Commitar na Dev
1. Use `npm version <nova-versao> --no-git-tag-version` para dar o bump no package.json
2. Faça o commit de release na dev:
```bash
git add package.json package-lock.json src/data/release-notes.json
git commit -m "chore(release): v<nova-versao>"
```

## 6. Merge para Main e Notificação
1. Mude para a main: `git checkout main`
2. Dê merge na dev: `git merge dev`
3. Notifique o usuário (no chat) que o deploy local está concluído e as notas foram geradas. Peça para ele fazer o push final com:
`git push origin main`

> NOTA: Nunca dê git push por conta própria. Deixe isso como responsabilidade do usuário.
