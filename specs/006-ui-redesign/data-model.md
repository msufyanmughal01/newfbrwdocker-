# Data Model: Premium UI Redesign with Dark/Light Mode

**Feature**: `006-ui-redesign` | **Branch**: `006-ui-redesign` | **Date**: 2026-02-21

This feature has no new database entities. All data models, schemas, and API interfaces remain unchanged. This document captures the **design system entities** and **component interface contracts** that define the UI layer.

---

## Design Token System

### Token Categories

**Background Layers** — Applied to the outermost containers:

| Token | Light Value | Dark Value | Usage |
|-------|-------------|------------|-------|
| `--bg` | `#f8f9fc` | `#080c14` | Page background |
| `--bg-subtle` | `#f1f3f8` | `#0d1120` | Sidebar, header, secondary areas |

**Surface Layers** — Applied to cards, panels, inputs:

| Token | Light Value | Dark Value | Usage |
|-------|-------------|------------|-------|
| `--surface` | `#ffffff` | `rgba(255,255,255,0.04)` | Cards, table containers |
| `--surface-2` | `#f5f6fa` | `rgba(255,255,255,0.07)` | Input backgrounds, table header, hover states |
| `--surface-3` | `#eef0f6` | `rgba(255,255,255,0.11)` | Active/pressed states, skeleton loaders |

**Border Tokens**:

| Token | Light Value | Dark Value | Usage |
|-------|-------------|------------|-------|
| `--border` | `#e2e5ee` | `rgba(255,255,255,0.08)` | All standard borders |
| `--border-strong` | `#c8ccdb` | `rgba(255,255,255,0.16)` | Modal panels, emphasized borders |

**Text Tokens**:

| Token | Light Value | Dark Value | Usage |
|-------|-------------|------------|-------|
| `--foreground` | `#0f1423` | `#e8edf5` | Primary text |
| `--foreground-muted` | `#6b7280` | `rgba(232,237,245,0.6)` | Secondary text, labels |
| `--foreground-subtle` | `#9ca3af` | `rgba(232,237,245,0.35)` | Placeholders, disabled text |

**Primary Action Tokens**:

| Token | Light Value | Dark Value | Usage |
|-------|-------------|------------|-------|
| `--primary` | `#4f46e5` | `#6366f1` | Primary buttons, active nav, focus rings |
| `--primary-hover` | `#4338ca` | `#818cf8` | Hover state of primary elements |
| `--primary-fg` | `#ffffff` | `#ffffff` | Text on primary backgrounds |
| `--primary-subtle` | `#eef2ff` | `rgba(99,102,241,0.15)` | Active nav item background |
| `--accent` | `#0891b2` | `#22d3ee` | Secondary accent color |

**Semantic Status Tokens**:

| Token | Light Value | Dark Value | Usage |
|-------|-------------|------------|-------|
| `--positive` | `#059669` | `#34d399` | Success states, issued/validated badges |
| `--positive-bg` | `#ecfdf5` | `rgba(52,211,153,0.1)` | Badge backgrounds for success |
| `--warning` | `#d97706` | `#fbbf24` | Warning states |
| `--warning-bg` | `#fffbeb` | `rgba(251,191,36,0.1)` | Warning badge backgrounds |
| `--error` | `#dc2626` | `#f87171` | Error states, failed badges |
| `--error-bg` | `#fef2f2` | `rgba(248,113,113,0.1)` | Error badge backgrounds |
| `--info` | `#2563eb` | `#60a5fa` | Info states, submitting/validating badges |
| `--info-bg` | `#eff6ff` | `rgba(96,165,250,0.1)` | Info badge backgrounds |

**Shadow Tokens**:

| Token | Light Value | Dark Value | Usage |
|-------|-------------|------------|-------|
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.08)...` | `0 1px 3px rgba(0,0,0,0.3)` | Subtle elevation |
| `--shadow` | `0 4px 12px rgba(0,0,0,0.08)...` | `0 4px 16px rgba(0,0,0,0.4)` | Cards, dropdowns |
| `--shadow-lg` | `0 8px 32px rgba(0,0,0,0.12)...` | `0 8px 40px rgba(0,0,0,0.6)...` | Modals, elevated panels |

**Radius Tokens** (in `:root`, no theme variation):

| Token | Value | Usage |
|-------|-------|-------|
| `--radius` | `0.75rem` | Standard rounded corners |
| `--radius-sm` | `0.5rem` | Small elements |
| `--radius-lg` | `1rem` | Large cards, modals |

---

## Component Interface Contracts

### ThemeProvider

```typescript
// src/components/ThemeProvider.tsx
interface ThemeProviderProps {
  children: React.ReactNode;
}
// Renders: next-themes ThemeProvider with attribute="class" defaultTheme="dark" enableSystem
```

### ThemeToggle

```typescript
// src/components/ThemeToggle.tsx
// No props — reads theme from useTheme() hook
// Renders: <button> with sun SVG (when dark) or moon SVG (when light)
// Uses resolvedTheme to determine current state
```

### Badge (updated InvoiceStatusBadge)

```typescript
// src/components/invoices/InvoiceStatusBadge.tsx
type BadgeVariant = 'draft' | 'issued' | 'validated' | 'failed' | 'submitting' | 'validating';

interface InvoiceStatusBadgeProps {
  status: BadgeVariant;
}

// Color mapping:
// draft       → --foreground-muted / --surface-3
// issued      → --positive / --positive-bg
// validated   → --positive / --positive-bg
// failed      → --error / --error-bg
// submitting  → --info / --info-bg
// validating  → --info / --info-bg
```

### MetricCard (updated interface)

```typescript
// src/components/dashboard/MetricCard.tsx
interface MetricCardProps {
  label: string;
  value: string;
  subLabel?: string;
  loading?: boolean;
  icon?: React.ReactNode;       // Optional icon in accent square
  accentColor?: string;         // Kept for backward compat but optional
}
// Renders with: bg-[var(--surface)] border-[var(--border)] shadow-[var(--shadow)]
// Hover: transition-transform hover:-translate-y-0.5
```

### Sidebar (updated nav items)

```typescript
// src/components/dashboard/Sidebar.tsx
// Nav items use inline SVG icons (not emoji strings)
// Active state: bg-[var(--primary-subtle)] text-[var(--primary)]
// Hover state: bg-[var(--surface-2)] text-[var(--foreground)]
// Width: w-[240px] (not w-64 = 256px)
```

### Header (updated with ThemeToggle)

```typescript
// src/components/dashboard/Header.tsx
interface HeaderProps {
  userName: string;
}
// Added: <ThemeToggle /> button before avatar
// Background: bg-[var(--bg-subtle)]/80 backdrop-blur-xl
// Height: h-14 (56px, was h-16 = 64px)
```

---

## State Transitions

### Theme State Machine

```
Initial Load
  ├─ [localStorage has preference] → apply stored preference
  ├─ [no localStorage, OS=dark]    → apply dark
  └─ [no localStorage, OS=light]   → apply light (defaultTheme="dark" overrides if no system)

User clicks ThemeToggle
  ├─ [current: dark]  → set light, store in localStorage
  └─ [current: light] → set dark, store in localStorage

Page reload
  └─ Read localStorage → apply stored theme → no flash (SSR class from next-themes)
```

---

## Files Inventory

### New Files (3)

| File | Purpose |
|------|---------|
| `src/components/ThemeProvider.tsx` | next-themes wrapper, "use client" |
| `src/components/ThemeToggle.tsx` | Sun/moon toggle button, "use client" |

### Full Rewrites (5)

| File | Change |
|------|--------|
| `src/app/globals.css` | New design system CSS vars, remove @theme inline block |
| `src/app/layout.tsx` | DM Sans font, ThemeProvider wrapper, suppressHydrationWarning |
| `src/components/dashboard/Sidebar.tsx` | SVG icons, CSS var classes, 240px width |
| `src/components/dashboard/Header.tsx` | ThemeToggle, h-14, CSS var classes |
| `src/components/dashboard/MetricCard.tsx` | CSS var classes, hover lift, optional icon |

### Targeted Updates (38 files)

All files listed in research.md Decision 7. Changes are limited to:
- Replacing `text-gray-*` → `text-[var(--foreground-muted)]` or similar
- Replacing `bg-white` → `bg-[var(--surface)]`
- Replacing `border-gray-*` → `border-[var(--border)]`
- Replacing `bg-blue-*` → `bg-[var(--primary)]`
- Replacing `text-blue-*` → `text-[var(--primary)]`
- Replacing `bg-green-*` / `text-green-*` → `bg-[var(--positive-bg)] text-[var(--positive)]`
- Replacing `bg-red-*` / `text-red-*` → `bg-[var(--error-bg)] text-[var(--error)]`
- No logic, state, TypeScript interface, or API call changes.
