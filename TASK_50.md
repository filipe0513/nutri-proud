# #50 Task: Implementação da Aba de Insights com Inteligência Artificial (Gemini)

## Contexto
O aplicativo "Orgulho da Nutri" ganhará a sua página de Insights (`/insights`). Além das métricas matemáticas (Termômetro da Semana e Efeito Dominó), a grande novidade será o **Veredito da IA**. Utilizaremos a API do Google Gemini para ler os logs dos últimos 7 dias do usuário e gerar um texto amigável e motivacional. O plano gratuito suporta até 1.500 requisições diárias, então o rate limit definido para os usuários será de **1 Veredito por dia** (para manter a exclusividade do recurso e não abusar do servidor).

## Instruções de Execução para o Agente

Desenvolva na branch `stage` e mantenha o design system de Glassmorphism.

### Passo 1: Modelagem de Dados (Prisma)
Arquivo: `prisma/schema.prisma`
- Crie o model `AiInsight` para armazenar as análises e controlar o limite de requisições:
  - `id` (UUID)
  - `user_id` (Relação com User)
  - `content` (String - Texto gerado pela IA)
  - `created_at` (DateTime - default now)
- Execute `npx prisma generate`.

### Passo 2: Instalação e Configuração do Gemini
- Instale o SDK oficial do Google: `npm install @google/generative-ai`
- Crie o arquivo `src/services/aiService.ts`.
- Configure o client do Gemini usando a variável de ambiente `process.env.GEMINI_API_KEY`. O modelo a ser utilizado deve ser o `gemini-1.5-flash` (rápido e barato).

### Passo 3: Lógica de Negócio (Limites, Prompt e IA)
Arquivos prováveis: `src/services/insightService.ts` e `src/app/api/insights/route.ts`
- **Rate Limit:** Antes de chamar a IA, verifique no banco se o usuário já possui um `AiInsight` criado na data de "hoje" (últimas 24h). Se sim, retorne o insight já salvo em vez de gastar uma nova requisição.
- **Preparação dos Dados (Contexto):** Busque no banco (Prisma) todos os logs (Água, Comida, Sono, Treino, Intestino) e "jacadas" dos últimos 7 dias. Formate isso em uma string resumida.
- **Engenharia de Prompt:** Envie os dados para o `aiService` com um System Prompt rigoroso: *"Você é a assistente virtual da Nutri Proud. Analise os logs desta semana do usuário. Escreva um parágrafo curto, acolhedor e usando emojis. Destaque um ponto positivo e dê uma dica de melhoria. Não seja punitiva. Não use formatação markdown complexa."*
- Salve a resposta no model `AiInsight` e retorne para o frontend.
- Crie também as lógicas matemáticas simples exigidas pela página (Média da Semana vs Semana Passada e Destaques - Ponto Forte/Fraco).

### Passo 4: Interface Visual (UI)
Arquivo provável: `src/app/(main)/insights/page.tsx`
- **Header:** Título "Insights".
- **Bloco 1 (Veredito da IA - Topo):** Card de destaque (`bg-glass-light-2 backdrop-blur-md`). Exiba o último texto gerado pela IA. Se não houver nenhum de hoje, exiba um botão "✨ Gerar Veredito da Semana". Ao clicar, mostre um estado de loading/skeleton legal enquanto a API responde.
- **Bloco 2 (Termômetro - Grid):** Uma grid com cards menores mostrando os cálculos matemáticos do backend: Média semanal (com seta de variação) e os pilares Destaque (🏆) e Alerta (⚠️).

### Passo 5: Definition of Done (DoD)
Antes de realizar o commit:
- Execute a validação rigorosa local:
  `npm run validate`
- Crie um mock do `@google/generative-ai` nos testes unitários (`aiService.test.ts`) para garantir que os testes rodem sem gastar tokens reais e sem falhar por falta de API KEY.
- Realize o commit na branch `stage`.