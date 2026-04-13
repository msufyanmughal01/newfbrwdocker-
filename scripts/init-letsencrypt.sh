#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# init-letsencrypt.sh — One-time Let's Encrypt dual-cert SSL setup
#
# Issues two independent certificates for the same domain:
#   - RSA  (2048-bit)  stored as: /etc/letsencrypt/live/DOMAIN-rsa/
#   - ECDSA (P-384)   stored as: /etc/letsencrypt/live/DOMAIN-ecdsa/
# Also generates DH params at /etc/letsencrypt/dhparam.pem
#
# Usage:
#   ./scripts/init-letsencrypt.sh <domain> <email> [--staging]
#
# Arguments:
#   domain    Your domain (e.g. example.com — www.example.com is added automatically)
#   email     Contact email for Let's Encrypt expiry notices
#   --staging Use the staging CA (no rate limits, certs not browser-trusted)
#             Always test with --staging first before issuing real certs.
#
# Prerequisites:
#   - DNS A (and AAAA) records for <domain> and www.<domain> → this server's IP
#   - Ports 80 and 443 reachable from the internet
#   - docker + docker compose v2 installed
#   - nginx.conf: replace YOUR_DOMAIN with <domain> before running
#
# What happens:
#   1. Dummy self-signed certs are injected into the certbot-etc volume so that
#      nginx can start without real certificates (nginx refuses to start if cert
#      files referenced in ssl_certificate do not exist).
#   2. DH params (2048-bit) are generated and stored in the volume.
#   3. nginx + app services are started.
#   4. Real RSA cert is issued via certbot webroot http-01 challenge.
#   5. Real ECDSA cert is issued via certbot webroot http-01 challenge.
#   6. nginx is reloaded — dummy certs are replaced by real ones in memory.
#   7. The certbot renewal daemon is started.
#
# After this script completes, auto-renewal runs every 12 hours inside the
# certbot container. No cron job on the host is required.
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Arguments ──────────────────────────────────────────────────────────────────
DOMAIN="${1:?Usage: $0 <domain> <email> [--staging]}"
EMAIL="${2:?Usage: $0 <domain> <email> [--staging]}"
STAGING="${3:-}"

RSA_CERT="${DOMAIN}-rsa"
ECDSA_CERT="${DOMAIN}-ecdsa"

# ── Helpers ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'
log()  { echo -e "${GREEN}[$(date +%T)]${NC} $*"; }
info() { echo -e "${BLUE}[$(date +%T)]${NC} $*"; }
warn() { echo -e "${YELLOW}[$(date +%T)] WARN:${NC} $*"; }
die()  { echo -e "${RED}[$(date +%T)] ERROR:${NC} $*" >&2; exit 1; }
hr()   { echo -e "${BOLD}─────────────────────────────────────────────────────${NC}"; }

# ── Pre-flight checks ──────────────────────────────────────────────────────────
command -v docker >/dev/null 2>&1 || die "docker is not installed or not in PATH"
docker compose version >/dev/null 2>&1 || die "docker compose v2 is not installed"

# Ensure nginx.conf has been customized
if grep -q "YOUR_DOMAIN" nginx.conf 2>/dev/null; then
  die "nginx.conf still contains 'YOUR_DOMAIN'. Replace it with '${DOMAIN}' first:\n\n  sed -i 's/YOUR_DOMAIN/${DOMAIN}/g' nginx.conf"
fi

# Build certbot flags
CERTBOT_FLAGS="--agree-tos --no-eff-email"
if [ "$STAGING" = "--staging" ]; then
  warn "Using Let's Encrypt STAGING server — certs will NOT be browser-trusted."
  CERTBOT_FLAGS="$CERTBOT_FLAGS --staging"
fi

hr
info " Let's Encrypt SSL Setup"
info " Domain:  ${BOLD}${DOMAIN}${NC} (+ www.${DOMAIN})"
info " Email:   ${EMAIL}"
info " Mode:    ${STAGING:-production}"
hr

# ── Step 1: Inject dummy certs so nginx can start ──────────────────────────────
log "Step 1/6 — Creating dummy certificates for initial nginx startup..."

# The certbot/certbot image is Alpine-based and has openssl available.
# We inject self-signed certs directly into the certbot-etc Docker volume
# so nginx can start before real certificates exist.

docker compose run --rm --entrypoint /bin/sh certbot -c "
  set -e

  # RSA dummy cert
  mkdir -p /etc/letsencrypt/live/${RSA_CERT}
  if [ ! -f /etc/letsencrypt/live/${RSA_CERT}/fullchain.pem ]; then
    openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
      -keyout /etc/letsencrypt/live/${RSA_CERT}/privkey.pem \
      -out    /etc/letsencrypt/live/${RSA_CERT}/fullchain.pem \
      -subj '/CN=localhost' 2>/dev/null
    cp /etc/letsencrypt/live/${RSA_CERT}/fullchain.pem \
       /etc/letsencrypt/live/${RSA_CERT}/chain.pem
    echo 'RSA dummy cert created.'
  else
    echo 'RSA cert already exists — skipping dummy creation.'
  fi

  # ECDSA dummy cert (P-384)
  mkdir -p /etc/letsencrypt/live/${ECDSA_CERT}
  if [ ! -f /etc/letsencrypt/live/${ECDSA_CERT}/fullchain.pem ]; then
    openssl req -x509 -nodes \
      -newkey ec -pkeyopt ec_paramgen_curve:P-384 -days 1 \
      -keyout /etc/letsencrypt/live/${ECDSA_CERT}/privkey.pem \
      -out    /etc/letsencrypt/live/${ECDSA_CERT}/fullchain.pem \
      -subj '/CN=localhost' 2>/dev/null
    cp /etc/letsencrypt/live/${ECDSA_CERT}/fullchain.pem \
       /etc/letsencrypt/live/${ECDSA_CERT}/chain.pem
    echo 'ECDSA dummy cert created.'
  else
    echo 'ECDSA cert already exists — skipping dummy creation.'
  fi
"

log "Dummy certificates injected."

# ── Step 2: Generate DH params ─────────────────────────────────────────────────
log "Step 2/6 — Generating DH params (2048-bit). This takes 30–60 seconds..."

docker compose run --rm --entrypoint /bin/sh certbot -c "
  if [ -f /etc/letsencrypt/dhparam.pem ]; then
    echo 'dhparam.pem already exists — skipping.'
  else
    openssl dhparam -out /etc/letsencrypt/dhparam.pem 2048 2>/dev/null
    echo 'DH params generated.'
  fi
"

log "DH params ready at /etc/letsencrypt/dhparam.pem"

# ── Step 3: Start nginx + app ──────────────────────────────────────────────────
log "Step 3/6 — Starting nginx and app services..."

docker compose up -d nginx app

log "Waiting for nginx to be ready (up to 30s)..."
RETRIES=0
until docker compose exec -T nginx nginx -t >/dev/null 2>&1; do
  RETRIES=$((RETRIES + 1))
  [ $RETRIES -ge 15 ] && die "Nginx did not become ready. Run: docker compose logs nginx"
  sleep 2
done

log "Nginx is up and passing config test."

# Remove dummy cert dirs so certbot uses exact names (no -0001 suffix)
log "Removing dummy cert directories before issuing real certs..."
docker compose run --rm --entrypoint /bin/sh certbot -c "
  rm -rf /etc/letsencrypt/live/${RSA_CERT}
  rm -rf /etc/letsencrypt/live/${ECDSA_CERT}
  rm -rf /etc/letsencrypt/archive/${RSA_CERT}
  rm -rf /etc/letsencrypt/archive/${ECDSA_CERT}
  rm -f /etc/letsencrypt/renewal/${RSA_CERT}.conf
  rm -f /etc/letsencrypt/renewal/${ECDSA_CERT}.conf
"

# ── Step 4: Issue RSA certificate ──────────────────────────────────────────────
log "Step 4/6 — Issuing RSA certificate via webroot..."

docker compose run --rm --entrypoint certbot certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  ${CERTBOT_FLAGS} \
  --key-type rsa \
  --cert-name "${RSA_CERT}" \
  --email "${EMAIL}" \
  -d "${DOMAIN}" \
  -d "www.${DOMAIN}"

log "RSA certificate issued: /etc/letsencrypt/live/${RSA_CERT}/"

# ── Step 5: Issue ECDSA certificate ───────────────────────────────────────────
log "Step 5/6 — Issuing ECDSA certificate (P-384) via webroot..."

docker compose run --rm --entrypoint certbot certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  ${CERTBOT_FLAGS} \
  --key-type ecdsa \
  --elliptic-curve secp384r1 \
  --cert-name "${ECDSA_CERT}" \
  --email "${EMAIL}" \
  -d "${DOMAIN}" \
  -d "www.${DOMAIN}"

log "ECDSA certificate issued: /etc/letsencrypt/live/${ECDSA_CERT}/"

# ── Step 6: Reload nginx with real certs ───────────────────────────────────────
log "Step 6/6 — Reloading nginx to load the real certificates..."

docker compose exec nginx nginx -s reload

log "Nginx reloaded successfully."

# ── Start certbot renewal daemon ───────────────────────────────────────────────
log "Starting certbot renewal daemon (--profile production)..."

docker compose --profile production up -d certbot

hr
info " SSL setup complete!"
info ""
info " Certificates:"
info "   RSA:   /etc/letsencrypt/live/${RSA_CERT}/"
info "   ECDSA: /etc/letsencrypt/live/${ECDSA_CERT}/"
info "   DH params: /etc/letsencrypt/dhparam.pem"
info ""
info " Verification commands:"
info "   # Basic HTTPS check"
info "   curl -vI https://${DOMAIN} 2>&1 | grep -E 'SSL|TLS|cipher|subject'"
info ""
info "   # Confirm ECDSA cert is served (TLS 1.3)"
info "   openssl s_client -connect ${DOMAIN}:443 -tls1_3 </dev/null 2>&1 \\"
info "     | grep -E 'Server public key|Cipher|Protocol'"
info ""
info "   # Confirm RSA fallback works (TLS 1.2, RSA cipher)"
info "   openssl s_client -connect ${DOMAIN}:443 -tls1_2 \\"
info "     -cipher 'ECDHE-RSA-AES256-GCM-SHA384' </dev/null 2>&1 \\"
info "     | grep -E 'Server public key|Cipher'"
info ""
info "   # Full SSL Labs grade report"
info "   open https://www.ssllabs.com/ssltest/analyze.html?d=${DOMAIN}&hideResults=on"
hr
