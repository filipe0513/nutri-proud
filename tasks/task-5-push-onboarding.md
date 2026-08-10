# Task 5: Onboarding para Push Notifications

## O que fazer
Criar um fluxo para solicitar permissão de notificações push ao usuário via OneSignal, que já está instalado mas sem fluxo de ativação explícito.

## Arquivos afetados / a criar
- `src/components/shared/PushPermissionPrompt.tsx` — criar (modal/banner de solicitação)
- `src/app/(main)/settings/page.tsx` — adicionar seção de configuração de notificações
- `src/app/api/users/me/push-token/route.ts` — já existe (verificar)
- `src/store/store.ts` — possivelmente adicionar estado `pushPermissionAsked`

## Comportamento esperado
1. Após o primeiro login real (não anônimo), exibir banner ou modal suave pedindo permissão para notificações
2. Se aceito: chamar `OneSignal.registerForPushNotifications()` e salvar o token via `/api/users/me/push-token`
3. Se recusado: não perguntar novamente por 7 dias (salvar em localStorage)
4. Em `/settings`: toggle para ativar/desativar notificações push
5. Respeitar `notification_preferences` do modelo `User`

## O que já existe
- `react-onesignal` instalado
- `oneSignalId` e `pushEnabled` no model `User`
- Endpoint `POST /api/users/me/push-token`
- `notification_preferences` no model `User`

## Notas
- Não usar `persist` no Zustand para dados de push — usar localStorage diretamente para o flag "perguntou"
- O prompt deve ser suave (banner no rodapé, não um modal bloqueante)

## Validação
```bash
npx prisma generate
npm run validate
```
