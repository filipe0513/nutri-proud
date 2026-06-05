# 📱 Projeto: Diário de Saúde Gamificado (MVP)

## 🎯 Visão Geral do Produto
Aplicativo web (PWA) focado no registro rápido e diário de 5 pilares da saúde: Água, Alimentação, Sono, Treino e Intestino. 
**Diferencial (UX/UI):** Usabilidade extrema com zero atrito (One-Click Actions). Interface minimalista e gamificada inspirada no padrão visual do **Nubank** (uso intenso de Cards, Bottom Sheets, fundos em tom cinza claro e componentes modais para manter o usuário na mesma página).

---
## 🛠️ Tech Stack Oficial
- **Core:** React 18+ e Next.js 14+ (App Router Full-Stack)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS
- **Biblioteca de Componentes:** Shadcn UI + Radix UI (Foco em acessibilidade e design Headless)
- **Ícones:** Lucide React
- **Autenticação:** NextAuth / Auth.js (Magic Link via Resend + OAuth Google)
- **Estado Global (Client-side):** Zustand (Atua apenas como gerenciador de UI e cache temporário em memória, sincronizado com a API)
- **Banco de Dados:** PostgreSQL hospedado na nuvem (Neon/Supabase) gerenciado via **Prisma ORM**.
- **Validação Isomórfica:** Zod (Schemas compartilhados entre Front e Back)

---

## 📂 Arquitetura e Estrutura de Pastas (Sugestão)
O agente deve seguir o padrão `src/` com App Router:

~~~text
src/
├── app/
│   ├── (setup)/
│   │   ├── welcome/page.tsx      # Tela inicial de conversão
│   │   └── onboarding/page.tsx   # Fluxo de metas e perfil
│   ├── (main)/
│   │   ├── history/page.tsx      # Diário e registros passados
│   │   ├── settings/page.tsx     # Perfil e ajuste de metas
│   │   ├── pillar/[category]/    # Insights educativos (water|food|sleep|workout|poop)
│   │   └── page.tsx              # Home (Dashboard de Stories e Ações)
│   ├── admin/                    # Rotas exclusivas para ADMIN
│   ├── api/                      # Rotas RESTful (Thin controllers)
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                       # Componentes gerados pelo Shadcn UI
│   └── shared/                   # Componentes criados por nós
├── schemas/                      # Schemas Zod de validação (Front e Back)
├── services/                     # Camada de lógica de negócio (logService, userService...)
├── store/
│   └── useAppStore.ts            # Zustand (Sessão e UI cache, sem persistência no localstorage)
├── lib/
│   └── utils.ts                  # Funções utilitárias e lib Prisma
└── types/
    └── index.ts                  # Interfaces e Tipos do TypeScript
~~~

---


## 🗄️ Modelagem de Dados (Frontend 🤝 Backend)

O sistema abandonou o LocalStorage como fonte de verdade. Agora, o Frontend faz requisições (Fetches) para as rotas da API (`/api/*`), que por sua vez comunicam-se com o PostgreSQL via Prisma. 

O Zustand deve ser usado **apenas para guardar a sessão atual e fazer otimizações de UI** (Optimistic Updates), sem o middleware `persist` para dados sensíveis.

### 1. `User` / Perfil (Backend e Zustand Store)
No banco, as configurações e metas moram na tabela de Usuário.
~~~typescript
interface UserSession {
  id: string; // UUID
  email: string | null;
  is_anonymous: boolean;
  profile: {
    weight_kg: number;
    height_cm: number;
    gender: 'male' | 'female' | 'other';
    main_goal: 'fat_loss' | 'muscle_gain' | 'health';
  };
  targets: {
    water_ml_per_day: number;
    sleep_hours_per_night: number;
  };
}
~~~

### 2. `activity_log` (Registros Diários)
Cada ação gera um objeto neste array. O campo `primary_value` (0 a 100) é crucial para a gamificação.
~~~typescript
interface DailyLog {
  id: string; // UUID
  user_id: string;
  category: 'WATER' | 'FOOD' | 'SLEEP' | 'WORKOUT' | 'POOP';
  score: number; // Nota de 0 a 100 para o "Story" gamificado
  details: any; // JSON dinâmico (validado com Zod via src/schemas/logSchema.ts)
  created_at: string; // ISO String (quando o fato ocorreu)
}
~~~

---

## 📱 Arquitetura de UI / Telas

### 1. `/welcome`
Tela limpa. Logo centralizado, slogan e botão largo "Começar minha jornada" fixo na base.

### 2. `/onboarding`
Fluxo passo a passo (Cards selecionáveis).
- **Passo 1:** Objetivo (Emagrecer / Ganhar Massa / Saúde).
- **Passo 2:** Peso e Altura (Inputs limpos).
- **Ação:** O app calcula as metas (ex: água) e salva no `user_profile`.

### 3. `/` (Home)
O coração do app. Fundo `bg-slate-50`.
- **Cabeçalho:** "Olá, [Nome]". Abaixo, um carrossel horizontal de 5 círculos (Stories: Água, Comida, Treino, Sono, Intestino).
  *Regra Visual:* A borda do círculo recebe cor baseada na soma dos `primary_value` do dia (`<50` vermelho, `<75` amarelo, `>=75` verde).
- **Corpo:** Lista vertical de Cards de Ações Rápidas (Ex: "💧 Beba Água - Meta: 2.5L").
- **Rodapé:** Menu flutuante de navegação (Home, Diário, Ajustes).

### 4. Novas Rotas (Settings, Pillars e Admin)
- **`/history`**: Feed de registros diários com infinite scroll.
- **`/settings`**: Perfil único para ajustes finos de metas.
- **`/pillar/[category]`**: Insights educativos baseados na categoria de saúde.
- **`/admin`**: Dashboard gerencial de métricas (Gráficos Recharts).

### 5. Componentes Globais (Shadcn UI)
- **`Drawer` (Bottom Sheet):** Obrigatório para todos os formulários. Ao clicar em "Adicionar Refeição" na Home, sobe uma gaveta. A página não muda.
- **`Toast`:** Para feedback ("Salvo com sucesso").

---

## 🚀 Status e Contexto Atual do Projeto (Último Update: Maio 2026)

O projeto já passou da fase de setup e está em pleno desenvolvimento. As seguintes áreas já estão construídas e funcionais:

1. **Branding e PWA:**
   - O app agora chama-se **"Orgulho da Nutri"**.
   - É um PWA instalável (`manifest.ts` configurado, metadata de mobile-web-app aplicada).
   - A identidade visual trocou logos em texto por SVGs horizontais (`logo-white-h.webp`).

2. **Dashboard (Home) & UI:**
   - Tela principal redesenhada no estilo Apple/Nubank: Lista vertical de ações rápidas, anéis de progresso SVG dinâmicos, e "Score Card" com gradient mesh animado.
   - Menu reordenado com FAB (Floating Action Button).
   - Drawers e Modais padronizados para editar logs sem sair da página.
   - Cores e contrastes ajustados para melhorar a acessibilidade e legibilidade contra os fundos mesh.

3. **Fluxos de Usuário e Autenticação:**
   - Fluxo consolidado: Visitantes iniciam como anônimos (limitados por tempo e registros).
   - Funcionalidade completa de **Conversão de Conta** via Google e Magic Link (Auth.js), fundindo o ID temporário num perfil permanente (corrigido para não quebrar com `user_profile` nulo).
   - Configurações na interface (`/settings`) com botão de Logout funcional e ajuste de parâmetros detalhados (como "refeições por dia").

4. **Tratamento de Dados (Backend):**
   - Lógica de cálculo de notas dos pilares normalizada.
   - Fusos horários (Timezones) corrigidos no histórico de logs.
   - Exclusão e edição de atividades funcionais.

**Regras de Código Atualizadas:**
- Use `snake_case` apenas para comunicação legada, mas prefira tipagens estritas em `camelCase` e schemas em Zod atualizados.
- Mantenha componentes modulares.
- Lembre-se: NÃO estamos mais usando o LocalStorage como "fonte da verdade", mas sim o PostgreSQL (via Prisma) junto da API Next.js. O Zustand guarda apenas UI State e cópia da sessão temporária!

## Arquitetura de Dados e Backend (Full-Stack Next.js)
Mudamos de um modelo LocalStorage para um Backend real embutido no Next.js.
- **Banco de Dados:** PostgreSQL, gerenciado exclusivamente via **Prisma ORM** (`prisma/schema.prisma`).
- **Padrão de Logs:** Utilizamos uma tabela única `DailyLog` com um campo `details` do tipo **JSONB** para acomodar diferentes categorias (WATER, FOOD, SLEEP, POOP) de forma escalável, sem criar múltiplas tabelas.
- **Validação Isomórfica (Obrigatório):** TODA validação de dados deve ser feita usando **Zod**.
  - Os schemas devem ser salvos isoladamente na pasta `src/schemas/`.
  - O mesmo schema deve ser importado nas API Routes (para barrar dados ruins) e nos formulários do Frontend (para UX).
- **API Routes:** O backend fica na pasta `src/app/api/`. Respeite a semântica RESTful (ex: `POST /api/sessions` para login, `POST /api/logs` para salvar registros).

> [!CAUTION]
> **REGRAS DE PRISMA (Obrigatório — Sem Exceções):**
> Toda vez que você (agente) alterar o arquivo `prisma/schema.prisma` adicionando, removendo ou modificando modelos, você é **OBRIGADO** a rodar imediatamente o comando abaixo no terminal **antes de qualquer commit**:
> ```bash
> npx prisma migrate dev --name <nome_descritivo_da_mudanca>
> ```
> **Nunca faça commit de uma alteração no schema sem antes gerar a migration correspondente.** A ausência da migration causará quebra em produção na Vercel.

## 🎨 Design System, Tipografia e Glassmorphism (Regras Estritas)

Para manter a consistência visual inspirada na Apple/Nubank, é PROIBIDO usar tamanhos de fonte ou opacidades arbitrárias do Tailwind em novos componentes. Use exclusivamente os tokens do `tailwind.config.ts`.

**1. Tipografia Padrão:**
- Títulos: `text-title-1`, `text-title-2`, `text-title-3`
- Corpo: `text-body-1`, `text-body-2`
- Apoio: `text-caption-1`, `text-caption-2`
- Interação: `text-button-1`, `text-input-1`

**2. Paleta Base e Status:**
- Fundo da Página (Body): `bg-neutral-100` ou `bg-bg-light`.
- Textos: `text-neutral-500` (Principal), `text-neutral-400` (Apoio).
- Círculos de Progresso/Gamificação: `text-notify-success`, `text-notify-warning`, `text-notify-error`.

**3. Regras de Glassmorphism (Componentes Sobrepostos):**
O efeito Glass exige a cor do tema somada a uma classe de blur (`backdrop-blur-sm`, `md` ou `lg`) e, opcionalmente, uma borda semitransparente.
- **Cards Normais:** `bg-glass-light-1 backdrop-blur-sm border border-white/40`
- **Bottom Navigation (Menu):** `bg-glass-light-2 backdrop-blur-md`
- **Drawers / Modais:** `bg-glass-light-3 backdrop-blur-lg`
- **Toasts:** Devem usar as cores `*-glass` de notificação. Ex: `bg-notify-info-glass backdrop-blur-md border border-notify-info`.

## Camada de Serviços (Service Layer)
- **Regra:** Nenhuma lógica de negócio ou consulta direta ao Prisma deve morar nas API Routes (`src/app/api/`).
- **Estrutura:** Toda lógica deve ser isolada na pasta `src/services/`. 
  - Ex: `userService.ts` cuida de limites e permissões. `logService.ts` cuida de salvar e validar registros.
- **Vantagem:** Facilita testes unitários e mantém as rotas focadas apenas em Request/Response.

## Regras de Negócio: Usuários Anônimos
- **Limite de Tempo:** O acesso é bloqueado após 7 dias do primeiro registro.
- **Limite de Uso:** O acesso é bloqueado após o 11º log registrado.
- **Conversão:** Ao converter para conta real (Google/Resend), esses limites são removidos.

## Controle de Acesso (RBAC)
- **Roles:** Usuários possuem o campo `role` no banco (default: 'USER').
- **Admin:** Apenas usuários com `role: 'ADMIN'` podem acessar rotas `/admin` e APIs administrativas.

## 🧪 Protocolo de Testes (QA)
- **Framework:** Vitest + `vitest-mock-extended`.
- **Escopo:** Testar de forma unitária a **camada de serviços** (`src/services/`). Não testar as rotas de API diretamente se não for estritamente necessário.
- **Nunca use o banco real:** Faça mock do Prisma Client.
- **Padrão AAA (Arrange, Act, Assert):**
  1. **Arrange** — mock de dados do Prisma.
  2. **Act** — chamar função do Service.
  3. **Assert** — validar resultados e chamadas.
- **Regra contra Bugs:** Reportou erro em prod? Escreva um teste que falhe para simular o erro, corrija o serviço, e veja o teste passar.

## ✅ Definition of Done (Obrigatório)
Execute a validação após **qualquer** modificação nos arquivos:

```bash
npm run validate
```

### Protocolo de Validação e Versionamento Automático (Git)
O novo Protocolo de "Definition of Done (DoD)" dita estritamente a seguinte ordem:

> [!IMPORTANT]
> **Restrição de Branch (Git Flow):**
>- O agente está terminantemente proibido de realizar commits ou fazer push na branch `main`. Todo o desenvolvimento de novas features, correções de bugs e automações feitas pelo agente devem ocorrer **exclusivamente na branch `dev`**. O comando padrão de versionamento automático deve garantir isso (ex: `git checkout dev` antes de realizar add e commit). A branch `dev` é usada para fazer o deploy de preview na Vercel, e `main` é para produção.

1. Executar `npm run validate`.
2. Ler o terminal e resolver de forma autônoma qualquer erro (TypeScript, Lint, etc) até ficar Verde.
3. Se a validação passar sem erros, executar o versionamento no Git antes de dar a tarefa como concluída.

- 🟢 **Passou (Sem erros):** A tarefa está concluída.
- 🔴 **Falhou (Com erros):** NÃO dê a tarefa como concluída. Leia os logs, corrija (TS, ESLint ou Vitest) de forma autônoma e rode novamente. Repita até ficar verde.
- Nenhum `no-unused-vars` deve restar. Se tocou no BD, não esqueça de rodar `npx prisma generate`.

Quando a validação for um sucesso, você DEVE executar os comandos de versionamento no terminal do projeto:
1. `git add .`
2. `git commit -m '<tipo>(<escopo>): <descrição da tarefa e das mudanças realizadas>'`

**Tipos válidos de commit:**
- **feat:** Nova funcionalidade ou página.
- **fix:** Correção de bug.
- **refactor:** Refatoração ou melhoria de lógica/UI sem mudar o comportamento.
- **chore:** Atualização de pacotes ou configurações de workflow.