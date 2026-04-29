# 🗺️ Mapa de Rotas (Next.js App Router)

## Rotas Públicas (Sem Autenticação)
- `/welcome`: Tela inicial de entrada. Login via Google, Resend (Magic Link) ou "Entrar como Visitante".

## Rotas Privadas (Requer Sessão/NextAuth)
- `/onboarding`: Fluxo de configuração inicial (Metas, Peso, Altura).
- `/`: Home. Dashboard principal, carrossel de Stories e atalhos para Bottom Sheets.
- `/history`: Feed de registros com Infinite Scroll e filtro via query params (GET).
- `/settings`: Formulário único de perfil e ajuste fino de metas.
- `/pillar/[category]`: Rota dinâmica de insights educativos. Categorias válidas: `water`, `food`, `sleep`, `workout`, `poop`.

## Rotas Restritas (Requer `role: 'ADMIN'`)
- `/admin`: Dashboard gerencial (Gráficos Recharts e métricas de conversão).

## Principais API Routes (RESTful)
- `POST /api/logs`: Salva um novo DailyLog (validação Zod isomórfica).
- `GET /api/logs`: Retorna histórico paginado (aceita `page`, `limit`, `categories`).
- `POST /api/auth/anonymous`: Gera sessão de visitante e transfere logs no momento do upgrade.