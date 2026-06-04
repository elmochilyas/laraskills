# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Livewire / Inertia Basics |
| Knowledge Unit | Hybrid Approaches |
| Difficulty Level | Advanced |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

It is possible to use both Livewire and Inertia in the same Laravel application for different sections or use cases. The admin panel can use Livewire (CRUD-heavy, simple interactions) while the public-facing site uses Inertia + React (complex UI, SSR for SEO). Each stack operates independently within its own route prefix, never in the same page. The engineering value is matching the tool to the subdomain: Livewire for pages that benefit from server-side simplicity, Inertia for pages that need rich client interactivity — without forcing a single-stack compromise.

---

## Core Concepts

- **Route-level segregation**: Each route is either Livewire-handled or Inertia-handled — never both on the same page
- **Separate layouts**: Livewire uses Blade layouts; Inertia uses JavaScript component layouts
- **Shared infrastructure**: Both stacks use the same Laravel middleware, auth, session, and CSRF
- **Independent operation**: Each stack has its own component/page directory, routing, and rendering pipeline
- **No page-level mixing**: A single page cannot contain both a Livewire component and an Inertia page component

---

## When To Use

- Admin panel (Livewire) + public-facing site (Inertia) in one application
- Gradual migration from Livewire to Inertia (or vice versa)
- Different sections of the app have different interactivity requirements
- Team has expertise in both stacks and wants to optimize per-section

## When NOT To Use

- Small applications where one stack suffices
- Teams proficient in only one stack
- When the same section needs both technologies (choose one per route)
- When the complexity of maintaining two frontend stacks outweighs the benefits

---

## Best Practices

- **Segregate by route prefix** — `/admin` for Livewire, `/app` for Inertia — clean separation
- **Never mix on the same page** — a page is either Blade+Livewire or Inertia, never both
- **Share auth and middleware** — both stacks use the same `auth` guard, session, CSRF
- **Separate layouts** — Livewire layout loads `livewire.js` + Alpine; Inertia layout loads JS framework bundle
- **Document the boundary** — every developer must know which routes use which stack
- **Consider a toggle** — environment-based feature flag to switch between stacks for a specific section

---

## Architecture Guidelines

- Route files separate: `routes/livewire.php`, `routes/inertia.php`
- Both files included in a shared middleware group for auth/session consistency
- Each stack needs its own layout file (Blade layout for Livewire, JS layout for Inertia)
- Shared components (nav, footer) can be duplicated per layout or rendered via Blade includes in Inertia's root template
- API routes are shared — both stacks can call the same API endpoints
- Database, models, services, and middleware are shared — only the frontend rendering differs

---

## Performance

Each stack loads only its own assets — Livewire sections don't load the React/Vue bundle, and Inertia sections don't load Livewire's JavaScript. This keeps bundle sizes optimized per section. Server-side rendering cost is the same as using either stack independently.

---

## Security

Both stacks share the same Laravel middleware pipeline — auth, CSRF, rate limiting, and other middleware apply uniformly. No additional security concerns from the hybrid approach. Ensure both stacks implement CSRF protection consistently.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Mixing stacks on same page | Trying to embed Livewire in Inertia | Architectural complexity, conflicts | Keep stacks on separate routes |
| Duplicated auth logic | Separate auth handling per stack | Inconsistent access control | Share auth middleware across both |
| Loading both bundles everywhere | Including both JS frameworks | Bloated page loads everywhere | Only load each stack on its routes |
| Unclear route boundaries | No documented separation | Developers unsure which stack to use | Document prefix-based segregation |
| One layout for both | Attempting to share Blade/JS layout | Layout doesn't work for one stack | Separate layouts per stack |

---

## Anti-Patterns

- **Livewire inside Inertia**: Embedding `<livewire:component>` in an Inertia page
- **Both JS bundles on every page**: Loading React and Livewire JS on all pages
- **Undocumented boundary**: No clear rule for which routes use which stack
- **Duplicated services**: Reimplementing the same logic in both stacks

---

## Examples

**Route segregation:**
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
```

**Shared middleware group:**
```php
Route::middleware(['auth', 'verified'])->group(function () {
    Route::prefix('/admin')->group(base_path('routes/livewire.php'));
    Route::prefix('/app')->group(base_path('routes/inertia.php'));
});
```

**Separate layouts:**
```
resources/views/layouts/admin.blade.php     # Livewire/Blade layout
resources/js/Layouts/AppLayout.jsx          # Inertia React layout
```

---

## Related Topics

- stack-selection-guide — Deciding which stack to use
- livewire/component-architecture — Livewire fundamentals
- inertia/page-components — Inertia fundamentals

---

## AI Agent Notes

- The two stacks must never share the same route — each route is either Livewire or Inertia
- Both stacks share Laravel middleware, auth guards, session, and CSRF protection
- Each stack needs its own layout (Blade for Livewire, JS component for Inertia)
- Loading both JS bundles on every page defeats the performance benefits
- The decision of which stack handles a request is made at the route level

---

## Verification

- [ ] Routes clearly segregated by prefix for each stack
- [ ] Shared auth and middleware across both stacks
- [ ] Separate layouts for Livewire (Blade) and Inertia (JS)
- [ ] No page-level mixing of stacks
- [ ] Documentation explains which routes use which stack
- [ ] Each stack loads only its own assets
- [ ] No duplicated business logic
- [ ] Both stacks' assets loaded only on their respective routes
