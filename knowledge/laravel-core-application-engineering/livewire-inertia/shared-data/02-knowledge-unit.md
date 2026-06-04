# Inertia Shared Data

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire / Inertia Basics
- **Knowledge Unit:** Inertia Shared Data
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Shared data (or "always props") are props that are automatically included in EVERY Inertia page response. Registered via `Inertia::share()`, these props typically include the authenticated user, flash messages, application configuration, and any other data needed across all pages. Shared data is merged with the page-specific props from the controller.

The engineering value is DRY for global page data. Without shared data, every controller action would need to pass the authenticated user to every view. With shared data, the data is defined once and automatically available in every page component.

---

## Core Concepts

### Registration

Shared data is typically registered in a middleware or service provider:

```php
// HandleInertiaRequests middleware
class HandleInertiaRequests extends Middleware
{
    public function share(Request $request): array
    {
        return [
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                ] : null,
            ],
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
            ],
        ];
    }
}
```

### Receiving Shared Data

```jsx
export default function Index({ auth, flash }) {
    return (
        <div>
            <p>Welcome, {auth.user.name}</p>
            {flash.success && <div className="alert">{flash.success}</div>}
        </div>
    );
}
```

### Merge Behavior

Shared data is MERGED with page-specific props. If a controller passes a prop with the same name as a shared prop, the page-specific prop wins:

```php
// Shared: ['auth' => ['user' => '...']]
// Controller: ['auth' => ['custom' => 'override']]
// Result: ['auth' => ['custom' => 'override']] — page-specific overrides shared
```

---

## Mental Models

### The Background Context

Shared data is like the background context of a conversation. Everyone in the room knows who they are (auth), what the current notifications are (flash), and what application version they're using (config). This context is assumed for every interaction — you don't re-introduce yourself on every sentence.

### The Global Envelope

Each page response has a global envelope (shared data) and a page-specific insert (controller props). The envelope is consistent across all pages. The insert changes per page.

---

## Internal Mechanics

### Middleware-Based Sharing

Laravel's default Inertia installation includes `HandleInertiaRequests` middleware, which is registered in the web middleware group. This middleware calls `Inertia::share()` on every web request.

### Share Types

```php
// Direct value (evaluated once at registration)
Inertia::share('appName', config('app.name'));

// Closure (evaluated on every request)
Inertia::share('auth', function () {
    return ['user' => auth()->user()?->only('id', 'name', 'email')];
});

// Array (merged into props)
Inertia::share([
    'appName' => config('app.name'),
    'locale' => app()->getLocale(),
]);
```

### Lazy Shared Data

Closures are evaluated lazily — only when the page is rendered. This allows shared data to depend on the current request:

```php
Inertia::share('flash', function () {
    return [
        'success' => session('success'),
        'error' => session('error'),
    ];
});
```

---

## Patterns

### Authenticated User

```php
// HandleInertiaRequests middleware
public function share(Request $request): array
{
    return [
        'auth' => [
            'user' => $request->user()
                ? $request->user()->only('id', 'name', 'email', 'avatar')
                : null,
        ],
    ];
}
```

### Flash Messages

```php
public function share(Request $request): array
{
    return [
        'flash' => [
            'success' => $request->session()->get('success'),
            'error' => $request->session()->get('error'),
            'warning' => $request->session()->get('warning'),
        ],
    ];
}
```

### Application Configuration

```php
Inertia::share([
    'app' => [
        'name' => config('app.name'),
        'locale' => app()->getLocale(),
        'availableLocales' => ['en', 'es', 'fr'],
    ],
]);
```

### Notifications Count

```php
public function share(Request $request): array
{
    return [
        'notifications' => $request->user()
            ? ['unread' => $request->user()->unreadNotifications->count()]
            : ['unread' => 0],
    ];
}
```

---

## Architectural Decisions

### Middleware Share vs Individual Controller Share

| Concern | Middleware Share | Controller Share |
|---|---|---|
| Scope | Global (all pages) | Per-controller |
| Maintenance | Single file | Scattered across controllers |
| Performance | Runs on every request | Runs per-action |
| Use case | Auth, flash, config | Page-specific data |

Use middleware for data needed on EVERY page. Use controller props for page-specific data.

### Shared Data Granularity

| Granularity | Example | When |
|---|---|---|
| Coarse | `auth: { user: fullProfile }` | Few shared props |
| Fine | `auth.user.name`, `auth.user.email` | Many shared props |
| Grouped | `auth`, `flash`, `config`, `notifications` | Organized by concern |

---

## Tradeoffs

| Concern | Shared Data | Per-Controller Props |
|---|---|---|
| DRY | High (defined once) | Low (repeat per action) |
| Payload size | Larger (always included) | Smaller (per-page only) |
| Debugging | Hidden (shared props are invisible in controller) | Explicit (visible in return) |
| Refactoring | Centralized change | Per-action change |

---

## Performance Considerations

Shared data closures are evaluated on every Inertia request. Each additional shared prop adds JSON serialization and transfer time. For typical shared data (auth + flash + config), overhead is under 0.5ms serialization + ~1KB payload.

---

## Production Considerations

### Keep Shared Data Minimal

Only share data that is needed on EVERY page. Auth user, flash messages, and app configuration are typical. Feature-specific data should be controller props.

### Use Closures for Request-Dependent Data

```php
// Bad — evaluated at service provider boot time
Inertia::share('auth', ['user' => Auth::user()]); // Auth::user() is null at boot

// Good — evaluated on each request
Inertia::share('auth', fn() => ['user' => Auth::user()?->only('id', 'name')]);
```

### Type Shared Data

```typescript
// resources/js/types/index.d.ts
interface PageProps {
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
        } | null;
    };
    flash: {
        success?: string;
        error?: string;
    };
}
```

---

## Common Mistakes

### Mutating Shared Data from Controllers

Shared data should NOT be modified from controllers. If a controller needs to override shared data, pass a prop with the same name (page-specific props override shared props during merge).

### Sharing Sensitive Data

```php
// Bad — exposes all user data including internal fields
Inertia::share('auth', fn() => ['user' => Auth::user()]); // User model serialized

// Good — only expose what the UI needs
Inertia::share('auth', fn() => ['user' => Auth::user()?->only('id', 'name', 'email')]);
```

### Over-Sharing

Adding every possible global value to shared data creates a large initial payload. Each additional 10KB of shared data adds ~50ms to initial load on slow connections.

---

## Failure Modes

### Shared Data Leak

If a closure in `Inertia::share()` throws an exception, the entire page response fails. Keep shared data closures simple — no database queries, no external API calls.

### Session Flash Not Displayed

If flash messages are shared but the component does not display them, users never see success/error messages. Always render flash messages in the app layout.

---

## Ecosystem Usage

Shared data integrates with Laravel's middleware pipeline (HandleInertiaRequests), session (flash messages), authentication (auth user), and configuration (app name, locale). The `Inertia::share()` facade method is the entry point and can be called from service providers, middleware, or controllers.

## Related Knowledge Units

- **Server Props** (this workspace) — page-specific vs shared props
- **Page Components** (this workspace) — receiving shared data
- **Partial Reloads** (this workspace) — shared data during partial reloads

---

## Research Notes

- `Inertia::share()` is defined in `Inertia\Inertia` facade
- The `HandleInertiaRequests` middleware is generated with `inertia-laravel` installation
- Shared data closures receive the current request as a parameter
- Shared data is merged with page-specific props using `array_merge` (page-specific wins)
