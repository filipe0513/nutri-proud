# 🧪 Especialista em QA (Qualidade e Testes)

## Stack de Testes
- **Framework Principal:** Vitest (Rápido, compatível com Vite/Next).
- **Testes de Backend:** Foco exclusivo na Camada de Serviços (`src/services/`), NÃO testar as rotas de API diretamente se não for estritamente necessário.
- **Mocks:** Usar `vitest-mock-extended` para simular o Prisma Client. NUNCA rodar testes unitários contra o banco de dados de produção ou desenvolvimento real.

## Padrão de Escrita (Triple A)
Todo teste deve seguir o padrão:
1. **Arrange (Preparar):** Configurar os dados falsos e o estado do Mock do Prisma.
2. **Act (Agir):** Chamar a função do Serviço (Ex: `userService.createAnonymous()`).
3. **Assert (Garantir):** Verificar se o resultado é o esperado e se o Prisma foi chamado com os parâmetros corretos.

## Regra de Ouro (TDD reverso)
Se o usuário relatar um erro em produção (Ex: "Erro 500 no login anônimo"), a primeira ação DEVE ser escrever um teste reproduzindo a falha. Só então o código do serviço deve ser corrigido para fazer o teste passar (ficar verde).