# Arquitetura: backend e frontend separados

```
src/
├─ app/
│  ├─ page.tsx, layout.tsx      # frontend (UI)
│  └─ api/**/route.ts           # backend: camada HTTP fina (valida, chama server/*)
├─ proxy.ts                     # backend: barreira anti-CSRF para /api/*
│
├─ server/    ← SÓ BACKEND (todos com `import "server-only"`)
│   auth.ts        sessão por cookie httpOnly, relida do banco
│   crypto.ts      scrypt + HMAC (exige ASTROFEET_AUTH_SECRET ≥32 em produção)
│   db.ts          armazenamento (API compatível com Prisma Client)
│   coupons.ts     regra única de cupom (preview e pedido)
│   lock.ts        mutex por chave (estoque, pontos)
│   rate-limit.ts  por IP e por identificador
│   http.ts        HttpError, handleApiError, ok()
│   serialize.ts   linha do banco → formato público (nunca vaza campos internos)
│   notifications.ts, seed-data.ts
│
├─ client/    ← SÓ FRONTEND
│   api.ts         único ponto que fala com o servidor (fetch /api/*)
│   router.ts      URL (#/rota) ⇄ tela
│
├─ shared/    ← puro, sem segredos, importável pelos dois lados
│   types.ts, format.ts
│
├─ components/, stores/, hooks/  # UI e estado de cliente
```

## Regras (aplicadas pelo ESLint — `npm run lint`)
1. `components`, `stores`, `hooks`, `client` **não** importam `@/server/*` nem `server-only`.
2. `server` e `app/api` **não** importam `@/components`, `@/stores`, `@/hooks`, `@/client`.
3. O que os dois lados precisam (tipos, formatação) vive em `src/shared`.
4. O servidor é a fonte da verdade: preços, frete, desconto, estoque e papel do usuário são sempre recalculados/lidos no backend.

## Configuração (`.env.example`)
`ASTROFEET_AUTH_SECRET` · `ASTROFEET_ADMIN_EMAIL` / `ASTROFEET_ADMIN_PASSWORD` · `ASTROFEET_ALLOWED_ORIGINS` · `ASTROFEET_DB_PATH`

## Próximo passo natural
Para separar também em **processos** (API independente do site), basta mover `src/server` + `src/app/api` para um serviço
e apontar `src/client/api.ts` para a URL dele — a fronteira de imports já está pronta para isso.
