# Quickstart: Sidebar Toggle with Settings Button

**Feature**: 007-sidebar-toggle
**Date**: 2026-02-22

---

## Overview

This feature adds a sidebar toggle button (open/close) and moves the Settings navigation item to the bottom of the sidebar. The implementation involves 3 file changes:

1. **NEW** `src/components/dashboard/DashboardShell.tsx` — client wrapper holding sidebar state
2. **MODIFIED** `src/components/dashboard/Sidebar.tsx` — accepts `isOpen` + `onToggle` props, renders collapsed/expanded states, Settings at bottom
3. **MODIFIED** `src/app/(dashboard)/layout.tsx` — delegates to `DashboardShell`

---

## Prerequisites

- Node.js 18+ and the project running locally (`npm run dev`)
- Current branch: `007-sidebar-toggle`

---

## Development Setup

```bash
# Ensure you are on the feature branch
git checkout 007-sidebar-toggle

# Install dependencies (if not already installed)
npm install

# Start the development server
npm run dev
```

Navigate to `http://localhost:3000/dashboard` and log in.

---

## Implementation Order

Follow this order to avoid breaking the layout mid-implementation:

### Step 1 — Create DashboardShell.tsx

Create `src/components/dashboard/DashboardShell.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";

interface DashboardShellProps {
  userName: string;
  children: React.ReactNode;
}

export function DashboardShell({ userName, children }: DashboardShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  return (
    <div className="flex h-screen">
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
      <div className="flex flex-1 flex-col min-w-0">
        <Header userName={userName} />
        <main className="flex-1 overflow-auto bg-transparent p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### Step 2 — Update layout.tsx

Replace the inline layout markup in `src/app/(dashboard)/layout.tsx` with `DashboardShell`:

```tsx
import { DashboardShell } from "@/components/dashboard/DashboardShell";

// In the render return:
return (
  <DashboardShell userName={session.user.name}>
    {children}
  </DashboardShell>
);
```

### Step 3 — Update Sidebar.tsx

Update `src/components/dashboard/Sidebar.tsx` to:
- Accept `isOpen` and `onToggle` props
- Render collapsed/expanded states based on `isOpen`
- Move Settings to the bottom section
- Add tooltips (native `title`) when collapsed
- Include the toggle button in the header row

See `contracts/component-api.md` for the full interface contract.

---

## Verification Checklist

After implementation, verify:

- [ ] Click toggle button → sidebar collapses to icon-only strip (~56px)
- [ ] Click toggle button again → sidebar expands to full labels (~240px)
- [ ] Navigate between pages → sidebar state persists
- [ ] Hover over nav icons when collapsed → browser tooltip appears with nav item name
- [ ] Settings button appears at the bottom, separated by a border
- [ ] Settings button navigates to `/settings/business-profile`
- [ ] Toggle button has correct `aria-label` in both states
- [ ] `npm run typecheck` passes with zero errors
- [ ] `npm run lint` passes with no new warnings

---

## Key Files Reference

| File | Role |
|------|------|
| `src/components/dashboard/DashboardShell.tsx` | NEW — holds sidebar state |
| `src/components/dashboard/Sidebar.tsx` | MODIFIED — collapsed/expanded/settings-at-bottom |
| `src/app/(dashboard)/layout.tsx` | MODIFIED — delegates to DashboardShell |
| `src/app/globals.css` | READ-ONLY — CSS variables for theming |
