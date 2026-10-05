# Arquitetura: backend e frontend separados

```
src/
├─ app/
│  ├─ page.tsx, layout.tsx      # frontend (UI)
│  └─ api/**/route.ts           # backend: camada HTTP fina — `route()` + schema zod + chamada a server/*
├─ proxy.ts                     # backend: barreira anti-CSRF para /api/*
│
├─ server/    ← SÓ BACKEND (todos com `import "server-only"`)
│   http.ts        route() (erros → JSON), body(req, schema zod), fail(), parseJSON()
│   auth.ts        sessão por cookie httpOnly; requireUser()/requireAdmin(); relida do banco
│   crypto.ts      scrypt + token HMAC (inclui impressão da senha: trocar senha derruba sessões)
│   db.ts          banco JSON com API no formato do Prisma Client
│   orders.ts      criação de pedido (preço/estoque/cupom/frete), listagem, mudança de status
│   products.ts    schema de produto, conversão p/ colunas, aviso "voltou ao estoque"
│   coupons.ts     regra única de cupom + uso por código
│   addresses.ts   schemas de endereço, posse, endereço padrão
│   loyalty.ts     saldo de pontos
│   lock.ts        mutex por chave (estoque, pontos) · rate-limit.ts  por IP e por identificador
│   serialize.ts   linha do banco → formato público · notifications.ts  e-mails simulados
│
├─ client/    ← SÓ FRONTEND
│   api.ts         único ponto que fala com o servidor (fetch /api/*)
│   router.ts      URL (#/rota) ⇄ tela
│
├─ shared/    ← puro, sem segredos, importável pelos dois lados
│   types.ts, format.ts (preço, datas, máscaras, slugify)
│   rules.ts       frete, status de pedido, categorias, pontos, estoque por tamanho
│
├─ components/
│   ui/            primitivos shadcn (só os usados)
│   shared/        TextField, EmptyState, NotificationList, OrderTimeline,
│                  SizePicker/QuantityStepper, presets de animação (fadeUp…)
│   admin/         painel: uma aba por arquivo (Overview, Orders, Products, ProductForm, Coupons)
│   account/       "Minha conta": uma aba por arquivo
│   views/         demais telas (home, catálogo, produto, checkout…)
│   layout/        header, footer, assistente, roteamento
├─ hooks/         use-stock-alerts, use-mobile
├─ stores/        estado de cliente (zustand)
```

## Regras (aplicadas pelo ESLint — `npm run lint`)
1. `components`, `stores`, `hooks`, `client` **não** importam `@/server/*` nem `server-only`.
2. `server` e `app/api` **não** importam `@/components`, `@/stores`, `@/hooks`, `@/client`.
3. O que os dois lados precisam (tipos, formatação, regras de negócio) vive em `src/shared`.
5. Formatação pelo Prettier (`npm run format`); imports sem uso são removidos pelo `eslint --fix`.
4. O servidor é a fonte da verdade: preços, frete, desconto, estoque e papel do usuário são sempre recalculados/lidos no backend.

## Configuração (`.env.example`)
`ASTROFEET_AUTH_SECRET` · `ASTROFEET_ADMIN_EMAIL` / `ASTROFEET_ADMIN_PASSWORD` · `ASTROFEET_ALLOWED_ORIGINS` · `ASTROFEET_DB_PATH`

## Próximo passo natural
Para separar também em **processos** (API independente do site), basta mover `src/server` + `src/app/api` para um serviço
e apontar `src/client/api.ts` para a URL dele — a fronteira de imports já está pronta para isso.
