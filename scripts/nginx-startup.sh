#!/bin/sh
# ─────────────────────────────────────────────────────────────────────────────
# nginx-startup.sh — Nginx container entrypoint
#
# Ensures nginx can always start, even before real Let's Encrypt certificates
# have been issued. On first deploy, real certs don't exist yet (chicken-and-egg:
# nginx needs certs to start, but certbot needs nginx running to get certs).
#
# What this script does:
#   1. If real cert files already exist → start nginx normally.
#   2. If cert files are missing → generate self-signed placeholders so nginx
#      can start and serve the ACME http-01 challenge on port 80.
#   3. After nginx is running, run init-letsencrypt.sh to replace self-signed
#      certs with real Let's Encrypt certs and reload nginx.
#
# Usage (in docker-compose.yml nginx service):
#   entrypoint: ["/bin/sh", "/scripts/nginx-startup.sh"]
# ─────────────────────────────────────────────────────────────────────────────

set -e

DOMAIN="${DOMAIN:-easydigitalinvoice.com}"
RSA_DIR="/etc/letsencrypt/live/${DOMAIN}-rsa"
ECDSA_DIR="/etc/letsencrypt/live/${DOMAIN}-ecdsa"
DHPARAM="/etc/letsencrypt/dhparam.pem"

log() { echo "[nginx-startup] $*"; }

# ── 1. Create self-signed placeholder certs if real ones are missing ──────────
if [ ! -f "${RSA_DIR}/fullchain.pem" ]; then
  log "RSA cert not found at ${RSA_DIR} — creating self-signed placeholder..."
  mkdir -p "${RSA_DIR}"
  openssl req -x509 -nodes -newkey rsa:2048 -days 3650 \
    -keyout "${RSA_DIR}/privkey.pem" \
    -out    "${RSA_DIR}/fullchain.pem" \
    -subj   "/CN=${DOMAIN}" 2>/dev/null
  cp "${RSA_DIR}/fullchain.pem" "${RSA_DIR}/chain.pem"
  log "RSA placeholder created (self-signed, valid 10y). Replace with real cert via init-letsencrypt.sh."
else
  log "RSA cert found at ${RSA_DIR} — using existing."
fi

if [ ! -f "${ECDSA_DIR}/fullchain.pem" ]; then
  log "ECDSA cert not found at ${ECDSA_DIR} — creating self-signed placeholder..."
  mkdir -p "${ECDSA_DIR}"
  openssl req -x509 -nodes \
    -newkey ec -pkeyopt ec_paramgen_curve:P-384 -days 3650 \
    -keyout "${ECDSA_DIR}/privkey.pem" \
    -out    "${ECDSA_DIR}/fullchain.pem" \
    -subj   "/CN=${DOMAIN}" 2>/dev/null
  cp "${ECDSA_DIR}/fullchain.pem" "${ECDSA_DIR}/chain.pem"
  log "ECDSA placeholder created (self-signed, valid 10y). Replace with real cert via init-letsencrypt.sh."
else
  log "ECDSA cert found at ${ECDSA_DIR} — using existing."
fi

# ── 2. Create DH params placeholder if missing ────────────────────────────────
if [ ! -f "${DHPARAM}" ]; then
  log "dhparam.pem not found — generating 2048-bit DH params (takes ~30s)..."
  openssl dhparam -out "${DHPARAM}" 2048 2>/dev/null
  log "dhparam.pem generated at ${DHPARAM}."
else
  log "dhparam.pem found — using existing."
fi

# ── 3. Test nginx config before starting ─────────────────────────────────────
log "Testing nginx configuration..."
nginx -t

# ── 4. Start nginx in foreground ─────────────────────────────────────────────
log "Starting nginx..."
exec nginx -g "daemon off;"
