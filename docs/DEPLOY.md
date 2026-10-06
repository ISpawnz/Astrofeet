# Deploy: astrofeet.spawn77.com (VPS 137.131.146.32)

```
push na main ──► GitHub Actions: npm ci → typecheck → lint → build
                     │  (SSH com DEPLOY_SSH_KEY, só execução de comando)
                     ▼
VPS, usuário claude-deploy, /home/claude-deploy/site (o app roda sem root)
   releases/<sha>/        3 últimas versões
   current ──► releases/<sha>
   shared/.env            segredos (600), reescrito a cada deploy
   shared/data/           banco (astrofeet.json), preservado entre deploys
   logs/app.log
   app em 127.0.0.1:3100  ◄── proxy reverso (nginx/Caddy) ◄── Cloudflare ◄── astrofeet.spawn77.com
```

O app **não** fica exposto direto: ele escuta só em `127.0.0.1:3100`. Quem publica é o proxy reverso que já atende o
spawn77.com. O spawn77.com não é tocado.

## 1. Segredos no GitHub (uma vez)

Em **github.com/ISpawnz/Astrofeet → Settings → Secrets and variables → Actions → aba "Secrets" → New repository
secret**. Só o primeiro é obrigatório:

| Segredo                                               | Valor                                                                                                                                                                                                                                               |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DEPLOY_SSH_KEY` (**obrigatório**)                    | Conteúdo inteiro de `C:\Users\pedro\.ssh\claude_site_deploy_20261006` (a chave **privada**, incluindo as linhas `-----BEGIN…` e `-----END…`). Abra no Bloco de Notas e cole direto no GitHub. **Não cole em chat nenhum.**                            |
| `ASTROFEET_ADMIN_EMAIL` + `ASTROFEET_ADMIN_PASSWORD`  | Opcional: conta de administrador da loja (senha com 12+ caracteres). Pode ser adicionada a qualquer momento; o admin é criado no deploy seguinte.                                                                                                   |
| `DEPLOY_KNOWN_HOSTS`                                  | Opcional: identidade da VPS (`ssh-keyscan -t ed25519 137.131.146.32`). Sem ele, o deploy lê a identidade a cada vez e mostra no log; salvar fixa a identidade e impede um servidor falso no meio do caminho.                                         |
| `ASTROFEET_AUTH_SECRET`                               | Opcional: segredo das sessões (32+ caracteres). Sem ele, a VPS gera um na primeira vez e guarda em `shared/auth-secret`.                                                                                                                             |

## 2. Proxy reverso na VPS

**Automático** quando o `claude-deploy` tem sudo sem senha: o passo _Publicar no proxy reverso_ roda
`deploy/setup-proxy.sh` como root. Ele:

- detecta o servidor que já atende o spawn77.com (nginx ou Caddy) e só **cria** um arquivo próprio
  (`/etc/nginx/sites-available/astrofeet` ou `/etc/nginx/conf.d/astrofeet.conf`; no Caddy, `/etc/caddy/astrofeet.caddy`
  com um `import` no fim do Caddyfile);
- valida a configuração inteira (`nginx -t` / `caddy validate`) e faz **reload**, nunca restart; se a validação falhar,
  desfaz tudo e o job fica vermelho, sem tocar no spawn77.com;
- não mexe em nada se outro bloco já atende `astrofeet.spawn77.com`;
- no nginx com HTTPS, reaproveita um certificado da máquina que cubra o nome (ex.: `*.spawn77.com`); se não houver,
  gera um autoassinado, aceito pela Cloudflare em SSL **Full** (em **Full (strict)**, instale um Origin Certificate
  da Cloudflare para `*.spawn77.com`);
- com Cloudflare Tunnel ou outro servidor, só avisa no log o que configurar.

> **Segurança:** a chave do GitHub com sudo dá root na VPS do spawn77.com a quem puder alterar este repositório. Depois
> do primeiro deploy verde, recomendo revogar o sudo (`sudo deluser claude-deploy sudo` ou apagar a regra em
> `/etc/sudoers.d`). Os deploys seguintes continuam funcionando: o passo do proxy é pulado e a configuração criada fica.

**Manual**, se preferir não dar sudo: use o mesmo servidor web que já atende o spawn77.com. Para saber qual é:
`sudo ss -ltnp | grep -E ':(80|443) '`.

**nginx**, em `/etc/nginx/sites-available/astrofeet` e com link simbólico em `sites-enabled`:

```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name astrofeet.spawn77.com;
    # Mesmo certificado do spawn77.com se ele cobrir *.spawn77.com (ex.: Cloudflare Origin CA);
    # senão, emita um para este nome.
    ssl_certificate     /caminho/do/cert.pem;
    ssl_certificate_key /caminho/da/chave.pem;

    client_max_body_size 16m; # upload de imagens no admin (até 5 × 2 MB em base64)
    location / {
        proxy_pass http://127.0.0.1:3100;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto https;
        # IP real do visitante (Cloudflare). Seguro porque a origem só aceita tráfego da Cloudflare.
        proxy_set_header X-Real-IP $http_cf_connecting_ip;
    }
}
```

`sudo nginx -t && sudo systemctl reload nginx`

**Caddy**, no `Caddyfile`:

```caddy
astrofeet.spawn77.com {
    reverse_proxy 127.0.0.1:3100 {
        header_up X-Real-IP {http.request.header.CF-Connecting-IP}
    }
}
```

`sudo systemctl reload caddy`

## 3. DNS na Cloudflare (uma vez)

Em **spawn77.com → DNS → Add record**: tipo `A`, nome `astrofeet`, conteúdo `137.131.146.32`, proxy **ligado** (nuvem
laranja). Use o mesmo modo de SSL que o spawn77.com já usa.

## 4. Publicar

- **Automático:** todo push/merge na `main` publica.
- **Manual:** GitHub → **Actions → Deploy VPS → Run workflow**.

O workflow para com erro claro se faltar algum segredo. Na VPS, se a versão nova não responder em 30 s, o deploy volta
sozinho para a anterior e o job fica vermelho, com o log do app.

## Operação (como claude-deploy na VPS)

| Para…                   | Comando                                                                                       |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| ver o log               | `tail -f ~/site/logs/app.log`                                                                 |
| reiniciar / parar       | `~/site/start.sh` / `~/site/stop.sh`                                                          |
| voltar uma versão       | `ln -sfn ~/site/releases/<sha> ~/site/current && ~/site/start.sh`                             |
| backup do banco         | `cp ~/site/shared/data/astrofeet.json ~/backup-$(date +%F).json`                              |
| religar após reboot     | automático via `crontab @reboot` (o deploy registra). Sem crontab, rode `~/site/start.sh`.    |

O Node 22 é instalado em `~/site/.node` se a VPS não tiver Node 20+. Nada disso precisa de root; só o passo do proxy usa.
