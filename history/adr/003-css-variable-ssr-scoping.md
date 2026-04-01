# ADR-003: CSS Custom Property Scoping Strategy for SSR Compatibility

> **Scope**: This ADR documents the decision cluster covering how CSS custom properties (design tokens) are scoped in relation to Next.js server-side rendering and the `next-themes` theming system. It covers token fallback strategy, theme class application timing, and the resulting first-paint behaviour in production builds.

- **Status:** Accepted
- **Date:** 2026-04-01
- **Feature:** general / docker-deploy-improvements

<!-- Significance checklist (ALL must be true to justify this ADR)
     1) Impact: Long-term consequence for architecture/platform/security? ✅ — affects every styled component, SSR output, Docker production rendering
     2) Alternatives: Multiple viable options considered with tradeoffs? ✅ — four approaches evaluated
     3) Scope: Cross-cutting concern (not an isolated detail)? ✅ — impacts all pages, all components, build pipeline, deployment
     If any are false, prefer capturing as a PHR note instead of an ADR. -->

## Context

The application uses CSS custom properties (design tokens) for all visual styling — colours, backgrounds, typography, shadows. These tokens are consumed everywhere: Tailwind arbitrary values (`bg-[var(--primary)]`), inline `style` attributes (`style={{ background: "var(--bg-subtle)" }}`), and `body {}` / `html {}` base styles.

`next-themes` manages light/dark mode by toggling a class (`"light"` or `"dark"`) on the `<html>` element via client-side JavaScript. It cannot apply this class on the server — it reads `localStorage` (unavailable in SSR) to determine the user's saved preference.

**The production failure:** All CSS custom properties were scoped exclusively inside `.light {}` and `.dark {}` class selectors with no `:root` fallback. On the initial server render, `<html>` has no theme class. Every `var(--*)` reference resolves to empty/invalid on first paint. The body had a transparent background, the sidebar was invisible, and all text colours were the browser default — the UI appeared "collapsed" or blank for 200–800ms until JavaScript hydrated and `next-themes` applied the `light` class.

This was masked in `npm run dev` because local hydration is near-instantaneous. It was only visible in `npm run build && npm start` (and Docker production) where JS parse + React hydration introduces a measurable delay.

Additionally, `suppressHydrationWarning` on `<html>` (added to suppress the `next-themes` class mismatch warning) was hiding the symptom entirely in development tooling.

## Decision

**Adopt `:root` as the canonical light-theme token scope; use `.dark` as an override layer only.**

- All CSS custom properties are defined at `:root` level with light-theme values as the default.
- The `.dark` class overrides only the tokens that differ in dark mode.
- The `.light` class is removed entirely (it is redundant when `:root` carries the light defaults).
- `next-themes` continues to use `attribute="class"` with `defaultTheme="light"` — the JS-applied class transitions from `:root` defaults to the saved preference, rather than from "undefined" to a valid state.

This ensures:
- SSR output renders correctly on first paint with no JavaScript required.
- Dark mode still functions correctly once JS hydrates and `next-themes` applies `class="dark"` to `<html>`.
- No flash of unstyled content (FOUC) in any environment.

```css
/* globals.css — canonical structure */
:root {
  /* Light theme defaults — active on first paint, before JS hydrates */
  --bg: #f8f9fc;
  --foreground: #0f1423;
  /* ... all tokens ... */
}

.dark {
  /* Override only what changes in dark mode */
  --bg: #080c14;
  --foreground: #e8edf5;
  /* ... dark overrides only ... */
}
/* .light class removed — :root IS the light theme */
```

## Consequences

### Positive

- **Zero FOUC in production** — first paint matches the hydrated state for light-mode users (the majority).
- **Correct Docker/SSR rendering** — the production build (`npm run build && npm start`) visually matches `npm run dev`.
- **Simpler CSS architecture** — removes the `.light` class entirely; one fewer layer to reason about.
- **Resilient** — works even if `next-themes` script fails to load or is blocked.
- **No breaking change** — dark mode continues to work via `.dark` class override; all component code is unchanged.

### Negative

- **Dark-mode first-paint FOUC** — users whose saved preference is `dark` will see a brief light-theme flash before JS applies `class="dark"`. This is an inherent limitation of any client-side theme resolution strategy.
- **`:root` and `.dark` must stay in sync** — if a token is added to `.dark` without a `:root` default, dark-mode users will have the token undefined on first paint until hydration. Requires discipline on token addition.
- **Not a perfect SSR theme solution** — a fully flash-free dark-mode experience requires cookie-based server-side theme resolution (out of scope for this decision).

## Alternatives Considered

### A. Blocking `<script>` in `<head>` to apply theme class before paint
Inject a small inline `<script>` that reads `localStorage` and immediately applies the theme class — before any CSS is evaluated. Used by some `next-themes` examples.

**Rejected:** Adds a render-blocking script, complicates CSP headers, and doesn't eliminate the dependency on JS for correct first-paint — it just makes JS execute earlier. The `:root` fallback approach is simpler and works without JS entirely.

### B. `prefers-color-scheme` media query in CSS for dark defaults
Use `@media (prefers-color-scheme: dark)` to define dark-mode values, bypassing the `.dark` class entirely.

**Rejected:** Loses user preference persistence (the app currently saves theme to `localStorage`). Users who override their OS preference would not have their choice respected. Also conflicts with `next-themes`' class-based approach.

### C. Cookie-based server-side theme resolution
Read the theme preference from a cookie in the Next.js middleware or layout server component, and apply the correct class on the server render.

**Rejected:** Adds middleware complexity, requires opt-out of Next.js static generation for themed pages, and is engineering overhead disproportionate to the benefit. Deferred for future consideration if dark-mode FOUC becomes a user-reported issue.

### D. Keep `.light`/`.dark` classes, add `next-themes` SSR props
Use `next-themes`' `forcedTheme` or `nonce` options alongside custom server-side session reading.

**Rejected:** Requires access to user session data in the root layout for every request (defeats caching), and `next-themes` v0.4.x does not provide a clean SSR hook for class injection without a blocking script.

## References

- Feature Spec: none (general infrastructure fix)
- Implementation Plan: none
- Related ADRs: none
- Evaluator Evidence: history/prompts/general/008-docker-ui-collapse-root-cause-analysis.general.prompt.md
