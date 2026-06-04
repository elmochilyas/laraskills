# Hybrid Approaches: Livewire + Inertia in the Same Application

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire / Inertia Basics
- **Knowledge Unit:** Hybrid Approaches
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

It is possible to use both Livewire and Inertia in the same Laravel application for different sections or use cases. The admin panel can use Livewire (CRUD-heavy, simple interactions) while the public-facing site uses Inertia + React (complex UI, SSR for SEO). Each stack operates independently within its own route prefix, never in the same page.

The engineering value is matching the tool to the subdomain: Livewire for pages that benefit from server-side simplicity, Inertia for pages that need rich client interactivity — without forcing a single-stack compromise.

---

## Core Concepts

### Route Segregation

The two stacks must not share routes. Each route is either Livewire-handled or Inertia-handled:

```php
// routes/livewire.php
Route::prefix('/admin')->group(function () {
    Route::get('/users', App\Livewire\UsersIndex::class);
    Route::get('/users/{user}/edit', App\Livewire\UsersEdit::class);
});

// routes/inertia.php
Route::prefix('/app')->middleware(['auth'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/analytics', [AnalyticsController::class, 'index']);
});

// routes/web.php (public)
Route::get('/', function () {
    return Inertia::render('Welcome');
});
Route::get('/blog/{slug}', [BlogController::class, 'show']);
```

### No Page-Level Mixing

A single page cannot contain both a Livewire component and an Inertia page component. The page is either a Blade view (which can embed Livewire components) or an Inertia page (React/Vue/Svelte component).

However, an Inertia page CAN embed a Livewire component via an iframe or by using a separate Inertia page that loads a full Livewire-powered route. This is architecturally awkward and rarely needed.

### Shared Authentication and Middleware

Both stacks share the same Laravel middleware, auth guards, session, and CSRF protection. There is no duplication of auth logic — both stacks use `auth:sanctum` or `auth:web`:

```php
// shared middleware
Route::middleware(['auth', 'verified'])->group(function () {
    // Livewire admin routes
    Route::prefix('/admin')->group(base_path('routes/livewire.php'));
    // Inertia app routes
    Route::prefix('/app')->group(base_path('routes/inertia.php'));
});
```

---

## Mental Models

### The Multi-Page App

Think of the application as multiple small apps under the same Laravel umbrella. The admin section is a Livewire-powered multi-page app. The user app section is an Inertia-powered SPA. They share the same database, auth, and models but have independent frontend architectures.

### The Route-Level Switch

The decision of which stack handles a request is made at the route level. The router dispatches to either a Livewire component or an Inertia controller. The two stacks never overlap in the same request lifecycle.

---

## Internal Mechanics

### Layout Duplication

Each stack needs its own layout:

```
resources/
  views/
    layouts/
      admin.blade.php          # Livewire/Blade layout
    components/
      admin-sidebar.blade.php  # Blade component for Livewire sections
  js/
    Pages/                     # Inertia page components
    Layouts/
      AppLayout.jsx            # Inertia React layout
```

The Livewire layout is a Blade file that loads `livewire.js` and Alpine. The Inertia layout is a React/Vue component that loads `@inertiajs/react` and the JS framework.

### Asset Duplication

Both stacks need their assets loaded. The Livewire pages load Blade views with Vite-built CSS and minimal JS (Alpine + Livewire scripts). The Inertia pages load the full JS bundle (React/Vue + Inertia adapter + app components).

```blade
{{-- resources/views/layouts/admin.blade.php --}}
<!DOCTYPE html>
<html>
<head>
    @vite('resources/css/app.css')
</head>
<body>
    {{ $slot }}
    @livewireScripts
    @vite('resources/js/admin.js') {{-- Lightweight JS for Livewire pages --}}
</body>
</html>
```

```jsx
// resources/js/Layouts/AppLayout.jsx
import { Head } from '@inertiajs/react';
import '@vite/resources/css/app.css';

export default function AppLayout({ children }) {
    return (
        <>
            <Head />
            {children}
        </>
    );
}
```

### Shared State

- **Session**: Both stacks share Laravel session data (flash messages, auth state)
- **Cache**: Both access the same cache store
- **Database**: Both use the same Eloquent models and connections
- **CSRF**: Both use the same CSRF token mechanism

The only thing NOT shared is client-side state. Livewire state lives on the server (component properties). Inertia state lives on the client (React/Vue component state, props from server).

---

## Patterns

### Navigation Between Stacks

Navigating from a Livewire page to an Inertia page causes a full page reload (the browser navigates to a new URL). Navigating within Inertia is client-side. Navigating within Livewire is a full page load (or Livewire's `$refresh()` which is not navigation).

```blade
{{-- Livewire admin sidebar --}}
<a href="{{ route('app.dashboard') }}" class="nav-link">
    Go to Dashboard {{-- triggers full page load to Inertia section --}}
</a>
```

```jsx
// Inertia sidebar link to Livewire section
function Sidebar() {
    return (
        <a href="/admin/users">Admin Panel</a> // full page load
    );
}
```

### Shared Navigation Component

Both stacks can share a navigation structure via a Blade partial:

```blade
{{-- resources/views/partials/_nav.blade.php --}}
<nav>
    <a href="/admin">Admin</a>
    <a href="/app/dashboard">Dashboard</a>
    <a href="/profile">Profile</a>
</nav>
```

Livewire layout includes it directly. Inertia can fetch it as HTML (via an API call) or duplicate the navigation structure in JSX.

### Shared Data via Inertia Shared Props + Livewire

Livewire components can access the same session data as Inertia:

```php
// AppServiceProvider — Inertia shared data
Inertia::share('notifications', fn() => auth()->user()?->unreadNotifications()->count());

// Livewire component — accesses same data
class Navbar extends Component
{
    public function render()
    {
        return view('livewire.navbar', [
            'notificationCount' => auth()->user()?->unreadNotifications()->count(),
        ]);
    }
}
```

---

## Architectural Decisions

### When to Use Hybrid

| Scenario | Pattern | Rationale |
|---|---|---|
| Admin panel + public site | Admin: Livewire, Public: Inertia | Admin is CRUD-heavy, public needs SSR/SEO |
| Legacy migration | Old: Livewire, New: Inertia | Incremental rewrite over time |
| Team skill split | Team A: Livewire, Team B: Inertia | Leverage existing expertise per section |
| Subdomain-specific needs | Analytics: Inertia, Settings: Livewire | Complex charts need React; forms are simpler in Livewire |

### When NOT to Use Hybrid

- Team is small (1-3 devs) — context switching between stacks is expensive
- Application is small — the overhead of maintaining two stacks isn't justified
- The two sections share complex client-side state — impossible to share between stacks
- Both sections have similar interactivity levels — pick one stack and standardize

### Migration Strategy: Livewire → Inertia

```
Phase 1: Route segregation — Identify Livewire and Inertia route groups
Phase 2: Build Inertia pages alongside existing Livewire pages (same functionality)
Phase 3: Feature-flag new Inertia pages (A/B test or staged rollout)
Phase 4: Route traffic to Inertia pages once feature parity is validated
Phase 5: Decommission Livewire implementation
```

---

## Tradeoffs

| Concern | Pure Livewire | Pure Inertia | Hybrid |
|---|---|---|---|
| Team context switching | None | None | High |
| Code reuse | Max | Max | Reduced (layout, assets) |
| Asset size | Minimal | Larger | Both (load per section) |
| Infrastructure | PHP only | PHP + optional SSR | Both |
| Developer onboarding | Learn one stack | Learn one stack | Learn two stacks |
| Migration flexibility | None (rewrite needed) | None (rewrite needed) | Gradual possible |

---

## Performance Considerations

Hybrid applications load different asset bundles per section. The admin Livewire pages load a smaller JS bundle (~30KB). The Inertia app pages load the full bundle (~100KB+). This is actually more efficient than forcing one stack on both sections — each section pays only the overhead it needs.

---

## Production Considerations

- Use route prefixes to clearly delineate stack boundaries (`/admin/*` → Livewire, `/app/*` → Inertia)
- Document the stack decision per route group in your ADR
- Share auth, layout chrome (header/footer), and CSS but NOT client-side state
- Create separate layout files for each stack
- Use Vite entry points to split bundles per section
- Test both stacks independently (PHPUnit + Vitest)
- E2E tests should cover cross-stack navigation paths
- Consider a shared API layer for data that both stacks need (rather than duplicating query logic)

---

## Common Mistakes

### Trying to Share Client State

Livewire state (server) and Inertia state (client) cannot be directly shared. Don't try to sync them via hidden inputs or custom events — this creates fragile coupling. If the two sections need shared state, move the state to the server (session, database) or to a shared API.

### Inconsistent UI

Two different UI libraries (Livewire: Tailwind + Alpine, Inertia: React + MUI) produce visually inconsistent interfaces. Share the design system (colors, typography, spacing) even if the implementation differs. Use the same Tailwind config for both.

### Duplicated Layouts

Don't build two completely different navigation systems. Share the navigation structure (even if the rendering differs). A user navigating between sections should see a consistent chrome.

---

## Failure Modes

### Cross-Stack Form State Loss

A user fills out a complex form in an Inertia page, then clicks a link to the Livewire section. The browser navigates (full page load). The form state is lost. Mitigate: warn users before navigating away from Inertia forms, or persist form drafts to localStorage/session.

### Authentication Token Mismatch

Both stacks use the same session, but if one section sends a request with an expired CSRF token, the other is also affected. This is the same as any single-stack app — no special hybrid failure mode here.

### Bundle Bloat

Loading both Livewire and React on every page defeats the purpose of a hybrid approach. Ensure each section loads only its own bundle:

```javascript
// vite.config.js
export default defineConfig({
    plugins: [laravel({
        input: [
            'resources/js/app.js',        // Inertia (React/Vue)
            'resources/js/admin.js',      // Livewire (Alpine + Livewire)
            'resources/css/app.css',      // Shared CSS
        ],
    })],
});
```

---

## Ecosystem Usage

Hybrid Livewire + Inertia applications are typically used in large Laravel projects where different sections have different interactivity and rendering needs. The ecosystem allows teams to leverage both the Blade/Livewire ecosystem for admin panels and the React/Vue ecosystem for public-facing pages within a single Laravel application. Shared packages like authentication, authorization, Eloquent, and caching work identically across both stacks.

## Related Knowledge Units

- **Stack Selection Guide** (this workspace) — deciding whether to use hybrid
- **Livewire Component Architecture** (this workspace) — Livewire fundamentals
- **Inertia Page Components** (this workspace) — Inertia fundamentals
- **Blade Layout Strategies** (this workspace) — Livewire's rendering baseline
- **Feature-based Structure** (this workspace) — organizing hybrid codebases

---

## Research Notes

- Hybrid Livewire + Inertia is a documented and supported pattern (Laravel docs acknowledge it)
- Both stacks share the same Laravel session, CSRF, and middleware
- No page can contain both a Livewire component and an Inertia page — they are mutually exclusive per request
- Navigation between stacks triggers a full browser page load (no client-side transition)
- Hybrid is most common in: large applications with distinct admin/public sections, or during migrations
- The primary cost is team context switching and layout/asset duplication, not technical limitations
- There is no performance penalty — each section loads only its own frontend stack
- Consider a monorepo structure with separate build configs if the hybrid split is significant enough
