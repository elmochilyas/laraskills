# Inertia Page Components

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire / Inertia Basics
- **Knowledge Unit:** Inertia Page Components
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary

Inertia page components are JavaScript/TypeScript components that correspond to server-side routes. Each page component receives props from the server (via the controller's `Inertia::render()`) and renders the page UI. The component is the "view" in Inertia's MVC — it replaces Blade templates for the rendering layer.

The engineering value is a unified development model where the server provides data (props) and the client renders the UI. Routes remain server-defined. Navigation is handled client-side (no full page reloads). The page component is the bridge between Laravel's backend and the JavaScript frontend framework (React, Vue, Svelte).

---

## Core Concepts

### Server-Side Rendering

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

### Client-Side Page Component

```jsx
// resources/js/Pages/Users/Index.jsx
import { Head } from '@inertiajs/react';

export default function Index({ users }) {
    return (
        <>
            <Head title="Users" />
            <h1>Users</h1>
            <ul>
                {users.map(user => (
                    <li key={user.id}>
                        {user.name} - {user.email}
                    </li>
                ))}
            </ul>
        </>
    );
}
```

### Routing

Blade routes are replaced with Inertia-compatible routes:

```php
// Routes use Inertia::render instead of view()
Route::get('/users', [UserController::class, 'index'])->name('users.index');
```

The route name is used for Inertia's client-side navigation.

---

## Mental Models

### The Prop Pipe

The server sends props down a pipe to the client component. The component receives props like arguments to a function. The server controls what data flows through the pipe; the component controls how it's displayed.

### The Server-Routed SPA

Inertia is a server-routed SPA. The server defines routes and returns data. The client renders pages. Navigation stays on the client (no full reload). This is midway between traditional server-rendered apps and client-routed SPAs.

---

## Internal Mechanics

### Page Resolution

When `Inertia::render('Users/Index', $props)` is called:

1. Blade layout (`app.blade.php`) renders an initial HTML shell with a `<div id="app">`
2. The page component path (`Users/Index`) and props are embedded as JSON in a `<script>` tag
3. Initial page load: Laravel renders Blade, which includes the Vite-built JavaScript
4. The JavaScript app mounts, reads the page component path and props from the script tag
5. The page component renders with the provided props
6. Subsequent navigation: server returns JSON (no HTML shell) with new page component + props

### Page Component Path

The path `Users/Index` maps to `resources/js/Pages/Users/Index.jsx`. Inertia resolves this path based on the configured root:

```javascript
// app.js
createInertiaApp({
    resolve: name => {
        const pages = import.meta.glob('./Pages/**/*.jsx', { eager: true });
        return pages[`./Pages/${name}.jsx`];
    },
});
```

---

## Patterns

### Layout via Page Component

Page components can wrap content in a layout:

```jsx
// resources/js/Layouts/Authenticated.jsx
export default function AuthenticatedLayout({ children, user }) {
    return (
        <div>
            <header>Welcome, {user.name}</header>
            <main>{children}</main>
        </div>
    );
}

// resources/js/Pages/Dashboard.jsx
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Dashboard({ user }) {
    return (
        <AuthenticatedLayout user={user}>
            <h1>Dashboard</h1>
        </AuthenticatedLayout>
    );
}

Dashboard.layout = page => <AuthenticatedLayout user={page.props.user} children={page} />;
```

### Type Safety with TypeScript

```typescript
// types/index.d.ts
interface User {
    id: number;
    name: string;
    email: string;
}

interface PageProps {
    auth: { user: User };
}

// Pages/Users/Index.tsx
import { PageProps } from '@/types';

export default function Index({ users }: PageProps & { users: User[] }) {
    // ...
}
```

### Flash Messages

```php
// Controller
return Inertia::render('Users/Index', [
    'flash' => session('success'),
])->with('success', 'User created.');
```

```jsx
export default function Index({ flash }) {
    return flash && <div className="alert">{flash}</div>;
}
```

---

## Architectural Decisions

### Inertia vs Blade for Pages

| Concern | Inertia | Blade |
|---|---|---|
| Rendering | Client-side (JS) | Server-side (PHP) |
| Interactivity | Full (JS framework) | Requires Alpine/Livewire |
| Initial load | Larger (JS bundle) | Smaller (HTML only) |
| Navigation | Client-side (smooth) | Server-side (full reload) |
| SEO | SSR needed | Full HTML (SEO-friendly) |
| State management | React/Vue state | Server state only |

Use Inertia for interactive applications. Use Blade for content-focused pages.

### Page Component Granularity

| Component Size | Structure | When |
|---|---|---|
| Small (<100 lines) | Single file | Simple pages |
| Medium (100-300) | Component + sub-components | Standard pages |
| Large (300-1000) | Page + multiple sub-components | Complex dashboards |

---

## Tradeoffs

| Concern | Inertia Page Components | Blade Templates |
|---|---|---|
| Type safety | TypeScript | No types (PHP arrays) |
| Interactive capability | Full (React/Vue) | Via Alpine/Livewire |
| Developer expertise | Full-stack JS | Backend PHP |
| Bundle size | ~100KB+ (framework) | ~10KB (Alpine) |
| SSR complexity | Required for SEO | None |

---

## Performance Considerations

Initial page load is slower (JS framework bundle + initial render). Subsequent navigations are faster (only JSON + client-side render). For applications with many page navigations, Inertia is faster than Blade.

---

## Production Considerations

### Use TypeScript

Define prop types for all page components. This catches prop mismatch errors between server and client.

### Handle Loading States

Server round-trips take time. Show loading indicators during navigation:

```jsx
import { usePage } from '@inertiajs/react';

export default function App({ children }) {
    const { processing } = usePage();
    return (
        <div>
            {processing && <LoadingBar />}
            {children}
        </div>
    );
}
```

### Error Pages

Create Inertia-compatible error pages:

```php
// ExceptionHandler
public function render($request, Throwable $e): Response
{
    if ($request->inertia()) {
        return Inertia::render('Errors/404')->toResponse($request);
    }
    return parent::render($request, $e);
}
```

---

## Failure Modes

### Component Resolution Failure

If the page component file does not exist at the resolved path (`resources/js/Pages/Users/Index.jsx`), Inertia throws a runtime error. Ensure that every `Inertia::render()` call has a corresponding component file.

### Prop Dehydration in SSR

When using SSR, page components that rely on browser-only APIs (window, document) during render will cause hydration mismatches. Guard browser-specific code with typeof checks or useEffect.

---

## Common Mistakes

### Patching Props Instead of Passing

Modifying received props directly in the component violates Inertia's data flow. Props are read-only (immutable from the client perspective). Clone and modify, or fetch new props from the server.

### Server Data in Component State

Copying server props to local component state creates synchronization issues:

```jsx
// Bad — local state drifts from server
const [user, setUser] = useState(props.user);

// Good — use props directly
function Profile({ user }) { /* use user prop directly */ }
```

---

## Ecosystem Usage

Inertia page components are part of the Inertia.js ecosystem and work with React, Vue 3, and Svelte adapters. The page component structure integrates with Laravel's routing, middleware, and controller systems. TypeScript support is provided through module augmentation and the `@inertiajs/core` type definitions.

## Related Knowledge Units

- **Server Props** (this workspace) — passing data from server to client
- **Shared Data** (this workspace) — global props for all pages
- **Form Handling** (this workspace) — form submissions in Inertia
- **Partial Reloads** (this workspace) — re-fetching specific props

---

## Research Notes

- Inertia v3 is the current stable version (2026)
- `Inertia::render()` returns an `Inertia\Response` instance, not a View
- The initial page load is a full HTML response; subsequent requests return JSON
- Page components are resolved by path: `Users/Index` → `resources/js/Pages/Users/Index.{jsx,tsx,vue,svelte}`
