# Design System Contract

**Feature**: `006-ui-redesign` | **Version**: 1.0.0 | **Date**: 2026-02-21

This contract defines the binding rules for the CSS design system. All UI components MUST comply with these rules. Violations are bugs.

---

## Rule 1: No Hardcoded Color Classes

The following Tailwind utility patterns are **FORBIDDEN** in all component and page files:

```
bg-white          bg-gray-*         text-gray-*        border-gray-*
bg-blue-*         text-blue-*       border-blue-*      ring-blue-*
bg-green-*        text-green-*      bg-red-*           text-red-*
bg-yellow-*       text-yellow-*     from-slate-*       to-slate-*
bg-slate-*        text-slate-*      border-slate-*     border-indigo-*
bg-indigo-*       text-indigo-*     text-emerald-*     bg-emerald-*
```

**Exemption**: Color values that are decorative and not semantic (e.g., Google's logo colors in SocialLoginButton SVG paths: `fill="#4285F4"`) are permitted since they are brand assets, not theme-sensitive.

---

## Rule 2: Required CSS Variable Pattern

All color styling MUST use one of these patterns:

```tsx
// Tailwind arbitrary values (preferred)
className="bg-[var(--surface)] text-[var(--foreground)] border-[var(--border)]"

// Inline style (only for properties not expressible in Tailwind)
style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}

// Shadow tokens via Tailwind arbitrary values
className="shadow-[var(--shadow)]"
```

---

## Rule 3: Token Mapping Table

| UI Concern | Required Token | Class Pattern |
|------------|---------------|---------------|
| Page background | `--bg` | `bg-[var(--bg)]` |
| Sidebar/header bg | `--bg-subtle` | `bg-[var(--bg-subtle)]` |
| Card background | `--surface` | `bg-[var(--surface)]` |
| Input background | `--surface-2` | `bg-[var(--surface-2)]` |
| Active/pressed bg | `--surface-3` | `bg-[var(--surface-3)]` |
| Standard border | `--border` | `border-[var(--border)]` |
| Strong border | `--border-strong` | `border-[var(--border-strong)]` |
| Primary text | `--foreground` | `text-[var(--foreground)]` |
| Secondary text | `--foreground-muted` | `text-[var(--foreground-muted)]` |
| Placeholder text | `--foreground-subtle` | `placeholder:text-[var(--foreground-subtle)]` |
| Primary action | `--primary` | `bg-[var(--primary)]` |
| Primary hover | `--primary-hover` | `hover:bg-[var(--primary-hover)]` |
| Primary text on bg | `--primary-fg` | `text-[var(--primary-fg)]` |
| Active nav bg | `--primary-subtle` | `bg-[var(--primary-subtle)]` |
| Active nav text | `--primary` | `text-[var(--primary)]` |
| Success text | `--positive` | `text-[var(--positive)]` |
| Success bg | `--positive-bg` | `bg-[var(--positive-bg)]` |
| Warning text | `--warning` | `text-[var(--warning)]` |
| Warning bg | `--warning-bg` | `bg-[var(--warning-bg)]` |
| Error text | `--error` | `text-[var(--error)]` |
| Error bg | `--error-bg` | `bg-[var(--error-bg)]` |
| Info text | `--info` | `text-[var(--info)]` |
| Info bg | `--info-bg` | `bg-[var(--info-bg)]` |
| Card shadow | `--shadow` | `shadow-[var(--shadow)]` |
| Modal shadow | `--shadow-lg` | `shadow-[var(--shadow-lg)]` |

---

## Rule 4: Standard Input Pattern

All `<input>`, `<select>`, `<textarea>` elements MUST use:

```
bg-[var(--surface-2)] border border-[var(--border)] rounded-lg
text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)]
focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20
transition-colors
```

---

## Rule 5: Standard Button Variants

**Primary button**:
```
bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-fg)]
rounded-lg font-medium transition-all hover:-translate-y-px hover:shadow-lg
```

**Ghost button**:
```
border border-[var(--border)] bg-transparent hover:bg-[var(--surface-2)]
text-[var(--foreground-muted)] rounded-lg transition-colors
```

**Danger button**:
```
bg-[var(--error-bg)] text-[var(--error)] border border-[var(--error)]/20
hover:bg-[var(--error)]/20 rounded-lg transition-colors
```

**Link button**:
```
text-[var(--primary)] hover:text-[var(--primary-hover)] text-sm font-medium
```

---

## Rule 6: Badge Dot Colors

Invoice status badges MUST include a leading dot with these colors:

| Status | Dot Color | Text Color | Background |
|--------|-----------|-----------|------------|
| `draft` | `--foreground-subtle` | `--foreground-muted` | `--surface-3` |
| `issued` | `--positive` | `--positive` | `--positive-bg` |
| `validated` | `--positive` | `--positive` | `--positive-bg` |
| `failed` | `--error` | `--error` | `--error-bg` |
| `submitting` | `--info` | `--info` | `--info-bg` |
| `validating` | `--info` | `--info` | `--info-bg` |

---

## Rule 7: Table Pattern

All data tables MUST use this structure:

```
Container: rounded-xl overflow-hidden bg-[var(--surface)] border border-[var(--border)]
Header row: bg-[var(--surface-2)] text-xs uppercase tracking-wider text-[var(--foreground-muted)] border-b border-[var(--border)]
Body rows: hover:bg-[var(--surface-2)] transition-colors border-b border-[var(--border)]
Cells: py-3.5 px-4 text-[var(--foreground)]
```

---

## Rule 8: Modal Pattern

All modal overlays and panels MUST use:

```
Overlay: fixed inset-0 bg-black/50 backdrop-blur-sm z-50
Panel: bg-[var(--bg-subtle)] border border-[var(--border-strong)] rounded-2xl shadow-[var(--shadow-lg)]
Header: border-b border-[var(--border)] px-6 py-4
```

---

## Verification Checklist

Run this check after every component update:

```bash
grep -rn "bg-white\|text-gray-\|border-gray-\|bg-gray-\|from-slate-\|bg-blue-\|text-blue-\|border-blue-" \
  src/components src/app/(dashboard) src/app/(auth) \
  --include="*.tsx" --exclude-dir=node_modules
```

Expected output: zero matches (or only decorative SVG fill values).
