#!/usr/bin/env bash
# Roda NA VPS como root (sudo -n), enviado pelo stdin pelo workflow
# .github/workflows/deploy.yml. Publica <domínio> → 127.0.0.1:<porta> no servidor
# web que já atende o spawn77.com sem mexer no que existe: só cria um arquivo
# próprio, valida a configuração inteira e faz reload (não restart). Se a
# validação falhar, desfaz a mudança e sai com erro; o spawn77.com segue intacto.
#
# Uso: setup-proxy.sh <domínio> <porta>
# Tudo fica em funções e só roda na última linha: lido via stdin, o bash precisa
# ter o script inteiro antes de executar.
set -euo pipefail

log() { echo "[proxy] $*"; }
warn() { echo "::warning::$*"; }
MARK="# Gerenciado pelo deploy do Astrofeet (deploy/setup-proxy.sh). Não edite: é reescrito a cada deploy."

# Troca $1 pelo conteúdo de $2 e roda o validador $3; se falhar, restaura o original.
swap_validated() {
  local file="$1" new="$2" check="$3" backup=""
  if [ -f "$file" ] && cmp -s "$file" "$new"; then
    log "$file já está atualizado"
    return 1
  fi
  [ -f "$file" ] && { backup="$(mktemp)"; cp -p "$file" "$backup"; }
  install -m 644 "$new" "$file"
  if ! eval "$check"; then
    if [ -n "$backup" ]; then mv "$backup" "$file"; else rm -f "$file"; fi
    warn "configuração rejeitada pelo validador; $file restaurado e nada foi recarregado"
    exit 1
  fi
  rm -f "$backup"
}

# ---------- nginx ----------
# Certificado já existente na máquina que cubra o domínio (ex.: *.spawn77.com),
# com a chave privada correspondente. Imprime "cert key".
find_cert() {
  local domain="$1" c k pub
  local -a certs keys
  # Valor de cada diretiva `d`, mesmo com várias diretivas na mesma linha.
  local directive_awk='{ for (i = 1; i < NF; i++) if ($i == d) { v = $(i + 1); gsub(/[";]/, "", v); print v } }'
  mapfile -t certs < <(nginx -T 2>/dev/null | awk -v d=ssl_certificate "$directive_awk" | sort -u)
  mapfile -t keys < <(nginx -T 2>/dev/null | awk -v d=ssl_certificate_key "$directive_awk" | sort -u)
  for c in "${certs[@]}" /etc/letsencrypt/live/*/fullchain.pem; do
    case "$c" in /etc/ssl/astrofeet/*) continue ;; esac
    [ -f "$c" ] || continue
    openssl x509 -in "$c" -noout -checkhost "$domain" 2>/dev/null | grep -q "does match" || continue
    openssl x509 -in "$c" -noout -checkend 86400 >/dev/null 2>&1 || continue
    pub="$(openssl x509 -in "$c" -noout -pubkey)"
    for k in "${keys[@]}" "$(dirname "$c")/privkey.pem"; do
      [ -f "$k" ] && [ "$(openssl pkey -in "$k" -pubout 2>/dev/null)" = "$pub" ] && { echo "$c $k"; return 0; }
    done
  done
  return 1
}

setup_nginx() {
  local domain="$1" port="$2" conf link="" tls="" cert key tmp
  if [ -d /etc/nginx/sites-enabled ] && grep -qs "sites-enabled" /etc/nginx/nginx.conf; then
    conf=/etc/nginx/sites-available/astrofeet
    link=/etc/nginx/sites-enabled/astrofeet
  else
    conf=/etc/nginx/conf.d/astrofeet.conf
  fi

  # Outro bloco já atende esse nome? Não disputa com ele.
  if grep -rlsE "server_name[^;]*[[:space:]]${domain//./\\.}([[:space:];]|$)" /etc/nginx |
    grep -vxF -e "$conf" -e "$link" | grep -q .; then
    warn "o nginx já tem um server_name $domain fora de $conf; nada foi alterado"
    return 0
  fi

  # 443 só se o nginx já atende HTTPS (Cloudflare Full/Strict). Senão, só 80 (Flexible).
  if ss -ltnpH "( sport = :443 )" 2>/dev/null | grep -q '"nginx"'; then
    if read -r cert key < <(find_cert "$domain"); then
      log "usando o certificado existente $cert"
    else
      cert=/etc/ssl/astrofeet/cert.pem
      key=/etc/ssl/astrofeet/key.pem
      if [ ! -f "$cert" ]; then
        install -d -m 700 /etc/ssl/astrofeet
        openssl req -x509 -newkey rsa:2048 -nodes -days 3650 -subj "/CN=$domain" \
          -addext "subjectAltName=DNS:$domain" -keyout "$key" -out "$cert" </dev/null 2>/dev/null
        chmod 600 "$key"
      fi
      warn "nenhum certificado da máquina cobre $domain; usando um autoassinado (aceito pela Cloudflare em SSL Full; em Full (strict) gere um Origin Certificate para *.spawn77.com)"
    fi
    tls="
    listen 443 ssl;
    ssl_certificate     $cert;
    ssl_certificate_key $key;"
  fi

  tmp="$(mktemp)"
  cat >"$tmp" <<NGINX
$MARK
server {
    listen 80;$tls
    server_name $domain;

    client_max_body_size 16m; # upload de imagens no admin
    location / {
        proxy_pass http://127.0.0.1:$port;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Real-IP \$http_cf_connecting_ip; # IP do visitante, vindo da Cloudflare
    }
}
NGINX
  local changed=1
  swap_validated "$conf" "$tmp" "nginx -t </dev/null" || changed=0
  rm -f "$tmp"
  if [ -n "$link" ] && [ ! -e "$link" ]; then
    ln -s "$conf" "$link"
    nginx -t </dev/null || { rm -f "$link"; warn "nginx -t falhou ao habilitar o site; desfeito"; exit 1; }
    changed=1
  fi
  if [ "$changed" = 1 ]; then
    systemctl reload nginx 2>/dev/null || nginx -s reload
    log "nginx recarregado: $domain → 127.0.0.1:$port"
  fi
}

# ---------- Caddy ----------
setup_caddy() {
  local domain="$1" port="$2" main=/etc/caddy/Caddyfile snip=/etc/caddy/astrofeet.caddy tmp backup
  [ -f "$main" ] || { warn "Caddy rodando, mas sem $main; configure o proxy manualmente (docs/DEPLOY.md)"; return 0; }
  if grep -qsE "^[^#]*${domain//./\\.}" "$main"; then
    warn "o Caddyfile já menciona $domain; nada foi alterado"
    return 0
  fi
  tmp="$(mktemp)"
  cat >"$tmp" <<CADDY
$MARK
$domain {
    reverse_proxy 127.0.0.1:$port {
        header_up X-Real-IP {http.request.header.CF-Connecting-IP}
    }
}
CADDY
  local validate="caddy validate --config $main --adapter caddyfile </dev/null"
  if ! grep -qxF "import $snip" "$main"; then
    install -m 644 "$tmp" "$snip"
    backup="$(mktemp)" && cp -p "$main" "$backup"
    printf '\nimport %s\n' "$snip" >>"$main"
    if ! eval "$validate"; then
      mv "$backup" "$main" && rm -f "$snip"
      warn "caddy validate falhou; Caddyfile restaurado"
      exit 1
    fi
    rm -f "$backup"
  elif ! swap_validated "$snip" "$tmp" "$validate"; then
    rm -f "$tmp"
    return 0
  fi
  rm -f "$tmp"
  systemctl reload caddy 2>/dev/null || caddy reload --config "$main" --adapter caddyfile
  log "Caddy recarregado: $domain → 127.0.0.1:$port"
}

main() {
  local domain="$1" port="$2" listeners
  listeners="$(ss -ltnpH "( sport = :80 or sport = :443 )" 2>/dev/null || true)"
  if grep -q '"nginx"' <<<"$listeners"; then
    setup_nginx "$domain" "$port"
  elif grep -q '"caddy"' <<<"$listeners"; then
    setup_caddy "$domain" "$port"
  elif pgrep -x cloudflared >/dev/null; then
    warn "spawn77.com parece servido por Cloudflare Tunnel. No painel Zero Trust → Networks → Tunnels → Public hostname, adicione $domain → http://localhost:$port"
  else
    warn "servidor web em 80/443 não reconhecido (nem nginx, nem Caddy); configure o proxy manualmente (docs/DEPLOY.md). Ouvindo:"
    echo "$listeners"
  fi
}

main "$@"
