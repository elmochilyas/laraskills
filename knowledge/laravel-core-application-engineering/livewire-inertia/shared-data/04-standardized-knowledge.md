# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Livewire / Inertia Basics |
| Knowledge Unit | Inertia Shared Data |
| Difficulty Level | Intermediate |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Shared data ("always props") are props automatically included in EVERY Inertia page response, registered via `Inertia::share()`. These props typically include the authenticated user, flash messages, application configuration, and other data needed across all pages. Shared data merges with page-specific props from the controller. The engineering value is DRY for global page data — without shared data, every controller action would need to pass the authenticated user to every view.

---

## Core Concepts

- **Registration via `Inertia::share()`**: Called in middleware (HandleInertiaRequests), service providers, or anywhere before the response
- **`HandleInertiaRequests` middleware**: Laravel's default Inertia middleware where shared data is defined, registered in the web middleware group
- **Direct values vs closures**: Direct values evaluated once at registration; closures evaluated lazily on every request
- **Merge behavior**: Shared data merges with page-specific props; page-specific props override shared props with the same key
- **Lazy shared data**: Closures receive the request and are only invoked when the page is rendered
- **Array-based sharing**: `Inertia::share(['key' => 'value'])` registers multiple props at once

---

## When To Use

- Authenticated user data needed in navigation, sidebar, or user menu on every page
- Flash messages (success, error, warning) for user feedback after mutations
- Application configuration (app name, locale, available locales)
- Notification counts or other global UI state
- Any data that appears in the app layout on every page

## When NOT To Use

- Page-specific data (use controller props via `Inertia::render()`)
- Expensive computations that shouldn't run on every request (use lazy per-page props)
- Sensitive data that shouldn't be exposed on every page
- Data that only a subset of pages need (pass it per-controller or use partial reloads)

---

## Best Practices

- **Keep shared data minimal** — only share data needed on EVERY page. Auth, flash, and app config are typical
- **Use closures for request-dependent data** — prevents evaluation at boot time when Auth/request aren't available
- **Never share sensitive data** — `Auth::user()` exposes all model attributes; use `->only('id', 'name', 'email')`
- **Type shared data with TypeScript** — use module augmentation to type `usePage().props` for shared props
- **Test shared data independently** — a single `SharedDataTest` validates global props instead of repeating on every page test
- **Use the `HandleInertiaRequests` middleware** for shared data — keeps it centralized and consistent

---

## Architecture Guidelines

- Shared data is MERGED with page-specific props, not replaced — `array_merge` semantics (page-specific wins)
- `Inertia::share()` can be called multiple times — subsequent calls merge with existing shared data
- Direct values passed to `Inertia::share()` are evaluated at call time (not lazily)
- Closures receive the request as a parameter: `fn(Request $request) => [...]`
- Shared data runs on EVERY Inertia request, including partial reloads
- The `HandleInertiaRequests` middleware is the idiomatic location — generated with `inertia-laravel` installation

---

## Performance

Shared data closures are evaluated on every Inertia request. Each additional shared prop adds JSON serialization and transfer time. Typical shared data (auth + flash + config) adds under 0.5ms serialization + ~1KB payload. Avoid expensive operations (DB queries, API calls) in shared data closures — they run on every request. Move expensive-but-global data to lazy page props or partial reloads.

---

## Security

- Shared data is visible in EVERY page response — never include sensitive data
- `Auth::user()` passed directly exposes all model attributes, including `password`, `remember_token`, internal IDs
- Always use `->only('id', 'name', 'email')` or `->makeHidden()` when sharing user data
- Authorization checks inside closures: `$request->user()?->can('view-notifications') ? count() : 0`
- Shared data closures that throw exceptions crash the entire page response — keep them simple

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Direct value at boot | `Inertia::share('auth', ['user' => Auth::user()])` in service provider | `Auth::user()` is null at boot — always null | Use closure: `Inertia::share('auth', fn() => ['user' => Auth::user()?->only('id', 'name')])` |
| Sharing full user model | `Auth::user()` without serialization | Exposes password hash, remember_token, all attributes | Always use `->only()` or `->makeHidden()` |
| Over-sharing | Adding every global value to shared data | Large initial payload on every page | Only share what UI needs on every page |
| Mutating shared data in controllers | Modifying the value returned by `Inertia::share()` | Unpredictable behavior | Override via page-specific prop with same name |
| Expensive shared closures | DB queries or API calls in shared data closure | Every page request is slow | Move to lazy per-page props or partial reloads |

---

## Anti-Patterns

- **Global data dump**: Sharing 50+ keys because "someone might need it somewhere" — bloats every page response
- **Shared data for feature-specific UI**: Adding sidebar data to shared data because the layout renders a sidebar — pass it per-page
- **Mutating shared data at runtime**: Changing the return value of a shared data closure mid-request — data races and unpredictability
- **Nested closures in shared data**: Returning closures from shared data — they won't be resolved by Inertia's prop pipeline
- **No TypeScript types for shared data**: Accessing `usePage().props.auth.user` without typing — `any` defeats the purpose

---

## Examples

### HandleInertiaRequests Middleware

```php
class HandleInertiaRequests extends Middleware
{
    public function share(Request $request): array
    {
        return [
            'auth' => [
                'user' => $request->user()
                    ? $request->user()->only('id', 'name', 'email', 'avatar')
                    : null,
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
            'app' => [
                'name' => config('app.name'),
                'locale' => app()->getLocale(),
            ],
        ];
    }
}
```

### Receiving Shared Data in Component

```jsx
export default function Index({ auth, flash, app }) {
    return (
        <div>
            <h1>{app.name}</h1>
            <p>Welcome, {auth.user.name}</p>
            {flash.success && <div className="alert">{flash.success}</div>}
        </div>
    );
}
```

### TypeScript Module Augmentation

```typescript
// resources/js/types/inertia.d.ts
import { User } from '@/types';

declare module '@inertiajs/core' {
    interface PageProps {
        auth: { user: User | null };
        flash?: { success?: string; error?: string };
        app: { name: string; locale: string };
    }
}
```

---

## Related Topics

- Server Props — page-specific vs shared props
- Page Components — receiving shared data
- Partial Reloads — shared data during partial reloads
- TypeScript Integration — typing shared data
- HandleInertiaRequests Middleware — the default shared data location

---

## AI Agent Notes

- `Inertia::share()` is defined on the `Inertia\Inertia` facade
- The `HandleInertiaRequests` middleware is generated with `inertia-laravel` installation
- Shared data closures receive the current request as a parameter
- Shared data merges with page-specific props using `array_merge` (page-specific wins)
- `Inertia::share()` can be called multiple times — subsequent calls merge into existing data

---

## Verification

- Shared data is limited to auth, flash, and app config (or equivalent minimal set)
- All shared data uses closures (not direct values) for request-dependent data
- Auth user data uses `->only()` to limit exposed fields
- A dedicated `SharedDataTest` exists and passes
- TypeScript module augmentation exists for shared data types
