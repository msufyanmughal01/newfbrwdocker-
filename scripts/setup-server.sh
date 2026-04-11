#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# setup-server.sh — One-time production server setup
#
# Run this ONCE on your server after cloning the repo.
# It will:
#   1. Replace YOUR_DOMAIN in nginx.conf with your real domain
#   2. Create a .env.production template (you fill in secrets)
#   3. Run init-letsencrypt.sh to issue SSL certificates
#   4. Start the full stack
#
# Usage:
#   chmod +x scripts/setup-server.sh
#   ./scripts/setup-server.sh yourdomain.com admin@yourdomain.com
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

DOMAIN="${1:-easydigitalinvoice.com}"
EMAIL="${2:?Usage: $0 <domain> <email>}"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'
log()  { echo -e "${GREEN}[$(date +%T)]${NC} $*"; }
info() { echo -e "${BLUE}[$(date +%T)]${NC} $*"; }
warn() { echo -e "${YELLOW}[$(date +%T)] WARN:${NC} $*"; }
die()  { echo -e "${RED}[$(date +%T)] ERROR:${NC} $*" >&2; exit 1; }
hr()   { echo -e "${BOLD}─────────────────────────────────────────────────────${NC}"; }

hr
info " Easy Digital Invoice — Server Setup"
info " Domain: ${BOLD}${DOMAIN}${NC}"
info " Email:  ${EMAIL}"
hr

# ── Pre-flight ─────────────────────────────────────────────────────────────────
command -v docker >/dev/null 2>&1 || die "docker not found. Install it first: https://docs.docker.com/engine/install/ubuntu/"
docker compose version >/dev/null 2>&1 || die "docker compose v2 not found."
[ -f nginx.conf ] || die "nginx.conf not found. Run this script from /opt/easydigital"

# ── Step 1: Replace domain in nginx.conf ──────────────────────────────────────
if grep -q "YOUR_DOMAIN" nginx.conf; then
  log "Step 1 — Replacing YOUR_DOMAIN with ${DOMAIN} in nginx.conf..."
  sed -i "s/YOUR_DOMAIN/${DOMAIN}/g" nginx.conf
  log "nginx.conf updated. Occurrences replaced:"
  grep -n "${DOMAIN}" nginx.conf | head -10
else
  warn "Step 1 — nginx.conf already updated (no YOUR_DOMAIN found)."
fi

# ── Step 2: Create .env.production if missing ─────────────────────────────────
if [ ! -f .env.production ]; then
  log "Step 2 — Creating .env.production template..."
  cat > .env.production <<EOF
# ── Database (Neon PostgreSQL) ─────────────────────────────────────────────────
# Get from: https://neon.tech → Your project → Connection string (pooled)
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require

# ── Authentication ─────────────────────────────────────────────────────────────
# Generate secret: node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
BETTER_AUTH_SECRET=REPLACE_ME
BETTER_AUTH_URL=https://${DOMAIN}

# ── Google OAuth ───────────────────────────────────────────────────────────────
# Get from: https://console.cloud.google.com → APIs & Services → Credentials
# Authorized redirect URI: https://${DOMAIN}/api/auth/callback/google
GOOGLE_CLIENT_ID=REPLACE_ME
GOOGLE_CLIENT_SECRET=REPLACE_ME

# ── FBR (Tax Integration) ──────────────────────────────────────────────────────
FBR_ENV=sandbox
# FBR_API_TOKEN=  # only needed for FBR_ENV=production

# ── Encryption ─────────────────────────────────────────────────────────────────
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=REPLACE_ME
ECDH_PRIVATE_KEY_HEX=REPLACE_ME

# ── Admin Panel ────────────────────────────────────────────────────────────────
# Generate: node -e "console.log(require('crypto').randomBytes(12).toString('hex'))"
ADMIN_SECRET_KEY=REPLACE_ME

# ── Email (Resend) ─────────────────────────────────────────────────────────────
# Get from: https://resend.com → API Keys
RESEND_API_KEY=re_REPLACE_ME
CONTACT_EMAIL=admin@${DOMAIN}

# ── Public URL ─────────────────────────────────────────────────────────────────
NEXT_PUBLIC_SITE_URL=https://${DOMAIN}
EOF
  warn "Step 2 — .env.production created. FILL IN ALL 'REPLACE_ME' VALUES before continuing!"
  warn "         Run: nano .env.production"
  echo ""
  read -p "Press ENTER after you have filled in .env.production to continue..." _
else
  warn "Step 2 — .env.production already exists. Skipping."
fi

# ── Verify .env.production has no REPLACE_ME left ─────────────────────────────
if grep -q "REPLACE_ME" .env.production 2>/dev/null; then
  die ".env.production still has unfilled REPLACE_ME values. Fill them in first:\n  nano .env.production"
fi

# ── Step 3: Log in to GitHub Container Registry ───────────────────────────────
log "Step 3 — Logging in to GitHub Container Registry..."
info " You need a GitHub Personal Access Token with 'read:packages' scope."
info " Create one at: https://github.com/settings/tokens"
echo ""
read -p "Enter your GitHub username: " GH_USER
read -s -p "Enter your GitHub PAT (read:packages): " GH_TOKEN
echo ""
echo "${GH_TOKEN}" | docker login ghcr.io -u "${GH_USER}" --password-stdin
log "Logged in to ghcr.io."

# ── Step 4: Issue SSL certificates ────────────────────────────────────────────
log "Step 4 — Issuing SSL certificates (Let's Encrypt)..."
info " This will issue BOTH an RSA and ECDSA certificate for ${DOMAIN}."
info " Make sure DNS is pointing to this server before continuing."
echo ""
read -p "Press ENTER to start SSL certificate issuance (or Ctrl+C to abort)..." _

chmod +x scripts/init-letsencrypt.sh
./scripts/init-letsencrypt.sh "${DOMAIN}" "${EMAIL}"

hr
info " Setup complete!"
info ""
info " Your app should now be running at: https://${DOMAIN}"
info ""
info " Useful commands:"
info "   docker compose logs -f app        # watch app logs"
info "   docker compose logs -f nginx      # watch nginx logs"
info "   docker compose ps                 # check container status"
info "   curl -I https://${DOMAIN}         # verify HTTPS"
hr
