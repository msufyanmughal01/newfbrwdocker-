# Component API Contracts: Sidebar Toggle

**Feature**: 007-sidebar-toggle
**Date**: 2026-02-22

> Note: This feature has no HTTP API changes. All contracts are component-level (TypeScript props/interfaces).

---

## DashboardShell

**File**: `src/components/dashboard/DashboardShell.tsx`
**Type**: New client component

### Description
Client wrapper for the dashboard layout. Holds sidebar open/closed state and renders the flex layout container.

### Props

```typescript
interface DashboardShellProps {
  /** The authenticated user's name, passed down from the server layout */
  userName: string;
  /** Dashboard page content */
  children: React.ReactNode;
}
```

### State

```typescript
const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
```

### Rendered Output Contract

- Renders a `div` with `className="flex h-screen"`
- Renders `<Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />`
- Renders a `div` wrapping `<Header />` and `<main>` that expands to fill remaining width

---

## Sidebar (Modified)

**File**: `src/components/dashboard/Sidebar.tsx`
**Type**: Modified existing client component

### Props (after modification)

```typescript
interface SidebarProps {
  /** Whether the sidebar is in expanded (true) or collapsed (false) state */
  isOpen: boolean;
  /** Callback to toggle the sidebar state */
  onToggle: () => void;
}
```

### Visual Behavior Contract

| State | Width | Logo area | Nav labels | Toggle icon |
|-------|-------|-----------|------------|-------------|
| `isOpen=true` | 240px (`w-60`) | Icon + text | Visible | Left chevron (←) |
| `isOpen=false` | 56px (`w-14`) | Icon only | Hidden | Right chevron (→) |

### Accessibility Contract

- Toggle button MUST have `aria-label` of "Collapse sidebar" or "Expand sidebar" based on state.
- Each nav icon in collapsed state MUST have a `title` attribute matching the navigation label.
- Settings button MUST have `aria-label="Settings"` when collapsed.

### Animation Contract

- The `aside` element transitions its width using `transition-all duration-200 ease-in-out`.
- The `aside` uses `overflow-hidden` to clip content during transition.
- Nav item labels use `whitespace-nowrap` to prevent line-wrapping during transition.

---

## Layout Contract: DashboardLayout (layout.tsx)

**File**: `src/app/(dashboard)/layout.tsx`
**Type**: Minimal modification — delegate to DashboardShell

### Before

```tsx
return (
  <div className="flex h-screen">
    <Sidebar />
    <div className="flex flex-1 flex-col">
      <Header userName={session.user.name} />
      <main className="flex-1 overflow-auto bg-transparent p-6">
        {children}
      </main>
    </div>
  </div>
);
```

### After

```tsx
return (
  <DashboardShell userName={session.user.name}>
    {children}
  </DashboardShell>
);
```

The server component passes `userName` to the client shell, keeping auth logic server-side.

---

## Error Cases

| Scenario | Expected Behavior |
|----------|------------------|
| `onToggle` not provided | TypeScript compile error — prop is required |
| `isOpen` not provided | TypeScript compile error — prop is required |
| Sidebar overflows on very small screens | Sidebar remains functional; no JS error; layout may require horizontal scroll (out of scope for this feature) |
