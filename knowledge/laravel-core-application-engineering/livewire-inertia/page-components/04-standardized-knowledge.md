# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Livewire / Inertia Basics |
| Knowledge Unit | Inertia Page Components |
| Difficulty Level | Foundation |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Inertia page components are JavaScript/TypeScript components that correspond to server-side routes. Each page component receives props from the server (via the controller's `Inertia::render()`) and renders the page UI. The component is the "view" in Inertia's MVC — it replaces Blade templates for the rendering layer. The engineering value is a unified development model where the server provides data (props) and the client renders the UI. Routes remain server-defined. Navigation is handled client-side (no full page reloads).

---

## Core Concepts

- **Server-side rendering**: `Inertia::render('Users/Index', ['users' => $users])` returns a response that maps a controller action to a page component
- **Client-side page component**: A React/Vue/Svelte component at `resources/js/Pages/Users/Index.jsx` that receives props and renders the UI
- **Page resolution**: The path `Users/Index` maps to `resources/js/Pages/Users/Index.jsx` via the `resolve` callback in `createInertiaApp`
- **Layout components**: Persistent layouts wrap page components and maintain state across navigations
- **Initial vs subsequent navigation**: First request returns full HTML shell with embedded JSON; subsequent requests return JSON only
- **Route naming**: Standard Laravel routes are used — no special Inertia route syntax

---

## When To Use

- Replacing Blade as the view layer in interactive, JS-heavy applications
- Building SPAs where routes are still defined and controlled by the server
- When you need rich client-side interactivity (React/Vue/Svelte) without a separate API
- Team has full-stack JS experience alongside Laravel expertise

## When NOT To Use

- Content-focused pages (blogs, documentation) where Blade is simpler and faster
- Projects that can't justify the JS framework bundle (~100KB+)
- When SEO is critical and SSR infrastructure is not feasible
- Simple CRUD apps where Livewire or Blade + Alpine is sufficient

---

## Best Practices

- **Define TypeScript interfaces for all page props** — catches prop mismatch errors at compile time
- **Use persistent layouts** — layouts remain mounted across navigations, preserving state and reducing re-renders
- **Keep page components focused on layout and data display** — extract reusable UI into separate components
- **Handle loading states** — use `usePage().processing` to show navigation progress indicators
- **Create Inertia-compatible error pages** — render 404/403 via `Inertia::render('Errors/404')` in the exception handler
- **Use `Head` component** — set page title and meta tags per component for SEO and UX

---

## Architecture Guidelines

- `Inertia::render('Users/Index', $props)` returns an `Inertia\Response` instance, not a View
- Page component path `Users/Index` maps to `resources/js/Pages/Users/Index.{jsx,tsx,vue,svelte}`
- The initial page load is a full HTML response; subsequent navigations return JSON
- Blade layout (`app.blade.php`) renders the HTML shell with `<div id="app">` (or `@inertia` for SSR)
- Layout assignment via `Component.layout = page => <Layout>{page}</Layout>` enables persistent layouts
- Props are read-only on the client — clone and modify or use partial reloads to refresh

---

## Performance

Initial page load is slower (must load JS framework bundle + render). Subsequent navigations are faster (only JSON + client-side render). For apps with many pages, Inertia outperforms Blade after the first load. Use lazy loading (`import.meta.glob`) for code-splitting page components. Bundle size depends on the JS framework chosen: React ~120KB, Vue ~80KB, Svelte ~30KB gzipped.

---

## Security

- Props are embedded in the HTML source on initial load — never pass sensitive data (passwords, tokens, internal IDs)
- Server validation remains the source of truth — client-side validation is UX only
- Authorization checks in controllers still apply — Inertia doesn't bypass Laravel's middleware or policies
- The `X-Inertia` header-based protocol is not a security boundary — always validate and authorize server-side

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Copying server props to local state | Treating props as initial values | State drifts from server; sync issues | Use props directly for server data |
| Missing component file | No matching file for `Inertia::render()` path | Runtime error at page resolution | Create component file for every `Inertia::render()` call |
| Mutating props directly | JS patterns of direct assignment | Breaks Inertia's immutable data flow | Treat props as read-only; use partial reloads |
| Browser-only code in SSR | Direct access to window/document during render | Hydration mismatch errors | Guard browser-specific code with typeof or useEffect |
| Large inline component files | Putting all markup in one file | Poor maintainability, hard to test | Split into sub-components at 200+ lines |

---

## Anti-Patterns

- **Props as initial state**: Copying `props.user` into `useState(props.user)` creates synchronization drift between server and client
- **Client-routed navigation**: Using React Router or Vue Router for page changes breaks Inertia's server-routed model
- **Fat page components**: 500+ line page components mixing layout, data fetching, and business logic — extract into sub-components and hooks
- **Missing layout persistence**: Creating a new layout instance on every navigation instead of using persistent layouts resets layout state
- **No loading indication**: Page transitions without any loading feedback feel sluggish and unresponsive

---

## Examples

### Basic Page Component with Layout

```jsx
// resources/js/Pages/Users/Index.jsx
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index({ users }) {
    return (
        <>
            <Head title="Users" />
            <h1>Users</h1>
            <ul>
                {users.map(user => (
                    <li key={user.id}>{user.name} - {user.email}</li>
                ))}
            </ul>
        </>
    );
}

Index.layout = page => <AuthenticatedLayout children={page} />;
```

### Server Route

```php
class UserController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Users/Index', [
            'users' => User::all()->map(fn($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
            ]),
        ]);
    }
}
```

### Error Page

```php
// App\Exceptions\Handler
public function render($request, Throwable $e): Response
{
    if ($request->inertia()) {
        return Inertia::render('Errors/404')->toResponse($request);
    }
    return parent::render($request, $e);
}
```

---

## Related Topics

- Server Props — passing data from server to client
- Shared Data — global props for all pages
- Form Handling — form submissions in Inertia
- Partial Reloads — re-fetching specific props
- SSR Configuration — server-side rendering of page components
- TypeScript Integration — typing page component props

---

## AI Agent Notes

- Inertia v3 is the current stable version (2026)
- `Inertia::render()` returns an `Inertia\Response`, not a View
- Page components are resolved by path matching against `resources/js/Pages/`
- Use `@inertiajs/react`, `@inertiajs/vue3`, or `@inertiajs/svelte` adapter packages
- The `resolve` callback in `createInertiaApp` uses Vite's `import.meta.glob` for page discovery

---

## Verification

- Every `Inertia::render()` call has a corresponding page component file
- Page component files are organized under `resources/js/Pages/` matching the route structure
- TypeScript interfaces exist for all page props
- Layout components use the `.layout` property pattern for persistence
- Error pages are created for 403, 404, and 500 status codes
