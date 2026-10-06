# Deploy: astrofeet.spawn77.com (VPS 137.131.146.32)

```
push na main ──► GitHub Actions: npm ci → typecheck → lint → build
                     │  (SSH com DEPLOY_SSH_KEY, só execução de comando)
                     ▼
VPS, usuário claude-deploy (sem root), /home/claude-deploy/site
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

Em **github.com/ISpawnz/Astrofeet → Settings → Secrets and variables → Actions → New repository secret**:

| Segredo                    | Valor                                                                                                                                                                                                                               |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DEPLOY_SSH_KEY`           | Conteúdo inteiro de `C:\Users\pedro\.ssh\claude_site_deploy_20261006` (a chave **privada**, incluindo as linhas `-----BEGIN…` e `-----END…`). Abra no Bloco de Notas e cole direto no GitHub. **Não cole em chat nenhum.**          |
| `DEPLOY_KNOWN_HOSTS`       | Saída de `ssh-keyscan -t ed25519 137.131.146.32` (PowerShell). Fixa a identidade do servidor e impede ataques de intermediário. Confira se a impressão bate com a que apareceu no seu primeiro acesso: `ssh-keygen -lf` no arquivo. |
| `ASTROFEET_AUTH_SECRET`    | 48+ caracteres aleatórios. PowerShell: `[Convert]::ToBase64String([byte[]](1..48 \| % { Get-Random -Max 256 }))`                                                                                                                            |
| `ASTROFEET_ADMIN_EMAIL`    | E-mail do primeiro administrador da loja.                                                                                                                                                                                           |
| `ASTROFEET_ADMIN_PASSWORD` | Senha desse admin (mínimo 12 caracteres).                                                                                                                                                                                           |

O admin só é criado quando o banco ainda não existe (primeiro deploy). Depois disso, trocar a senha é pela própria loja.

## 2. Proxy reverso na VPS (admin da VPS, uma vez)

Use o mesmo servidor web que já atende o spawn77.com. Para saber qual é: `sudo ss -ltnp | grep -E ':(80|443) '`.

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

O Node 22 é instalado em `~/site/.node` se a VPS não tiver Node 20+. Nada disso precisa de root.
