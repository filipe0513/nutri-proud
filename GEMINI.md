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
│   │   └── page.tsx              # Home (Dashboard de Stories e Ações)
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                       # Componentes gerados pelo Shadcn UI (Button, Card, Drawer...)
│   └── shared/                   # Componentes criados por nós (StoryCircle, BottomNav...)
├── store/
│   └── useAppStore.ts            # Lógica do Zustand e LocalStorage
├── lib/
│   └── utils.ts                  # Funções utilitárias (cn para Tailwind, cálculos de data)
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

### 4. Componentes Globais (Shadcn UI)
- **`Drawer` (Bottom Sheet):** Obrigatório para todos os formulários. Ao clicar em "Adicionar Refeição" na Home, sobe uma gaveta. A página não muda.
- **`Toast`:** Para feedback ("Salvo com sucesso").

---

## 🤖 Instruções de Execução para o Agente (Passo a Passo)

Agente, ao ler este arquivo, siga ESTRITAMENTE a ordem abaixo. Confirme a conclusão de cada etapa antes de avançar para a próxima.

1. **Setup Inicial:**
   - Rode `npx create-next-app@latest .` (Use TypeScript, Tailwind, App Router e alias `@/*`).
2. **Setup do Shadcn UI:**
   - Rode `npx shadcn-ui@latest init` (Estilo padrão, cor base 'Slate', variáveis CSS ativadas).
   - Instale os componentes base: `npx shadcn-ui@latest add button card drawer input toast`.
3. **Setup de Estado (Zustand):**
   - Instale `npm install zustand uuid` e `npm install -D @types/uuid`.
   - Crie o arquivo `src/store/useAppStore.ts`. Implemente a Store com as tipagens acima e use o `persist` para conectar ao LocalStorage.
4. **Construção da UI:**
   - Comece pela tela `/welcome` e `/onboarding`.
   - Após salvar o perfil, desenvolva a `Home` focando no layout de Stories (bordas coloridas).
   - Crie o `Drawer` genérico para as ações rápidas.

**Regras de Código:**
- Use `snake_case` apenas para os nomes das chaves no LocalStorage/JSON.
- Use `camelCase` para variáveis e funções TypeScript.
- Use `PascalCase` para componentes React.
- Mantenha os componentes o mais modulares possível (componentize os Stories e Cards).

## Arquitetura de Dados e Backend (Full-Stack Next.js)
Mudamos de um modelo LocalStorage para um Backend real embutido no Next.js.
- **Banco de Dados:** PostgreSQL, gerenciado exclusivamente via **Prisma ORM** (`prisma/schema.prisma`).
- **Padrão de Logs:** Utilizamos uma tabela única `DailyLog` com um campo `details` do tipo **JSONB** para acomodar diferentes categorias (WATER, FOOD, SLEEP, POOP) de forma escalável, sem criar múltiplas tabelas.
- **Validação Isomórfica (Obrigatório):** TODA validação de dados deve ser feita usando **Zod**.
  - Os schemas devem ser salvos isoladamente na pasta `src/schemas/`.
  - O mesmo schema deve ser importado nas API Routes (para barrar dados ruins) e nos formulários do Frontend (para UX).
- **API Routes:** O backend fica na pasta `src/app/api/`. Respeite a semântica RESTful (ex: `POST /api/sessions` para login, `POST /api/logs` para salvar registros).

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