# Data Model: Sidebar Toggle with Settings Button

**Feature**: 007-sidebar-toggle
**Date**: 2026-02-22

---

## Note on Data Model

This is a pure UI/layout feature with no persistent data, database entities, or API calls. The "data model" here describes the **component state model** — the shape of state and props that drive the sidebar behavior.

---

## Component State: DashboardShell

Lives in: `src/components/dashboard/DashboardShell.tsx`

| State Field | Type | Default | Description |
|-------------|------|---------|-------------|
| `isSidebarOpen` | `boolean` | `true` | Whether the sidebar is in expanded (true) or collapsed (false) state |

### State Transitions

```text
isSidebarOpen = true  (Expanded)
  │
  │  user clicks toggle button
  ▼
isSidebarOpen = false (Collapsed)
  │
  │  user clicks toggle button
  ▼
isSidebarOpen = true  (Expanded)
```

---

## Component Props: Sidebar

Component: `src/components/dashboard/Sidebar.tsx`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | Yes | Controls whether sidebar shows expanded or collapsed layout |
| `onToggle` | `() => void` | Yes | Callback to toggle the sidebar open/closed state |

---

## Navigation Item Structure

The `navItems` array defines main navigation. Shape remains unchanged.

```typescript
interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}
```

**Main navItems** (unchanged except Settings removed from this list):
- Dashboard (`/dashboard`)
- Invoices (`/invoices`)
- Drafts (`/invoices/drafts`)
- New Invoice (`/invoices/new`)
- Clients (`/clients`)
- HS Codes (`/settings/hs-codes`)

**Bottom section** (new, separate from navItems):
- Settings (`/settings/business-profile`) — rendered in sidebar footer, always pinned at bottom

---

## Visual Layout Model

### Expanded State (isSidebarOpen = true)

```text
┌─────────────────────────┐
│  [FBR] FBR Portal       │ ← Logo + brand + [←] toggle button
│       Digital Invoicing │
├─────────────────────────┤
│  ⬛ Dashboard           │
│  📄 Invoices            │ ← Main nav (flex-1, scrollable)
│  ✏️  Drafts             │
│  ➕ New Invoice         │
│  👥 Clients             │
│  🔍 HS Codes            │
├─────────────────────────┤
│  ⚙️  Settings           │ ← Bottom section (pinned, border-top)
└─────────────────────────┘
```

### Collapsed State (isSidebarOpen = false)

```text
┌──────┐
│ FBR  │ ← Logo icon only + [→] toggle button
├──────┤
│  ⬛  │ title="Dashboard"
│  📄  │ title="Invoices"   ← Main nav, icons only + native tooltips
│  ✏️  │ title="Drafts"
│  ➕  │ title="New Invoice"
│  👥  │ title="Clients"
│  🔍  │ title="HS Codes"
├──────┤
│  ⚙️  │ title="Settings"   ← Bottom section
└──────┘
```

---

## Layout Width Model

| State | Sidebar Width | Content Area |
|-------|--------------|--------------|
| Expanded | 240px (`w-60`) | `flex-1` (fills remaining) |
| Collapsed | 56px (`w-14`) | `flex-1` (fills remaining) |

Both use `transition-all duration-200` for smooth animation.
