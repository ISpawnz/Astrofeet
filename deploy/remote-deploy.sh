#!/usr/bin/env bash
# Roda NA VPS, como o usuário sem privilégios (claude-deploy), chamado pelo
# workflow .github/workflows/deploy.yml. Não precisa de root:
#   - instala Node 22 em $BASE/.node se não houver Node >= 20 no sistema;
#   - extrai a release em $BASE/releases/<sha> e troca o link $BASE/current;
#   - reinicia o app (escuta só em 127.0.0.1:$PORT; o proxy reverso publica);
#   - checa a saúde e volta para a release anterior se falhar;
#   - garante o religamento após reboot via crontab @reboot do próprio usuário.
#
# Uso: remote-deploy.sh <sha> <base> <porta>
# Espera $BASE/incoming/release.tgz e $BASE/shared/.env já enviados.
set -euo pipefail

SHA="$1"
BASE="$2"
PORT="$3"
KEEP=3
NODE_VERSION="v22.23.3"

RELEASES="$BASE/releases"
SHARED="$BASE/shared"
mkdir -p "$RELEASES" "$SHARED/data" "$BASE/logs"
# Banco (hashes de senha), .env e logs: só o próprio usuário lê.
chmod 700 "$SHARED" "$SHARED/data" "$BASE/logs"
log() { echo "[deploy] $*"; }

# ---------- Node ----------
node_ok() { command -v "$1" >/dev/null 2>&1 && [ "$("$1" -p 'process.versions.node.split(".")[0]')" -ge 20 ]; }
if node_ok "$BASE/.node/bin/node"; then
  NODE="$BASE/.node/bin/node"
elif node_ok node; then
  NODE="$(command -v node)"
else
  case "$(uname -m)" in
    x86_64) ARCH=x64 ;;
    aarch64 | arm64) ARCH=arm64 ;;
    *) echo "arquitetura não suportada: $(uname -m)" >&2; exit 1 ;;
  esac
  URL="https://nodejs.org/dist/$NODE_VERSION/node-$NODE_VERSION-linux-$ARCH.tar.xz"
  log "instalando Node $NODE_VERSION ($ARCH) em $BASE/.node"
  TMP="$(mktemp -d)"
  if command -v curl >/dev/null; then curl -fsSL "$URL" -o "$TMP/node.tar.xz"; else wget -qO "$TMP/node.tar.xz" "$URL"; fi
  rm -rf "$BASE/.node" && mkdir -p "$BASE/.node"
  tar -xJf "$TMP/node.tar.xz" -C "$BASE/.node" --strip-components=1
  rm -rf "$TMP"
  NODE="$BASE/.node/bin/node"
fi
log "node: $NODE ($("$NODE" -v))"

# ---------- start/stop (gravados em $BASE para o @reboot usar) ----------
cat >"$BASE/start.sh" <<START
#!/usr/bin/env bash
# Gerado pelo deploy. Sobe o Astrofeet em 127.0.0.1:$PORT.
set -euo pipefail
cd "$BASE/current"
set -a; . "$SHARED/.env"; set +a
export NODE_ENV=production PORT=$PORT HOSTNAME=127.0.0.1 ASTROFEET_DB_PATH="$SHARED/data/astrofeet.json"
"$BASE/stop.sh"
nohup setsid "$NODE" server.js >>"$BASE/logs/app.log" 2>&1 </dev/null &
echo \$! >"$BASE/app.pid"
START
cat >"$BASE/stop.sh" <<'STOP'
#!/usr/bin/env bash
PIDFILE="$(dirname "$0")/app.pid"
[ -f "$PIDFILE" ] || exit 0
PID="$(cat "$PIDFILE")"
if kill -0 "$PID" 2>/dev/null; then
  kill "$PID"
  for _ in $(seq 1 20); do kill -0 "$PID" 2>/dev/null || break; sleep 0.5; done
  kill -9 "$PID" 2>/dev/null || true
fi
rm -f "$PIDFILE"
STOP
chmod 700 "$BASE/start.sh" "$BASE/stop.sh"

healthy() {
  for _ in $(seq 1 30); do
    if "$NODE" -e "fetch('http://127.0.0.1:$PORT/api/products').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"; then return 0; fi
    sleep 1
  done
  return 1
}

# ---------- ativa a release ----------
TARGET="$RELEASES/$SHA"
rm -rf "$TARGET" && mkdir -p "$TARGET"
tar -xzf "$BASE/incoming/release.tgz" -C "$TARGET"
touch "$TARGET" # o tar restaura a data do pacote; a limpeza ordena por data de ativação
PREVIOUS="$(readlink "$BASE/current" 2>/dev/null || true)"
ln -sfn "$TARGET" "$BASE/current"
log "release $SHA ativada; reiniciando em 127.0.0.1:$PORT"
"$BASE/start.sh"

if ! healthy; then
  log "FALHA na checagem de saúde. Últimas linhas do log:"
  tail -n 40 "$BASE/logs/app.log" || true
  if [ -n "$PREVIOUS" ] && [ -d "$PREVIOUS" ]; then
    log "voltando para $(basename "$PREVIOUS")"
    ln -sfn "$PREVIOUS" "$BASE/current"
    "$BASE/start.sh"
    rm -rf "$TARGET"
    healthy && log "release anterior no ar" || log "a release anterior também não respondeu"
  fi
  exit 1
fi
log "app respondendo"

# ---------- religar após reboot ----------
if command -v crontab >/dev/null 2>&1; then
  LINE="@reboot $BASE/start.sh"
  (crontab -l 2>/dev/null | grep -vF "$BASE/start.sh"; echo "$LINE") | crontab - && log "crontab @reboot ok"
else
  log "aviso: crontab indisponível; após reboot rode $BASE/start.sh (ou peça um serviço systemd ao admin)"
fi

# ---------- limpeza ----------
rm -f "$BASE/incoming/release.tgz"
ls -1dt "$RELEASES"/*/ 2>/dev/null | tail -n +$((KEEP + 1)) | while read -r old; do
  [ "${old%/}" = "$(readlink "$BASE/current")" ] || rm -rf "$old"
done
log "concluído"
