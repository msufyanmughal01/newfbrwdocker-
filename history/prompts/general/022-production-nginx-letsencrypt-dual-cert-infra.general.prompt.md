---
id: "022"
title: Production Nginx Let's Encrypt Dual-Cert Infrastructure
stage: general
date: 2026-04-05
surface: agent
model: claude-sonnet-4-6
feature: none
branch: fix/docker-db-deploy-improvements
user: System Inn
command: design and implement production-grade Dockerized infrastructure
labels: ["docker","nginx","ssl","letsencrypt","certbot","ecdsa","rsa","devops","infrastructure"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - docker-compose.yml
  - nginx.conf
  - docker-compose.override.yml
  - scripts/init-letsencrypt.sh
  - scripts/certbot-entrypoint.sh
tests:
  - "curl -vI https://DOMAIN 2>&1 | grep -E 'SSL|TLS|cipher'"
  - "openssl s_client -connect DOMAIN:443 -tls1_3 </dev/null 2>&1 | grep 'Server public key'"
  - "openssl s_client -connect DOMAIN:443 -tls1_2 -cipher ECDHE-RSA-AES256-GCM-SHA384 </dev/null | grep 'Server public key'"
  - "docker compose exec nginx nginx -t"
---

## Prompt

You are a senior DevOps engineer.

Design and implement a **production-grade Dockerized infrastructure** for a Next.js application with the following requirements:

## Core Architecture

* Use Nginx as a reverse proxy in front of a Next.js app running on port 3000
* Use Docker Compose to orchestrate services
* Include separate services for: Nginx, Certbot (Let's Encrypt), Next.js application

## SSL Requirements

* Integrate SSL using Let's Encrypt
* Configure **dual certificate support**: RSA (legacy) + ECDSA (modern)
* Nginx serves ECDSA as primary, RSA as fallback

## Certificate Management

* Use Certbot with webroot method
* Implement automatic certificate renewal
* Add a deploy hook to reload Nginx after renewal
* Ensure certificates persist using Docker volumes

## Nginx Configuration

* Redirect HTTP → HTTPS, HTTP/2, TLSv1.2 + TLSv1.3, secure ciphers, session caching
* Reverse proxy to Next.js with header preservation

## Security Requirements

* Disable weak ciphers/protocols, OCSP stapling, HSTS, production TLS hardening

## Docker Requirements

* Complete docker-compose.yml, volumes for /etc/letsencrypt + webroot, restart policies

## Response snapshot

Implemented 5 files:

**docker-compose.yml**: Added `certbot` service with `profiles: [production]` (not started in local dev), `certbot-etc` and `certbot-www` named volumes shared between nginx and certbot. Changed app `ports` → `expose` (3000 not exposed to host, only nginx needs it). Certbot mounts Docker socket for deploy hook.

**nginx.conf**: Full production config with:
- HTTP server: ACME challenge passthrough at `/.well-known/acme-challenge/` + 301 redirect everything else to HTTPS
- HTTPS server: dual `ssl_certificate` / `ssl_certificate_key` pairs (ECDSA first, RSA second), `http2 on`, TLS 1.2+1.3 only, AEAD-only cipher list (ECDSA ciphers first, then RSA, then DHE fallbacks, CHACHA20 for mobile), `ssl_prefer_server_ciphers off`, DH params, OCSP stapling with Let's Encrypt chain, HSTS 2yr+preload, full security headers, rate limiting, gzip.

**scripts/init-letsencrypt.sh**: 6-step one-time setup script:
1. Inject dummy self-signed certs (RSA 2048 + ECDSA P-384) into named volume so nginx can start before real certs exist
2. Generate 2048-bit DH params in the volume
3. Start nginx + app; wait for nginx -t to pass
4. Issue real RSA cert via certbot webroot
5. Issue ECDSA cert via certbot webroot (secp384r1)
6. `nginx -s reload` to load real certs; start certbot daemon

**scripts/certbot-entrypoint.sh**: Certbot renewal daemon that installs docker-cli via apk, verifies Docker socket, then loops every 12 hours running `certbot renew --deploy-hook "docker exec taxdigital-nginx nginx -s reload"`.

**docker-compose.override.yml**: Updated comments to accurately reflect that volumes MERGE (not replace) in Docker Compose, and that the certbot service is excluded via profiles.

## Outcome

- ✅ Impact: Full production SSL infra with zero-downtime cert renewal, dual cert ECDSA+RSA, and clean local/prod separation via Docker Compose profiles
- 🧪 Tests: openssl s_client commands to verify ECDSA primary + RSA fallback; SSL Labs grade check
- 📁 Files: 5 files modified/created
- 🔁 Next prompts: `/sp.adr nginx-dual-cert-ecdsa-rsa`, domain replacement `sed -i 's/YOUR_DOMAIN/example.com/g' nginx.conf`, run init script in staging first
- 🧠 Reflection: Docker socket mount in certbot is the most common production pattern but has elevated privilege implications; documented security note and mitigation option (tecnativa/docker-socket-proxy)

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): manual review PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): test with --staging flag before production cert issuance
