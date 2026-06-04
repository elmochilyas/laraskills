## Rule: Route-Level Stack Segregation

Never render a Livewire component and an Inertia page component on the same route.

---

## Category

Architecture

---

## Rule

Assign each route exclusively to Livewire or Inertia. A single URL must never delegate rendering to both stacks. Use route prefixes to enforce this separation.

---

## Reason

Mixing stacks on the same page creates conflicts between Livewire's AJAX DOM management and Inertia's navigation protocol, leads to unpredictable rendering behavior, doubles JavaScript bundle size for that page, and creates an unmaintainable architecture where the rendering pipeline is unclear.

---

## Bad Example

```php
// routes/web.php — mixed without clear separation
Route::get('/dashboard', [DashboardController::class, 'index']); // Inertia
// Inside dashboard.blade.php: <livewire:stats-widget /> — mixing stacks
```

---

## Good Example

```php
// routes/livewire.php — pure Livewire routes
Route::prefix('/admin')->group(function () {
    Route::get('/users', App\Livewire\UsersIndex::class);
});

// routes/inertia.php — pure Inertia routes
Route::prefix('/app')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);
});
```

---

## Exceptions

A shared Blade layout (e.g., `app.blade.php`) that renders the HTML shell for either stack is allowed. The layout itself is not a page — it is the container. No other exceptions.

---

## Consequences Of Violation

Maintenance risks: unclear rendering responsibility, difficult debugging. Scalability risks: cannot independently scale or optimize each stack. Reliability risks: hydration conflicts, DOM corruption.

---

## Rule: Separate Layouts Per Stack

Always maintain separate layout files for Livewire (Blade) and Inertia (JavaScript component).

---

## Category

Architecture

---

## Rule

Livewire pages must use a Blade layout that loads `livewire.js` and Alpine.js. Inertia pages must use a JavaScript component layout that loads the JS framework bundle (React/Vue/Svelte). Never share a single layout between stacks.

---

## Reason

Each stack requires different JavaScript assets, directives, and rendering pipelines. A shared layout forces both JS bundles to load on every page, defeating the performance benefit of using separate stacks. Blade layouts support `@livewireStyles`/`@livewireScripts` directives that have no equivalent in JS frameworks.

---

## Bad Example

```blade
{{-- layouts/app.blade.php — used for both stacks — loads both bundles --}}
<script src="{{ mix('js/livewire.js') }}"></script>
<script src="{{ mix('js/app.js') }}"></script>
```

---

## Good Example

```
resources/views/layouts/admin.blade.php    # Loads livewire.js + Alpine
resources/js/Layouts/AppLayout.jsx         # Loads React/Vue bundle
```

---

## Exceptions

The root Blade template (`app.blade.php`) that renders the `@inertia` directive for SSR pages is shared infrastructure, not a layout. It does not load Livewire assets.

---

## Consequences Of Violation

Performance risks: both JS bundles loaded on every page, increased payload. Maintenance risks: layout changes affect both stacks, unintended side effects.

---

## Rule: Shared Laravel Infrastructure

Share Laravel middleware, auth guards, session, CSRF, and database layers uniformly across both stacks.

---

## Category

Architecture

---

## Rule

Both Livewire and Inertia routes must use the same middleware pipeline (`auth`, `verified`, CSRF, rate limiting) and session configuration. Never duplicate or split infrastructure logic between stacks.

---

## Reason

Duplicated auth or middleware logic between stacks creates inconsistent security, divergent behavior, and maintenance overhead. Both stacks run in the same Laravel process — they must share the same middleware groups, session drivers, and auth guards to ensure uniform behavior.

---

## Bad Example

```php
// Duplicated auth logic — one for each stack
Route::prefix('/admin')->middleware(['livewire.auth'])->group(...);
Route::prefix('/app')->middleware(['inertia.auth'])->group(...);
```

---

## Good Example

```php
Route::middleware(['auth', 'verified'])->group(function () {
    Route::prefix('/admin')->group(base_path('routes/livewire.php'));
    Route::prefix('/app')->group(base_path('routes/inertia.php'));
});
```

---

## Exceptions

If a specific route prefix (e.g., public marketing pages in Inertia) genuinely does not need authentication, add that middleware exception at the route group level, not by duplicating or modifying the core stack infrastructure.

---

## Consequences Of Violation

Security risks: inconsistent auth enforcement, one stack may be less secure. Maintenance risks: infrastructure changes must be made in multiple places. Reliability risks: divergent session behavior between stacks.

---

## Rule: Exclusive Asset Loading Per Stack

Load each stack's JavaScript assets only on the routes that use that stack.

---

## Category

Performance

---

## Rule

Livewire routes must load only `livewire.js` and Alpine.js. Inertia routes must load only the JS framework bundle (React/Vue/Svelte). Never load both stack bundles unconditionally on every page.

---

## Reason

Loading both bundles on all pages eliminates the asset-size advantage of a hybrid approach. Livewire's bundle (~30KB) is wasted on Inertia pages; Inertia's framework bundle (~100KB+) is wasted on Livewire pages. Conditional asset loading keeps each page's payload minimal.

---

## Bad Example

```blade
{{-- app.blade.php — used for every page --}}
@livewireScripts
@vite(['resources/js/app.jsx'])
```

---

## Good Example

```blade
{{-- layouts/admin.blade.php — Livewire only --}}
@livewireStyles
@livewireScripts

{{-- Inertia root template — Inertia only --}}
@vite(['resources/js/app.jsx'])
@inertia
```

---

## Exceptions

During a transitional migration period, you may temporarily include both assets while migrating routes. Remove the dual loading as soon as the migration is complete.

---

## Consequences Of Violation

Performance risks: doubled JavaScript payload on every page, slower load times. Scalability risks: bandwidth waste at scale.

---

## Rule: Documented Stack Boundary

Document which route prefix belongs to which stack and make it discoverable by every developer.

---

## Category

Maintainability

---

## Rule

Maintain an explicit, version-controlled document mapping route prefixes to their assigned stack (Livewire or Inertia). Include this in the project README or a dedicated architecture document. Every pull request touching routes must respect this boundary.

---

## Reason

Without documented boundaries, developers add new routes to the wrong stack, introduce mixed pages, or duplicate functionality. Explicit documentation prevents architectural drift, onboarding confusion, and reduces code review friction.

---

## Bad Example

```
No documentation. Developers must guess which stack to use by inspecting existing route files.
```

---

## Good Example

```
## Route Stack Assignment
- `/admin/*` → Livewire (CRUD, admin panels)
- `/app/*` → Inertia (user-facing dashboard, analytics)
- `/public/*` → Inertia + SSR (marketing, landing pages)
New routes must follow the prefix-based assignment.
```

---

## Exceptions

For small teams or solo projects where all developers know the boundary implicitly, a brief comment in the route file header is sufficient.

---

## Consequences Of Violation

Maintenance risks: architectural drift, routes added to wrong stack, difficult onboarding. Scalability risks: as team grows, confusion about which stack to use multiplies.

---

## Rule: No Duplicated Business Logic

Extract shared business logic into services, actions, or repositories consumable by both stacks.

---

## Architecture

Architecture

---

## Rule

When both stacks need the same data or operation, implement it once in a shared service class. Never duplicate the same query, calculation, or business rule in both a Livewire component and an Inertia controller.

---

## Reason

Duplicated logic inevitably diverges — one stack gets a bug fix while the other doesn't, or behavior differs between stacks. Centralizing business logic into service/action classes ensures consistency, simplifies testing, and reduces maintenance.

---

## Bad Example

```php
// Livewire component
public function mount(): void {
    $this->stats = [
        'users' => User::count(),    // duplicated query
        'revenue' => Order::sum('total'), // duplicated query
    ];
}

// Inertia controller
public function index(): Response {
    return Inertia::render('Dashboard', [
        'stats' => [
            'users' => User::count(),    // same query duplicated
            'revenue' => Order::sum('total'), // same query duplicated
        ],
    ]);
}
```

---

## Good Example

```php
class DashboardService
{
    public function stats(): array
    {
        return [
            'users' => User::count(),
            'revenue' => Order::sum('total'),
        ];
    }
}

// Both stacks call DashboardService
```

---

## Exceptions

Presentational transformations (formatting dates, truncating text) that are specific to each stack's rendering layer may remain in the component/controller. The underlying data retrieval must be shared.

---

## Consequences Of Violation

Maintenance risks: fixes must be applied in multiple places. Reliability risks: divergent behavior between stacks. Testing risks: duplicated test coverage.
