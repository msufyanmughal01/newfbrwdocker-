#!/bin/sh
# ─────────────────────────────────────────────────────────────────────────────
# certbot-entrypoint.sh — Certbot renewal daemon
#
# Runs inside the easydigital-certbot container.
# Checks for certificate renewal every 12 hours.
# After successful renewal, reloads nginx via docker exec (requires
# /var/run/docker.sock to be mounted into this container).
#
# Let's Encrypt certificates expire after 90 days.
# Certbot renews when < 30 days remain (configurable via --renew-before-expiry).
# With 12-hour checks, the maximum drift between renewal and nginx reload
# is 12 hours — well within the 30-day renewal window.
# ─────────────────────────────────────────────────────────────────────────────

set -e

NGINX_CONTAINER="easydigital-nginx"
CHECK_INTERVAL_SECONDS=43200   # 12 hours

# ── Install docker CLI for the deploy hook ─────────────────────────────────
# certbot/certbot is Alpine-based; docker-cli is in the main package index.
echo "[certbot] Installing docker-cli for nginx reload hook..."
if apk add --no-cache docker-cli > /dev/null 2>&1; then
  echo "[certbot] docker-cli installed."
else
  echo "[certbot] WARNING: docker-cli install failed. nginx will NOT be reloaded after cert renewal."
  echo "[certbot] Certs will still renew; restart nginx manually after renewal: docker exec ${NGINX_CONTAINER} nginx -s reload"
fi

# ── Verify docker socket is accessible ────────────────────────────────────
if [ -S /var/run/docker.sock ]; then
  echo "[certbot] Docker socket found. Deploy hook (nginx reload) is active."
else
  echo "[certbot] WARNING: /var/run/docker.sock not found. Deploy hook disabled."
  echo "[certbot] Add '- /var/run/docker.sock:/var/run/docker.sock' to certbot volumes."
fi

echo "[certbot] Renewal daemon started. Checking every $((CHECK_INTERVAL_SECONDS / 3600)) hours."
echo "[certbot] Deploy hook: docker exec ${NGINX_CONTAINER} nginx -s reload"

# ── Graceful shutdown ──────────────────────────────────────────────────────
trap 'echo "[certbot] Received SIGTERM — shutting down renewal daemon."; exit 0' TERM INT

# ── Renewal loop ──────────────────────────────────────────────────────────
while :; do
  TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  echo "[certbot] ${TIMESTAMP} — Running renewal check..."

  # --quiet suppresses output when no renewal is needed.
  # --deploy-hook runs ONLY when at least one cert is actually renewed.
  # The hook reloads nginx so the new cert is picked up with zero downtime.
  certbot renew \
    --quiet \
    --deploy-hook "docker exec ${NGINX_CONTAINER} nginx -s reload" \
    2>&1 | while IFS= read -r line; do
      echo "[certbot] ${line}"
    done

  echo "[certbot] Renewal check complete. Next check in $((CHECK_INTERVAL_SECONDS / 3600)) hours."

  # Sleep in the background so SIGTERM is handled immediately
  sleep ${CHECK_INTERVAL_SECONDS} &
  SLEEP_PID=$!
  wait ${SLEEP_PID}
done
