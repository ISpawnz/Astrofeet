# Code review: redução de código e organização

**Resultado:** `src` caiu de **25.288 → 16.441 linhas (−35%)**, sem perda de funcionalidade.
Validado com 68 testes de API, 16 testes de navegador no build de produção e revisão visual das telas alteradas.

| Área | Antes | Depois | |
|---|---:|---:|---:|
| Backend (`src/server` + `src/app/api`) | 3.799 | 1.962 | −48% |
| Primitivos shadcn (`components/ui`) | 5.397 | 1.364 | −75% |
| Telas e layout | 14.507 | 11.921 | −18% |
| Cliente, stores, hooks, shared | 1.585 | 1.194 | −25% |

De onde veio a redução, aproximadamente:

- **~3.900 linhas de código morto:** 27 componentes shadcn e um hook de toast que nada importava. Foram achados com um
  grafo de imports a partir das páginas e rotas.
- **~1.750 linhas de formatação:** Prettier com 120 colunas. Antes o código era quebrado em 80 colunas, e sem um
  formatador oficial.
- **O restante (~3.200) é refatoração.**

## Mudanças

**Dependências:** foram removidos 31 pacotes sem uso (`@dnd-kit`, `react-hook-form`, `date-fns`, `vaul`, `next-intl`,
`react-markdown`, `embla-carousel` e outros; a lista está no diff do `package.json`). Entraram, todos
reutilizáveis:

- `prettier` + `prettier-plugin-tailwindcss` (formata e ordena as classes do Tailwind);
- `eslint-plugin-unused-imports` (remove imports mortos com `--fix`);
- `@types/node`, que antes vinha de carona no `bun-types`.

O `zod`, que estava instalado mas sem uso, passou a validar todas as rotas.

**Backend:**

- `route()` substitui 39 blocos `try/catch` iguais.
- `body(req, schema)` com zod substitui a validação manual campo a campo.
- `parseJSON()` substitui 31 `JSON.parse` envoltos em `try/catch`.
- A lógica de pedidos, produtos, cupons, endereços e pontos saiu das rotas para `src/server/*`, de modo que as rotas
  ficaram com 9 a 62 linhas (a maioria abaixo de 35).
- `db.ts` passou de 567 para 215 linhas: saíram os recursos que ninguém usava (`upsert`, `_sum`, `AND`/`NOT` etc.).

**Frontend:**

- `client/api.ts` passou de 411 para cerca de 150 linhas.
- Componentes compartilhados (`TextField`, `EmptyState`, `NotificationList`, `OrderTimeline`, `SizePicker`,
  `QuantityStepper`) e o hook `useStockAlerts` substituem cópias espalhadas.
- Telas que eram cópia de outras foram refeitas:
  - "Lista de desejos" agora reusa o `ProductCard`;
  - "Visualização rápida" agora reusa os controles da página de produto;
  - a aba de notificações, que existia em dobro (admin e conta), virou um componente só.
- `AdminView` (2.877 linhas) e `AccountView` (2.221) foram divididos em pastas, com uma aba por arquivo.

## Bugs e riscos encontrados no review (corrigidos)

1. **Rota duplicada e sem proteção:** `POST /api/loyalty` era uma cópia antiga do resgate de pontos, sem trava nem cupom
   de uso único. Dava para gastar os mesmos pontos várias vezes e reutilizar o cupom. A rota foi removida.
2. **Banco copiado para o build:** o build standalone incluía `db/` (com dados de usuários), `upload/` e `docs/`.
3. **Categoria "Runner":** o admin criava produtos com essa categoria, mas a loja filtra por "Corrida", então o produto
   sumia dos filtros. Agora há uma lista única em `shared/rules.ts`.
4. **"Ticket médio" sempre R$ 0,00 no painel:** era calculado só com os pedidos do dia.
5. **"Minha conta" do admin mostrava os pedidos de todos os clientes.**
6. **Trocar a senha não derrubava as outras sessões.** Agora o token carrega uma impressão da senha.
7. **Visual:**
   - o botão "Adicionar ao carrinho" da visualização rápida não tinha fundo;
   - o e-mail aberto nas notificações do admin aparecia com texto escuro sobre fundo cinza-escuro;
   - "Produtos mais vendados" tinha erro de digitação.
8. **Concorrência nos pontos:** pontos ganhos em pedido e pontos resgatados agora usam a mesma trava.

## Efeitos colaterais

- Sessões abertas antes deste commit caem uma vez, porque o formato do token mudou.
- Status de pedido e cupons seguem as mesmas regras, mas as mensagens de validação agora vêm dos schemas zod. Os textos
  foram mantidos.
