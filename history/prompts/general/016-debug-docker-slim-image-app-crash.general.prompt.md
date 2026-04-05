---
id: "016"
title: Debug Docker Slim Image App Crash
stage: general
date: 2026-04-02
surface: agent
model: claude-opus-4-0-20250514
feature: none
branch: fix/docker-db-deploy-improvements
user: user
command: /engineering:debug
labels: ["docker", "debugging", "node-slim", "healthcheck", "sharp", "nginx"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - docker-compose.yml
  - Dockerfile
  - nginx.local.conf
tests: []
---

## Prompt

i haved used the slim package but it is collapesing you have the access of chrome search what is the best approuch of doing this work done why the app collapesing is their some issue of nginx or docker file issue

## Response snapshot

Found 3 root causes for app crash: (1) CRITICAL — curl missing in node:slim causing healthcheck death loop in docker-compose.yml, replaced with Node.js fetch-based check; (2) sharp native libs missing in slim image, added apt-get install libvips42 to Dockerfile runner stage; (3) nginx.local.conf missing mime.types include causing wrong Content-Type headers. All 3 fixes applied to docker-compose.yml, Dockerfile, and nginx.local.conf.

## Outcome

- Impact: Fixed 3 root causes preventing app from running in node:slim Docker image — healthcheck death loop, missing sharp native dependencies, and incorrect MIME types in nginx
- Tests: Manual Docker build and container startup verification
- Files: docker-compose.yml, Dockerfile, nginx.local.conf
- Next prompts: Verify production deployment with slim image; consider switching to Alpine for smaller image size
- Reflection: Node slim images strip many expected system packages; always audit runtime dependencies when switching base images

## Evaluation notes (flywheel)

- Failure modes observed: curl absence caused silent healthcheck failures leading to container restart loops; missing libvips caused sharp to crash at runtime not build time; missing mime.types caused browser to reject static assets
- Graders run and results (PASS/FAIL): Manual verification PASS — containers start and stay healthy
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Test Alpine-based image as alternative to slim for smaller footprint with more predictable package availability
