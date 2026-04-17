# 📱 Projeto: Diário de Saúde Gamificado (MVP)

## 🎯 Visão Geral do Produto
Aplicativo web (PWA) focado no registro rápido e diário de 5 pilares da saúde: Água, Alimentação, Sono, Treino e Intestino. 
**Diferencial (UX/UI):** Usabilidade extrema com zero atrito (One-Click Actions). Interface minimalista e gamificada inspirada no padrão visual do **Nubank** (uso intenso de Cards, Bottom Sheets, fundos em tom cinza claro e componentes modais para manter o usuário na mesma página).

---

## 🛠️ Tech Stack Oficial
- **Core:** React 18+ e Next.js 14+ (App Router)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS
- **Biblioteca de Componentes:** Shadcn UI + Radix UI (Foco em acessibilidade e design Headless)
- **Ícones:** Lucide React
- **Gerenciamento de Estado:** Zustand (Global State)
- **Banco de Dados (MVP):** LocalStorage (JSON Web via Zustand com persistência)

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

## 🗄️ Modelagem de Dados (Zustand + LocalStorage)

O MVP utiliza duas entidades principais. O Zustand deve ser configurado com o middleware `persist` para salvar estes dados automaticamente no LocalStorage.

### 1. `user_profile` (Configurações e Metas)
~~~typescript
interface UserProfile {
  profile: {
    weight_kg: number;
    height_cm: number;
    gender: 'male' | 'female' | 'other';
    main_goal: 'fat_loss' | 'muscle_gain' | 'health';
    body_fat_percentage?: number;
  };
  targets: {
    water_ml_per_day: number; // Ex: peso * 35ml
    meals_per_day: number;
    sleep_hours_per_night: number;
    weekly_workouts: { cardio: number; strength: number };
  };
}
~~~

### 2. `activity_log` (Registros Diários)
Cada ação gera um objeto neste array. O campo `primary_value` (0 a 100) é crucial para a gamificação.
~~~typescript
interface ActivityLog {
  id: string; // UUID
  created_at: string; // ISO String (quando o botão foi clicado)
  event_time: string; // ISO String (quando o fato ocorreu)
  category: 'water' | 'food' | 'sleep' | 'workout' | 'poop';
  primary_value: number; // Nota de 0 a 100 para o "Story"
  details: {
    // Campos dinâmicos dependendo da categoria
    meal_type?: 'breakfast' | 'lunch' | 'snack' | 'dinner';
    quantity_ml?: number;
    factors?: any;
    notes?: string;
  };
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