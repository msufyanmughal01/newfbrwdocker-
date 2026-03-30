---
id: "002"
title: "Fix tailwindcss resolve error"
stage: general
date: 2026-02-22
surface: agent
model: claude-sonnet-4-6
feature: none
branch: main
user: System Inn
command: "resolve this error npm run dev"
labels: ["bugfix", "tailwindcss", "module-resolution", "turbopack"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - deleted: C:/Users/System Inn/package.json
tests: []
---

## Prompt

> resolve this error npm run dev

Error: Can't resolve 'tailwindcss' in 'C:\Users\System Inn\Desktop'
using description file: C:\Users\System Inn\package.json (relative path: ./Desktop)

## Response

**Root cause:** An empty `package.json` (`{}`) existed at `C:\Users\System Inn\package.json` (user home directory). Node's `enhanced-resolve` walks up the directory tree to find `package.json` boundaries for module resolution. It found this stray file before anchoring to the project's real `package.json`, causing it to search for `tailwindcss` in `node_modules` relative to `C:\Users\System Inn\Desktop` — a path where no `node_modules` exists.

**Fix applied:** Deleted `C:\Users\System Inn\package.json` (confirmed empty `{}`).

**Verification:** `tailwindcss` and `@tailwindcss/postcss` were both correctly installed in the project's `node_modules`. No code changes needed.

## Outcome

- [x] Empty `package.json` in home directory identified as root cause
- [x] File deleted
- [x] Project dependencies confirmed correct
