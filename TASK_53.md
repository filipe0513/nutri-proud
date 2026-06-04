# #53 Task: O Botão "Salva-Vidas" (Recuperação de Dia)

## Contexto
Se o usuário chegar ao final do dia (após as 18h) com um score diário muito baixo (< 50%), o aplicativo exibirá proativamente um botão de emergência na Home. Ao clicar, a IA lerá o que falta fazer e gerará 3 missões rápidas para "salvar" a pontuação do dia.

## Instruções de Execução para o Agente (Branch: stage)

### Passo 1: Componente Condicional na Home
Arquivo provável: `src/app/(main)/page.tsx`
- Recupere a média geral do dia (Daily Score).
- Crie uma lógica no componente: Se `new Date().getHours() >= 18` E `dailyScore < 50`, renderize um botão de destaque chamado "🆘 Como salvo meu dia?".

### Passo 2: Modal/Drawer e Integração de IA
Arquivo provável: `src/components/shared/LifesaverDrawer.tsx`
- Crie um Drawer que se abre ao clicar no botão "Salva-Vidas".
- Crie a rota `src/app/api/ai/lifesaver/route.ts`. O frontend deve enviar os scores atuais de cada pilar.
- **Prompt Gemini:** "O usuário está com pontuação baixa hoje. Ele tem X% em Água, Y% em Comida, etc. Dê 3 dicas ultra-rápidas, em formato de lista curta com bullets, do que ele ainda pode fazer hoje à noite para melhorar esses pontos específicos."
- Exiba a resposta gerada de forma limpa no Drawer.